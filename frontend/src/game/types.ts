import type { Color, Move, PieceSymbol, Square } from 'chess.js'

export type { Color, Move, PieceSymbol, Square }

/** Pieces a pawn may promote to. */
export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export interface BoardPiece {
  readonly type: PieceSymbol
  readonly color: Color
}

/** Rows run from rank 8 (index 0) down to rank 1; columns run from file a to h. */
export type BoardGrid = ReadonlyArray<ReadonlyArray<BoardPiece | null>>

export type DrawReason =
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move-rule'
  | 'other'

export type GameResult =
  | { readonly kind: 'checkmate'; readonly winner: Color }
  | { readonly kind: 'stalemate' }
  | { readonly kind: 'draw'; readonly reason: DrawReason }

export interface GameSnapshot {
  readonly fen: string
  readonly pgn: string
  readonly turn: Color
  readonly board: BoardGrid
  /** Verbose move history, oldest first. */
  readonly history: readonly Move[]
  readonly lastMove: Move | null
  readonly inCheck: boolean
  /** Square of the king that is currently in check, if any. */
  readonly checkSquare: Square | null
  readonly result: GameResult | null
}

export interface SquarePair {
  readonly from: Square
  readonly to: Square
}

/** Describes the slide animation for the move that was just played (king and rook when castling). */
export interface MoveAnimation {
  readonly id: number
  readonly moves: readonly SquarePair[]
}

export interface PendingPromotion {
  readonly from: Square
  readonly to: Square
  readonly color: Color
}

export interface MaterialSummary {
  /** Positive when White is ahead, negative when Black is ahead. */
  readonly balance: number
  /** Black pieces captured by White, most valuable first. */
  readonly capturedByWhite: readonly PieceSymbol[]
  /** White pieces captured by Black, most valuable first. */
  readonly capturedByBlack: readonly PieceSymbol[]
}
