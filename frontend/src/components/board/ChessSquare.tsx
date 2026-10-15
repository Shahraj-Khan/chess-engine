import { memo } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { COLOR_NAMES, PIECE_NAMES, isLightSquare } from '../../game/chessUtils'
import type { BoardPiece, Square } from '../../game/types'
import { cx } from '../../lib/cx'
import { Piece } from '../pieces/Piece'

export type TargetKind = 'move' | 'capture'

export interface SlideOffset {
  /** Animation id; a new id restarts the slide. */
  readonly id: number
  /** Starting offset in squares, relative to the final position. */
  readonly dx: number
  readonly dy: number
}

interface ChessSquareProps {
  readonly square: Square
  readonly piece: BoardPiece | null
  readonly rankLabel: string | null
  readonly fileLabel: string | null
  readonly selected: boolean
  readonly lastMove: boolean
  readonly inCheck: boolean
  readonly target: TargetKind | null
  readonly tabbable: boolean
  readonly draggable: boolean
  readonly dragging: boolean
  readonly slide: SlideOffset | null
  readonly onSelect: (square: Square) => void
  readonly onFocusSquare: (square: Square) => void
  readonly onDragStartSquare: (square: Square, event: DragEvent<HTMLDivElement>) => void
  readonly onDragEndSquare: () => void
}

function describeSquare(
  square: Square,
  piece: BoardPiece | null,
  selected: boolean,
  target: TargetKind | null,
  inCheck: boolean,
): string {
  const parts: string[] = [
    piece ? `${square}, ${COLOR_NAMES[piece.color]} ${PIECE_NAMES[piece.type]}` : `${square}, empty`,
  ]
  if (selected) parts.push('selected')
  if (target === 'capture') parts.push('capture available')
  if (target === 'move') parts.push('legal move')
  if (inCheck) parts.push('king in check')
  return parts.join(', ')
}

function ChessSquareView({
  square,
  piece,
  rankLabel,
  fileLabel,
  selected,
  lastMove,
  inCheck,
  target,
  tabbable,
  draggable,
  dragging,
  slide,
  onSelect,
  onFocusSquare,
  onDragStartSquare,
  onDragEndSquare,
}: ChessSquareProps) {
  const slideStyle: CSSProperties | undefined = slide
    ? ({ '--dx': slide.dx, '--dy': slide.dy } as CSSProperties)
    : undefined

  return (
    <div
      role="gridcell"
      className={cx('square', isLightSquare(square) ? 'square--light' : 'square--dark')}
      data-square={square}
      data-selected={selected || undefined}
      data-last={lastMove || undefined}
      data-check={inCheck || undefined}
      data-target={target ?? undefined}
      tabIndex={tabbable ? 0 : -1}
      aria-label={describeSquare(square, piece, selected, target, inCheck)}
      aria-selected={selected}
      onClick={() => onSelect(square)}
      onFocus={() => onFocusSquare(square)}
    >
      <span className="square__hl" aria-hidden="true" />
      {rankLabel ? (
        <span className="square__coord square__coord--rank" aria-hidden="true">
          {rankLabel}
        </span>
      ) : null}
      {fileLabel ? (
        <span className="square__coord square__coord--file" aria-hidden="true">
          {fileLabel}
        </span>
      ) : null}
      {piece ? (
        <div
          key={slide ? `slide-${slide.id}` : 'still'}
          className={cx('square__piece', dragging && 'is-dragging')}
          data-slide={slide ? '' : undefined}
          data-draggable={draggable || undefined}
          style={slideStyle}
          draggable={draggable}
          onDragStart={(event) => onDragStartSquare(square, event)}
          onDragEnd={onDragEndSquare}
        >
          <Piece type={piece.type} color={piece.color} />
        </div>
      ) : null}
      {target ? <span className="square__hint" aria-hidden="true" /> : null}
    </div>
  )
}

export const ChessSquare = memo(ChessSquareView)
