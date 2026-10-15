import { COLOR_NAMES, opposite } from '../game/chessUtils'
import type { Color, PieceSymbol } from '../game/types'
import { cx } from '../lib/cx'
import { CapturedPieces } from './CapturedPieces'
import { Piece } from './pieces/Piece'
import './PlayerCard.css'

export type PlayerBadgeTone = 'muted' | 'ok' | 'busy'

export interface PlayerBadge {
  readonly label: string
  readonly tone: PlayerBadgeTone
}

interface PlayerCardProps {
  readonly name: string
  readonly kind: 'human' | 'engine'
  readonly color: Color
  readonly active: boolean
  readonly gameOver: boolean
  /** Rating text, e.g. "Unrated". Never invent a number. */
  readonly rating: string
  /** Pieces this player has captured, most valuable first. */
  readonly captured: readonly PieceSymbol[]
  /** Material lead for this player in pawns (0 when level or behind). */
  readonly advantage: number
  readonly badge?: PlayerBadge
}

export function PlayerCard({
  name,
  kind,
  color,
  active,
  gameOver,
  rating,
  captured,
  advantage,
  badge,
}: PlayerCardProps) {
  const showTurn = active && !gameOver
  return (
    <section
      className={cx('player', showTurn && 'player--active')}
      aria-label={`${name}, playing ${COLOR_NAMES[color]}${showTurn ? ', to move' : ''}`}
    >
      <span className={cx('player__avatar', `player__avatar--${color}`)} aria-hidden="true">
        <Piece type={kind === 'engine' ? 'n' : 'k'} color={color} tone="ink" />
      </span>

      <div className="player__identity">
        <div className="player__name-row">
          <span className="player__name">{name}</span>
          {badge ? (
            <span className={cx('player__badge', `player__badge--${badge.tone}`)}>
              {badge.tone === 'busy' ? <span className="player__dots" aria-hidden="true" /> : null}
              {badge.label}
            </span>
          ) : null}
        </div>
        <span className="player__meta">
          {rating} · {COLOR_NAMES[color]}
        </span>
      </div>

      <CapturedPieces pieces={captured} color={opposite(color)} advantage={advantage} />

      <span className={cx('player__turn', showTurn && 'is-active')} aria-hidden={!showTurn}>
        <span className="player__turn-dot" aria-hidden="true" />
        To move
      </span>
    </section>
  )
}
