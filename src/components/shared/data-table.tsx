'use client'

import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  mono?: boolean
  live?: boolean
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  stickyHeader?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'داده‌ای یافت نشد',
  stickyHeader = true,
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
          <tr className="border-b border-border bg-inverse-surface text-inverse-on-surface font-label-md">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-start text-xs font-medium',
                  stickyHeader && 'sticky top-0 z-10',
                )}
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
              className={cn(
                'border-b border-border-subtle transition-colors hover:bg-surface-hover',
                i % 2 === 0 ? 'bg-background' : 'bg-background-subtle',
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-3 py-2.5', col.live && 'live-cell')}
                >
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
