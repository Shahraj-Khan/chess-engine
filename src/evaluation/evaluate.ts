import { Position } from "../core/position.js";
import { Color } from "../core/color.js";
import { Piece, PieceType, pieceColor, pieceType } from "../core/piece.js";

export const PIECE_VALUES: Record<PieceType, number> = {
  [PieceType.None]: 0,
  [PieceType.Pawn]: 100,
  [PieceType.Knight]: 320,
  [PieceType.Bishop]: 330,
  [PieceType.Rook]: 500,
  [PieceType.Queen]: 900,
  [PieceType.King]: 0,
};

const KNIGHT_POSITION_BONUS: Record<number, number> = {
  18: 20, // c3
  19: 30, // d3
  20: 30, // e3
  21: 20, // f3

  26: 30, // c4
  27: 40, // d4
  28: 40, // e4
  29: 30, // f4

  34: 30, // c5
  35: 40, // d5
  36: 40, // e5
  37: 30, // f5

  42: 20, // c6
  43: 30, // d6
  44: 30, // e6
  45: 20, // f6
};

const BISHOP_POSITION_BONUS: Record<number, number> = {
  18: 10, // c3
  19: 15, // d3
  20: 15, // e3
  21: 10, // f3

  26: 15, // c4
  27: 20, // d4
  28: 20, // e4
  29: 15, // f4

  34: 15, // c5
  35: 20, // d5
  36: 20, // e5
  37: 15, // f5

  42: 10, // c6
  43: 15, // d6
  44: 15, // e6
  45: 10, // f6
};

const ROOK_POSITION_BONUS: Record<number, number> = {
  0: 20,  // a1
  1: 15,  // b1
  2: 10,  // c1
  3: 10,  // d1
  4: 10,  // e1
  5: 10,  // f1
  6: 15,  // g1
  7: 20,  // h1

  8: 10,  // a2
  9: 5,   // b2
  10: 5,  // c2
  11: 5,  // d2
  12: 5,  // e2
  13: 5,  // f2
  14: 5,  // g2
  15: 10, // h2

  48: 10, // a7
  49: 5,  // b7
  50: 5,  // c7
  51: 5,  // d7
  52: 5,  // e7
  53: 5,  // f7
  54: 5,  // g7
  55: 10, // h7

  56: 20, // a8
  57: 15, // b8
  58: 10, // c8
  59: 10, // d8
  60: 10, // e8
  61: 10, // f8
  62: 15, // g8
  63: 20, // h8
};

const QUEEN_POSITION_BONUS: Record<number, number> = {
  18: 5,  // c3
  19: 10, // d3
  20: 10, // e3
  21: 5,  // f3

  26: 10, // c4
  27: 15, // d4
  28: 15, // e4
  29: 10, // f4

  34: 10, // c5
  35: 15, // d5
  36: 15, // e5
  37: 10, // f5

  42: 5,  // c6
  43: 10, // d6
  44: 10, // e6
  45: 5,  // f6
};


export function evaluate(position: Position): number {
  let score = 0;

  for (let square = 0; square < 64; square++) {
    const piece = position.pieceAt(square);

    if (piece === Piece.None) {
      continue;
    }

const value = PIECE_VALUES[pieceType(piece)];

let bonus = 0;

if (pieceType(piece) === PieceType.Knight) {
  bonus = KNIGHT_POSITION_BONUS[square] ?? 0;
}

if (pieceType(piece) === PieceType.Bishop) {
  bonus = BISHOP_POSITION_BONUS[square] ?? 0;
}

if (pieceType(piece) === PieceType.Rook) {
  bonus = ROOK_POSITION_BONUS[square] ?? 0;
}
if (pieceType(piece) === PieceType.Queen) {
  bonus = QUEEN_POSITION_BONUS[square] ?? 0;
}


if (pieceColor(piece) === Color.White) {
  score += value + bonus;
} else {
  score -= value + bonus;
}
  }

const kingSafety = evaluateKingSafety(position);

score += kingSafety;

return score;

}

function evaluateKingSafety(position: Position): number {
  let pieceCount = 0;

  for (let square = 0; square < 64; square++) {
    if (position.pieceAt(square) !== Piece.None) {
      pieceCount++;
    }
  }

  if (pieceCount <= 10) {
    return 0;
  }

  const whiteKingSafety =
    position.pieceAt(6) === Piece.WhiteKing ? 30 : 0;


  const whiteKingExposed =
    position.pieceAt(4) === Piece.WhiteKing &&
    position.pieceAt(5) === Piece.None &&
    position.pieceAt(6) === Piece.None
      ? -350
      : 0;

  return whiteKingSafety + whiteKingExposed;
}