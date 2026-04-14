import * as XLSX from 'xlsx'

export type SpreadsheetRow = Record<string, string>

type SpreadsheetPrimitive = string | number | boolean | null | undefined

export interface SpreadsheetTemplateColumn {
  header: string
  example: SpreadsheetPrimitive
  width?: number
  dropdownOptions?: readonly string[]
  promptTitle?: string
  prompt?: string
}

interface SpreadsheetTemplateOptions {
  filename: string
  sheetName: string
  columns: SpreadsheetTemplateColumn[]
  totalRows?: number
}

export function normalizeSpreadsheetHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function normalizeCell(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function toArrayBuffer(buffer: ArrayBuffer | Uint8Array) {
  const source = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const copy = new ArrayBuffer(source.byteLength)
  new Uint8Array(copy).set(source)
  return copy
}

function downloadBuffer(filename: string, buffer: ArrayBuffer | Uint8Array, mimeType: string) {
  if (typeof window === 'undefined') return

  const blob = new Blob([toArrayBuffer(buffer)], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function getSpreadsheetValue(row: SpreadsheetRow, aliases: readonly string[]) {
  for (const alias of aliases) {
    const value = row[normalizeSpreadsheetHeader(alias)]
    if (value !== undefined) {
      return value
    }
  }

  return ''
}

export async function downloadSpreadsheetTemplate({
  filename,
  sheetName,
  columns,
  totalRows = 200,
}: SpreadsheetTemplateOptions) {
  if (typeof window === 'undefined') return

  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.header,
    width: column.width ?? Math.max(column.header.length + 4, 18),
  }))

  worksheet.addRow(columns.map((column) => column.example ?? ''))
  worksheet.autoFilter = {
    from: 'A1',
    to: { row: 1, column: columns.length },
  }

  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 22

  const sampleRow = worksheet.getRow(2)
  sampleRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF8FAFC' },
    }
    cell.font = { italic: true, color: { argb: 'FF334155' } }
  })

  for (let rowIndex = 3; rowIndex <= totalRows; rowIndex += 1) {
    worksheet.getRow(rowIndex)
  }

  columns.forEach((column, index) => {
    const excelColumn = worksheet.getColumn(index + 1)
    excelColumn.alignment = { vertical: 'top', wrapText: true }

    if (!column.dropdownOptions?.length) {
      return
    }

    const formula = `"${column.dropdownOptions.join(',')}"`

    for (let rowIndex = 2; rowIndex <= totalRows; rowIndex += 1) {
      worksheet.getCell(rowIndex, index + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        showInputMessage: Boolean(column.prompt || column.promptTitle),
        errorStyle: 'error',
        errorTitle: `Invalid ${column.header}`,
        error: `Select a value from the ${column.header} list.`,
        promptTitle: column.promptTitle,
        prompt: column.prompt,
        formulae: [formula],
      }
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBuffer(
    filename,
    buffer as ArrayBuffer | Uint8Array,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
}

export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]

  if (!firstSheetName) return []

  const worksheet = workbook.Sheets[firstSheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  })

  return rawRows.map((row) => {
    const normalized: SpreadsheetRow = {}

    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeSpreadsheetHeader(key)] = normalizeCell(value)
    }

    return normalized
  })
}

export function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
