import { useEffect, useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { COLOR_NAMES, PIECE_NAMES, PROMOTION_PIECES } from '../../game/chessUtils'
import type { Color, PromotionPiece } from '../../game/types'
import { Piece } from '../pieces/Piece'

interface PromotionPickerProps {
  readonly color: Color
  readonly onSelect: (piece: PromotionPiece) => void
  readonly onCancel: () => void
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function PromotionPicker({ color, onSelect, onCancel }: PromotionPickerProps) {
  const firstOption = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstOption.current?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
  }

  return (
    <div
      className="board-overlay promotion"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a piece to promote to"
      onKeyDown={handleKeyDown}
    >
      <div className="promotion__card">
        <h2 className="promotion__title">Promote your pawn</h2>
        <div className="promotion__options">
          {PROMOTION_PIECES.map((piece, index) => (
            <button
              key={piece}
              ref={index === 0 ? firstOption : undefined}
              type="button"
              className="promotion__option"
              onClick={() => onSelect(piece)}
              aria-label={`Promote to ${COLOR_NAMES[color]} ${PIECE_NAMES[piece]}`}
            >
              <span className="promotion__piece">
                <Piece type={piece} color={color} />
              </span>
              <span className="promotion__label">{capitalise(PIECE_NAMES[piece])}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--ghost promotion__cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
