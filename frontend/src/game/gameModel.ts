import type { Chess } from 'chess.js'
import { PIECE_VALUES, opposite, squareFromIndices } from './chessUtils'
import type {
  BoardGrid,
  Color,
  GameResult,
  GameSnapshot,
  MaterialSummary,
  Move,
  MoveAnimation,
  PieceSymbol,
  Square,
} from './types'

/** Pure helpers that read from a chess.js instance. No UI state lives here. */

export function readResult(chess: Chess): GameResult | null {
  if (chess.isCheckmate()) return { kind: 'checkmate', winner: opposite(chess.turn()) }
  if (chess.isStalemate()) return { kind: 'stalemate' }
  if (chess.isDraw()) {
    if (chess.isInsufficientMaterial()) return { kind: 'draw', reason: 'insufficient-material' }
    if (chess.isThreefoldRepetition()) return { kind: 'draw', reason: 'threefold-repetition' }
    if (chess.isDrawByFiftyMoves()) return { kind: 'draw', reason: 'fifty-move-rule' }
    return { kind: 'draw', reason: 'other' }
  }
  return null
}

function findKing(board: BoardGrid, color: Color): Square | null {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank]?.[file]
      if (piece?.type === 'k' && piece.color === color) return squareFromIndices(file, rank)
    }
  }
  return null
}

export function readSnapshot(chess: Chess): GameSnapshot {
  const board: BoardGrid = chess.board()
  const history = chess.history({ verbose: true })
  const turn = chess.turn()
  const inCheck = chess.inCheck()
  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn,
    board,
    history,
    lastMove: history.at(-1) ?? null,
    inCheck,
    checkSquare: inCheck ? findKing(board, turn) : null,
    result: readResult(chess),
  }
}

export function groupMovesByTarget(moves: readonly Move[]): ReadonlyMap<Square, readonly Move[]> {
  const grouped = new Map<Square, Move[]>()
  for (const move of moves) {
    const existing = grouped.get(move.to)
    if (existing) existing.push(move)
    else grouped.set(move.to, [move])
  }
  return grouped
}

/** Squares the king and rook travel between when castling. */
function rookCastlingPath(move: Move): { from: Square; to: Square } | null {
  const rank = move.color === 'w' ? '1' : '8'
  if (move.isKingsideCastle()) return { from: `h${rank}`, to: `f${rank}` }
  if (move.isQueensideCastle()) return { from: `a${rank}`, to: `d${rank}` }
  return null
}

export function animationFor(move: Move, id: number): MoveAnimation {
  const rook = rookCastlingPath(move)
  return {
    id,
    moves: rook ? [{ from: move.from, to: move.to }, rook] : [{ from: move.from, to: move.to }],
  }
}

const ORDER_BY_VALUE = (a: PieceSymbol, b: PieceSymbol): number =>
  PIECE_VALUES[b] - PIECE_VALUES[a]

export function summariseMaterial(board: BoardGrid, history: readonly Move[]): MaterialSummary {
  let balance = 0
  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue
      balance += piece.color === 'w' ? PIECE_VALUES[piece.type] : -PIECE_VALUES[piece.type]
    }
  }

  const capturedByWhite: PieceSymbol[] = []
  const capturedByBlack: PieceSymbol[] = []
  for (const move of history) {
    if (!move.captured) continue
    if (move.color === 'w') capturedByWhite.push(move.captured)
    else capturedByBlack.push(move.captured)
  }

  return {
    balance,
    capturedByWhite: capturedByWhite.sort(ORDER_BY_VALUE),
    capturedByBlack: capturedByBlack.sort(ORDER_BY_VALUE),
  }
}

export interface MovePair {
  readonly number: number
  readonly white: Move | null
  readonly black: Move | null
}

/** Groups a flat ply list into numbered White/Black pairs. */
export function pairMoves(history: readonly Move[]): MovePair[] {
  const pairs: MovePair[] = []
  history.forEach((move, ply) => {
    if (move.color === 'w') {
      pairs.push({ number: Math.floor(ply / 2) + 1, white: move, black: null })
      return
    }
    const last = pairs.at(-1)
    if (last && last.white && !last.black) {
      pairs[pairs.length - 1] = { ...last, black: move }
    } else {
      // Black moved first (not possible from the standard start, but stay correct).
      pairs.push({ number: Math.floor(ply / 2) + 1, white: null, black: move })
    }
  })
  return pairs
}
