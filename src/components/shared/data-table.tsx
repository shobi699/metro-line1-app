'use client'

interface Column<T> {
  key: string
  header: string
  mono?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'داده‌ای یافت نشد',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <p className="text-sm text-foreground-muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm" aria-label="جدول داده">
        <thead>
          <tr className="border-b border-border bg-background-subtle text-foreground-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2.5 text-start text-xs font-medium"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr
              key={i}
              className="border-b border-border-subtle px-3 py-2.5 hover:bg-surface-hover"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5">
                  {col.render
                    ? col.render(item)
                    : col.mono ? (
                      <span className="font-mono text-xs">
                        {String(item[col.key] ?? '')}
                      </span>
                    ) : (
                      <span>{String(item[col.key] ?? '')}</span>
                    )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
