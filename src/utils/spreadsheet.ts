import * as XLSX from 'xlsx'

export type SpreadsheetRow = Record<string, string>

function normalizeHeader(header: string) {
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
      normalized[normalizeHeader(key)] = normalizeCell(value)
    }

    return normalized
  })
}

export function toNumberOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
