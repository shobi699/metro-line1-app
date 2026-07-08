/**
 * Converts a list of objects into a Farsi-compatible UTF-8 BOM CSV string.
 * Automatically escapes internal double quotes and protects against CSV Injection.
 */
export function toCsv(
  rows: Record<string, any>[],
  columns: { key: string; label: string }[]
): string {
  const BOM = '\uFEFF'

  // Header row
  const header = columns
    .map((col) => `"${col.label.replace(/"/g, '""')}"`)
    .join(',')

  // Data rows
  const dataRows = rows.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key]
        if (val === null || val === undefined) {
          val = ''
        } else {
          val = String(val)
        }

        // CSV Injection mitigation: prefix single quote if starting with formula triggers
        if (
          val.startsWith('=') ||
          val.startsWith('+') ||
          val.startsWith('-') ||
          val.startsWith('@')
        ) {
          val = `'${val}`
        }

        return `"${val.replace(/"/g, '""')}"`
      })
      .join(',')
  })

  return BOM + [header, ...dataRows].join('\r\n')
}
