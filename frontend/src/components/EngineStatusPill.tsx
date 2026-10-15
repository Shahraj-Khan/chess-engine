import type { EngineStatus } from '../game/status'
import { cx } from '../lib/cx'
import './EngineStatusPill.css'

const LABELS: Record<EngineStatus, { long: string; short: string }> = {
  disconnected: { long: 'Engine disconnected', short: 'Offline' },
  connected: { long: 'Engine connected', short: 'Ready' },
  thinking: { long: 'Engine thinking', short: 'Thinking' },
}

interface EngineStatusPillProps {
  readonly status: EngineStatus
  readonly className?: string
  /** Announce changes to assistive technology. Enable on one instance only. */
  readonly live?: boolean
}

export function EngineStatusPill({ status, className, live = false }: EngineStatusPillProps) {
  const label = LABELS[status]
  return (
    <span className={cx('pill', `pill--${status}`, className)} role={live ? 'status' : undefined}>
      <span className="pill__dot" aria-hidden="true" />
      <span className="pill__long">{label.long}</span>
      <span className="pill__short" aria-hidden="true">
        {label.short}
      </span>
    </span>
  )
}
