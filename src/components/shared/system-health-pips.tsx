import { StatusPip } from './status-pip'

interface SystemHealthPipsProps {
  radio?: 'ok' | 'warn' | 'error'
  network?: 'ok' | 'warn' | 'error'
  server?: 'ok' | 'warn' | 'error'
  className?: string
}

export function SystemHealthPips({
  radio = 'ok',
  network = 'ok',
  server = 'ok',
  className,
}: SystemHealthPipsProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 ${className ?? ''}`}
    >
      <StatusPip status={radio} label="RAD" pulse={radio !== 'ok'} />
      <div className="w-px h-3 bg-outline-variant" />
      <StatusPip status={network} label="NET" pulse={network !== 'ok'} />
      <div className="w-px h-3 bg-outline-variant" />
      <StatusPip status={server} label="SRV" pulse={server !== 'ok'} />
    </div>
  )
}
