type CsvPrimitive = string | number | boolean | null | undefined

export type CsvRow = Record<string, CsvPrimitive>

function escapeCsvValue(value: CsvPrimitive) {
  if (value === null || value === undefined) return ''

  const normalized = String(value).replace(/\r?\n|\r/g, ' ')
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }

  return normalized
}

export function downloadCsv(filename: string, rows: CsvRow[]) {
  if (!rows.length || typeof window === 'undefined') return

  const headers = Object.keys(rows[0])
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ].join('\n')

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
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
