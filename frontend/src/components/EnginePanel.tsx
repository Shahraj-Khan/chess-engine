import { useId, useState } from 'react'
import type { EngineConnection, SearchLimits } from '../engine/engineClient'
import type { LastSearch } from '../engine/useEngine'
import {
  EMPTY_VALUE,
  formatMoveTime,
  formatNodes,
  formatNps,
  formatScore,
  formatTime,
} from '../engine/format'
import type { EngineStatus } from '../game/status'
import { cx } from '../lib/cx'
import { EngineStatusPill } from './EngineStatusPill'
import { AlertIcon, ChevronIcon, ChipIcon } from './icons'
import './EnginePanel.css'

interface EnginePanelProps {
  readonly status: EngineStatus
  readonly connection: EngineConnection
  readonly lastSearch: LastSearch | null
  readonly error: string | null
  readonly limits: SearchLimits
  /** Start expanded? Defaults to true on wide screens. */
  readonly defaultOpen?: boolean
}

interface StatProps {
  readonly label: string
  readonly value: string
  readonly emphasis?: boolean
}

function Stat({ label, value, emphasis }: StatProps) {
  return (
    <div className="stat">
      <dt className="stat__label">{label}</dt>
      <dd className={cx('stat__value', value === EMPTY_VALUE && 'is-empty', emphasis && 'is-emphasis')}>
        {value}
      </dd>
    </div>
  )
}

function initialOpen(): boolean {
  return typeof window === 'undefined' ? true : window.innerWidth >= 1020
}

export function EnginePanel({
  status,
  connection,
  lastSearch,
  error,
  limits,
  defaultOpen,
}: EnginePanelProps) {
  const [open, setOpen] = useState(defaultOpen ?? initialOpen())
  const bodyId = useId()
  const info = lastSearch?.info
  const connected = connection.state === 'connected'

  return (
    <section className="panel engine" aria-labelledby={`${bodyId}-title`}>
      <div className="panel__header">
        <h2 className="panel__title engine__title" id={`${bodyId}-title`}>
          <ChipIcon />
          Engine console
        </h2>
        <div className="engine__header-actions">
          <EngineStatusPill status={status} />
          <button
            type="button"
            className="btn btn--ghost btn--icon engine__toggle"
            aria-expanded={open}
            aria-controls={bodyId}
            aria-label={open ? 'Collapse engine console' : 'Expand engine console'}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronIcon className={cx('engine__chevron', open && 'is-open')} />
          </button>
        </div>
      </div>

      <div className="engine__body" id={bodyId} hidden={!open}>
        {!connected ? (
          <div className="engine__notice">
            <p className="engine__notice-title">Not connected</p>
            <p>
              {connection.detail ?? 'No engine bridge is configured.'} The board is playable locally.
              Search statistics appear here only when an engine returns them.
            </p>
          </div>
        ) : null}

        {connected && connection.engineName ? (
          <p className="engine__name">{connection.engineName}</p>
        ) : null}

        {error ? (
          <div className="engine__error" role="alert">
            <AlertIcon />
            <p>{error}</p>
          </div>
        ) : null}

        {status === 'thinking' ? (
          <div className="engine__progress" role="progressbar" aria-label="Engine is searching" />
        ) : null}

        <dl className="engine__stats">
          <Stat label="Depth" value={info?.depth === undefined ? EMPTY_VALUE : String(info.depth)} />
          <Stat label="Time" value={formatTime(info?.timeMs)} />
          <Stat label="Nodes" value={formatNodes(info?.nodes)} />
          <Stat label="Speed" value={formatNps(info?.nps)} />
          <Stat label="Best move" value={lastSearch?.bestMove ?? EMPTY_VALUE} emphasis />
          <Stat label="Evaluation" value={formatScore(info?.score)} emphasis />
        </dl>

        <div className="engine__pv">
          <span className="stat__label">Principal variation</span>
          <p className={cx('engine__pv-line', !info?.pv?.length && 'is-empty')}>
            {info?.pv?.length ? info.pv.join(' ') : EMPTY_VALUE}
          </p>
        </div>

        <p className="engine__limits">
          Next search · depth {limits.depth} · {formatMoveTime(limits.moveTimeMs).toLowerCase()}
        </p>
      </div>
    </section>
  )
}
