import type { GameStatusMessage } from '../../game/status'
import { CloseIcon, CrownIcon, DrawIcon } from '../icons'

interface GameOverBannerProps {
  readonly message: GameStatusMessage
  readonly onNewGame: () => void
  readonly onDismiss: () => void
}

export function GameOverBanner({ message, onNewGame, onDismiss }: GameOverBannerProps) {
  const Icon = message.icon === 'flag' ? CrownIcon : DrawIcon
  return (
    <div className="board-overlay game-over" role="group" aria-label="Game over">
      <span className="game-over__icon">
        <Icon />
      </span>
      <div className="game-over__text">
        <span className="game-over__title">{message.title}</span>
        <span className="game-over__detail">{message.detail}</span>
      </div>
      <div className="game-over__actions">
        <button type="button" className="btn btn--primary" onClick={onNewGame}>
          New game
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon"
          onClick={onDismiss}
          aria-label="Dismiss and review the final position"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}
