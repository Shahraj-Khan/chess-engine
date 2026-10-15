import { SQUARES } from 'chess.js'
import type {
  BoardGrid,
  BoardPiece,
  Color,
  Move,
  PieceSymbol,
  PromotionPiece,
  Square,
} from './types'

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

export const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
}

export const COLOR_NAMES: Record<Color, string> = { w: 'White', b: 'Black' }

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

export const PROMOTION_PIECES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n']

export function opposite(color: Color): Color {
  return color === 'w' ? 'b' : 'w'
}

const SQUARE_INDEX: ReadonlyMap<Square, number> = new Map(
  SQUARES.map((square, index) => [square, index]),
)

/** Index into `SQUARES` / the board grid: rank 8 is row 0, file a is column 0. */
function indexOfSquare(square: Square): number {
  const index = SQUARE_INDEX.get(square)
  if (index === undefined) throw new RangeError(`Unknown square: ${square}`)
  return index
}

export function fileIndex(square: Square): number {
  return indexOfSquare(square) % 8
}

/** 0 for rank 8 … 7 for rank 1. */
export function rankIndex(square: Square): number {
  return Math.floor(indexOfSquare(square) / 8)
}

export function squareFromIndices(file: number, rank: number): Square {
  const square =
    file >= 0 && file < 8 && rank >= 0 && rank < 8 ? SQUARES[rank * 8 + file] : undefined
  if (!square) throw new RangeError(`Square out of range: file ${file}, rank ${rank}`)
  return square
}

export function isLightSquare(square: Square): boolean {
  // a1 is dark; h1 is light.
  return (fileIndex(square) + (8 - rankIndex(square))) % 2 === 0
}

export function pieceAt(board: BoardGrid, square: Square): BoardPiece | null {
  return board[rankIndex(square)]?.[fileIndex(square)] ?? null
}

export interface DisplayCell {
  readonly column: number
  readonly row: number
}

/** Where a square appears on screen (0-based) for the given board orientation. */
export function displayCell(square: Square, orientation: Color): DisplayCell {
  const file = fileIndex(square)
  const rank = rankIndex(square)
  return orientation === 'w'
    ? { column: file, row: rank }
    : { column: 7 - file, row: 7 - rank }
}

/** The 8×8 arrangement of squares as shown on screen, top row first. */
export function displayRows(orientation: Color): Square[][] {
  const rows: Square[][] = []
  for (let row = 0; row < 8; row += 1) {
    const cells: Square[] = []
    for (let column = 0; column < 8; column += 1) {
      cells.push(
        orientation === 'w'
          ? squareFromIndices(column, row)
          : squareFromIndices(7 - column, 7 - row),
      )
    }
    rows.push(cells)
  }
  return rows
}

export function moveToUci(move: Pick<Move, 'from' | 'to' | 'promotion'>): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`
}

const SQUARE_SET: ReadonlySet<string> = new Set(SQUARES)

export interface ParsedUci {
  readonly from: Square
  readonly to: Square
  readonly promotion: PromotionPiece | undefined
}

/** Parses long-algebraic (UCI) moves such as `e2e4` or `e7e8q`. Returns null when malformed. */
export function parseUci(uci: string): ParsedUci | null {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci.trim())
  if (!match) return null
  const [, from, to, promotion] = match
  if (!from || !to || !SQUARE_SET.has(from) || !SQUARE_SET.has(to)) return null
  return {
    from: from as Square,
    to: to as Square,
    promotion: promotion as PromotionPiece | undefined,
  }
}

/** Splits a SAN string into an optional leading piece letter and the remainder. */
export function splitSan(san: string): { piece: PieceSymbol | null; rest: string } {
  const first = san.charAt(0)
  if ('NBRQK'.includes(first) && first !== '') {
    return { piece: first.toLowerCase() as PieceSymbol, rest: san.slice(1) }
  }
  return { piece: null, rest: san }
}
