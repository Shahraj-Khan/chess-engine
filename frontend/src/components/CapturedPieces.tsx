import { PIECE_NAMES } from '../game/chessUtils'
import type { Color, PieceSymbol } from '../game/types'
import { Piece } from './pieces/Piece'
import './CapturedPieces.css'

interface CapturedPiecesProps {
  /** Types of the pieces that were captured, most valuable first. */
  readonly pieces: readonly PieceSymbol[]
  /** Colour of the captured pieces (the opponent's colour). */
  readonly color: Color
  /** Material lead for the capturing side; shown only when positive. */
  readonly advantage: number
}

export function CapturedPieces({ pieces, color, advantage }: CapturedPiecesProps) {
  if (pieces.length === 0 && advantage <= 0) return null

  const summary =
    pieces.length === 0
      ? 'No captures'
      : `Captured: ${pieces.map((piece) => PIECE_NAMES[piece]).join(', ')}`

  return (
    <div className="captured" role="img" aria-label={summary}>
      <span className={`captured__pieces captured__pieces--${color}`} aria-hidden="true">
        {pieces.map((piece, index) => (
          <span
            className="captured__piece"
            data-grouped={index > 0 && pieces[index - 1] === piece ? '' : undefined}
            key={`${piece}-${index}`}
          >
            <Piece type={piece} color={color} tone="ink" />
          </span>
        ))}
      </span>
      {advantage > 0 ? (
        <span className="captured__lead" aria-label={`Material advantage ${advantage}`}>
          +{advantage}
        </span>
      ) : null}
    </div>
  )
}
