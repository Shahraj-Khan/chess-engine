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

if (pieceColor(piece) === Color.White) {
  score += value + bonus;
} else {
  score -= value + bonus;
}
  }

  return score;
}