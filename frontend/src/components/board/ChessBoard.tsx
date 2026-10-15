import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent, ReactNode } from 'react'
import { FILES, displayCell, displayRows, pieceAt } from '../../game/chessUtils'
import type {
  BoardGrid,
  Color,
  Move,
  MoveAnimation,
  Square,
  SquarePair,
} from '../../game/types'
import { ChessSquare } from './ChessSquare'
import type { SlideOffset, TargetKind } from './ChessSquare'
import './ChessBoard.css'

export interface ChessBoardProps {
  readonly board: BoardGrid
  readonly orientation: Color
  readonly turn: Color
  readonly selected: Square | null
  readonly legalTargets: ReadonlyMap<Square, readonly Move[]>
  readonly lastMove: SquarePair | null
  readonly checkSquare: Square | null
  readonly animation: MoveAnimation | null
  /** Whether the person at the board may currently pick up pieces. */
  readonly interactive: boolean
  readonly showCoordinates: boolean
  readonly showLegalMoves: boolean
  readonly animatePieces: boolean
  /** True while a promotion choice is open; the grid becomes inert behind it. */
  readonly modalOpen: boolean
  readonly onSelectSquare: (square: Square) => void
  readonly onEscape: () => void
  /** Overlays such as the promotion picker or game-over banner. */
  readonly children?: ReactNode
}

const ARROW_STEPS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

function targetKind(moves: readonly Move[] | undefined): TargetKind | null {
  if (!moves || moves.length === 0) return null
  return moves.some((move) => move.isCapture()) ? 'capture' : 'move'
}

export function ChessBoard({
  board,
  orientation,
  turn,
  selected,
  legalTargets,
  lastMove,
  checkSquare,
  animation,
  interactive,
  showCoordinates,
  showLegalMoves,
  animatePieces,
  modalOpen,
  onSelectSquare,
  onEscape,
  children,
}: ChessBoardProps) {
  const rows = useMemo(() => displayRows(orientation), [orientation])
  const [focusSquare, setFocusSquare] = useState<Square>('e2')
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const wasModalOpen = useRef(false)

  const focusElement = useCallback((square: Square) => {
    const element = gridRef.current?.querySelector<HTMLElement>(`[data-square="${square}"]`)
    element?.focus()
  }, [])

  // Give focus back to the board once the promotion picker closes.
  useEffect(() => {
    if (wasModalOpen.current && !modalOpen) focusElement(focusSquare)
    wasModalOpen.current = modalOpen
  }, [modalOpen, focusElement, focusSquare])

  const slides = useMemo(() => {
    const map = new Map<Square, SlideOffset>()
    if (!animation || !animatePieces) return map
    for (const { from, to } of animation.moves) {
      const start = displayCell(from, orientation)
      const end = displayCell(to, orientation)
      map.set(to, { id: animation.id, dx: start.column - end.column, dy: start.row - end.row })
    }
    return map
  }, [animation, animatePieces, orientation])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEPS[event.key]
    if (step) {
      event.preventDefault()
      const cell = displayCell(focusSquare, orientation)
      const column = Math.min(7, Math.max(0, cell.column + step[0]))
      const row = Math.min(7, Math.max(0, cell.row + step[1]))
      const next = rows[row]?.[column]
      if (next) {
        setFocusSquare(next)
        focusElement(next)
      }
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelectSquare(focusSquare)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      onEscape()
    }
  }

  const handleDragStart = useCallback(
    (square: Square, event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', square)
      // Dragging starts from a piece of the side to move; pick it up so its targets show.
      if (selected !== square) onSelectSquare(square)
      // Defer so the source fade does not cancel the drag in some browsers.
      window.setTimeout(() => setDraggingSquare(square), 0)
    },
    [onSelectSquare, selected],
  )

  const handleDragEnd = useCallback(() => setDraggingSquare(null), [])

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    const square = (event.target as HTMLElement).closest<HTMLElement>('[data-square]')?.dataset.square
    if (square && legalTargets.has(square as Square)) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    const square = (event.target as HTMLElement).closest<HTMLElement>('[data-square]')?.dataset.square
    if (!square || !legalTargets.has(square as Square)) return
    event.preventDefault()
    setDraggingSquare(null)
    onSelectSquare(square as Square)
  }

  return (
    <div className="board-frame">
      <div
        ref={gridRef}
        className="board"
        role="grid"
        aria-label="Chessboard"
        aria-describedby="board-help"
        inert={modalOpen}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {rows.map((rowSquares, rowIndex) => (
          <div className="board__row" role="row" key={rowSquares.join('-')}>
            {rowSquares.map((square, columnIndex) => {
              const piece = pieceAt(board, square)
              const canDrag = interactive && piece?.color === turn
              const rankLabel = orientation === 'w' ? 8 - rowIndex : rowIndex + 1
              const fileLabel =
                orientation === 'w' ? FILES[columnIndex] : FILES[7 - columnIndex]
              return (
                <ChessSquare
                  key={square}
                  square={square}
                  piece={piece}
                  rankLabel={showCoordinates && columnIndex === 0 ? String(rankLabel) : null}
                  fileLabel={showCoordinates && rowIndex === 7 ? (fileLabel ?? null) : null}
                  selected={selected === square}
                  lastMove={lastMove?.from === square || lastMove?.to === square}
                  inCheck={checkSquare === square}
                  target={showLegalMoves ? targetKind(legalTargets.get(square)) : null}
                  tabbable={focusSquare === square}
                  draggable={Boolean(canDrag)}
                  dragging={draggingSquare === square}
                  slide={slides.get(square) ?? null}
                  onSelect={onSelectSquare}
                  onFocusSquare={setFocusSquare}
                  onDragStartSquare={handleDragStart}
                  onDragEndSquare={handleDragEnd}
                />
              )
            })}
          </div>
        ))}
      </div>
      <p id="board-help" className="sr-only">
        Use the arrow keys to move between squares. Press Enter or Space to select a piece, then
        again on a highlighted square to move it. Press Escape to cancel.
      </p>
      {children}
    </div>
  )
}
