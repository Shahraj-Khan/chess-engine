import type { Color, PieceSymbol } from '../../game/types'
import { cx } from '../../lib/cx'
import { PIECE_SHAPES } from './pieceShapes'
import './Piece.css'

interface PieceProps {
  readonly type: PieceSymbol
  readonly color: Color
  /** `board` draws the full outlined piece; `ink` draws a flat silhouette in the current text colour. */
  readonly tone?: 'board' | 'ink'
  readonly className?: string
}

export function Piece({ type, color, tone = 'board', className }: PieceProps) {
  const shape = PIECE_SHAPES[type]
  const gradient = color === 'w' ? 'url(#nf-piece-white)' : 'url(#nf-piece-black)'

  return (
    <svg
      className={cx('piece', `piece--${color}`, `piece--${tone}`, className)}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      {tone === 'board' ? <g className="piece__outline">{shape.body}</g> : null}
      <g fill={tone === 'board' ? gradient : 'currentColor'}>{shape.body}</g>
      {tone === 'board' ? <g className="piece__detail">{shape.detail}</g> : null}
    </svg>
  )
}

/** Gradient definitions referenced by every board piece. Render once near the app root. */
export function PieceDefs() {
  return (
    <svg className="piece-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="nf-piece-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf3" />
          <stop offset="1" stopColor="#ddd3b6" />
        </linearGradient>
        <linearGradient id="nf-piece-black" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b4637" />
          <stop offset="1" stopColor="#171d15" />
        </linearGradient>
      </defs>
    </svg>
  )
}
