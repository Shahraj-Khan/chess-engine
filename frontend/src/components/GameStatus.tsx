import type { GameStatusMessage, StatusIcon } from '../game/status'
import { cx } from '../lib/cx'
import { AlertIcon, ChipIcon, CrownIcon, DotIcon, DrawIcon } from './icons'
import './GameStatus.css'

interface GameStatusProps {
  readonly message: GameStatusMessage
  /** Secondary line about the engine connection. */
  readonly engineLine: string
}

function StatusGlyph({ icon }: { readonly icon: StatusIcon }) {
  switch (icon) {
    case 'check':
      return <AlertIcon />
    case 'flag':
      return <CrownIcon />
    case 'draw':
      return <DrawIcon />
    case 'engine':
      return <ChipIcon />
    case 'turn':
      return <DotIcon />
  }
}

export function GameStatus({ message, engineLine }: GameStatusProps) {
  return (
    <section className={cx('panel status', `status--${message.tone}`)} aria-label="Game status">
      <div role="status" aria-live="polite">
        <div className="status__main" key={message.title}>
          <span className="status__icon" aria-hidden="true">
            <StatusGlyph icon={message.icon} />
          </span>
          <div className="status__text">
            <p className="status__title">{message.title}</p>
            <p className="status__detail">{message.detail}</p>
          </div>
        </div>
      </div>
      <p className="status__engine">
        <span className="status__engine-dot" aria-hidden="true" />
        {engineLine}
      </p>
    </section>
  )
}
