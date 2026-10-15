import { PIECE_SHAPES } from './pieces/pieceShapes'

/** Brand mark: the lab's knight silhouette on a dark tile. */
export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg viewBox="0 0 100 100" focusable="false">
        {PIECE_SHAPES.n.body}
        <circle cx="40" cy="31" r="3.600" fill="#0e140d" />
      </svg>
    </span>
  )
}
