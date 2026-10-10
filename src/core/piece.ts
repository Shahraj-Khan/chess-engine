import { Color } from "./color.js";

export const PieceType = {
  None: 0,
  Pawn: 1,
  Knight: 2,
  Bishop: 3,
  Rook: 4,
  Queen: 5,
  King: 6,
} as const;
export type PieceType = (typeof PieceType)[keyof typeof PieceType];

/** A piece type that is not `None`. */
export type NonEmptyPieceType = Exclude<PieceType, typeof PieceType.None>;

/**
 * Piece encoding: bit 3 = color (0 white, 1 black), bits 0-2 = piece type.
 * `0` is an empty square. Valid values are 0, 1-6 and 9-14, so per-piece
 * lookup tables can be indexed directly with a piece value (size 15).
 */
export const Piece = {
  None: 0,
  WhitePawn: 1,
  WhiteKnight: 2,
  WhiteBishop: 3,
  WhiteRook: 4,
  WhiteQueen: 5,
  WhiteKing: 6,
  BlackPawn: 9,
  BlackKnight: 10,
  BlackBishop: 11,
  BlackRook: 12,
  BlackQueen: 13,
  BlackKing: 14,
} as const;
export type Piece = (typeof Piece)[keyof typeof Piece];

const COLOR_SHIFT = 3;
const TYPE_MASK = 0b111;

export function makePiece(color: Color, type: NonEmptyPieceType): Piece {
  return ((color << COLOR_SHIFT) | type) as Piece;
}

/** Color of a piece. The result is meaningless for `Piece.None`. */
export function pieceColor(piece: Piece): Color {
  return (piece >> COLOR_SHIFT) as Color;
}

export function pieceType(piece: Piece): PieceType {
  return (piece & TYPE_MASK) as PieceType;
}

/** True for the 12 real pieces; false for `None` and any garbage value. */
export function isValidPiece(piece: number): piece is Exclude<Piece, typeof Piece.None> {
  if (!Number.isInteger(piece) || piece < 1 || piece > 14) return false;
  const type = piece & TYPE_MASK;
  return type >= PieceType.Pawn && type <= PieceType.King;
}

/** Piece letters indexed by piece type; uppercase is applied for white. */
const TYPE_CHARS = ".pnbrqk";

/** FEN letter for a piece (uppercase white, lowercase black); "." for `None`. */
export function pieceToChar(piece: Piece): string {
  const ch = TYPE_CHARS.charAt(piece & TYPE_MASK);
  return pieceColor(piece) === Color.White ? ch.toUpperCase() : ch;
}

const CHAR_TO_PIECE: ReadonlyMap<string, Piece> = (() => {
  const map = new Map<string, Piece>();
  for (let type = PieceType.Pawn; type <= PieceType.King; type++) {
    for (const color of [Color.White, Color.Black] as const) {
      const piece = makePiece(color, type as NonEmptyPieceType);
      map.set(pieceToChar(piece), piece);
    }
  }
  return map;
})();

/** Parses a FEN piece letter; returns `undefined` for anything else. */
export function charToPiece(ch: string): Piece | undefined {
  return CHAR_TO_PIECE.get(ch);
}
