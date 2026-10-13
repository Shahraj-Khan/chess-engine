
import { Position } from "../core/position.js";
import { Piece, pieceType, PieceType } from "../core/piece.js";
import { Move, MoveType } from "../move/move.js";

const PIECE_VALUES: Record<number, number> = {
  [Piece.None]: 0,
  [Piece.WhitePawn]: 100,
  [Piece.BlackPawn]: 100,
  [Piece.WhiteKnight]: 320,
  [Piece.BlackKnight]: 320,
  [Piece.WhiteBishop]: 330,
  [Piece.BlackBishop]: 330,
  [Piece.WhiteRook]: 500,
  [Piece.BlackRook]: 500,
  [Piece.WhiteQueen]: 900,
  [Piece.BlackQueen]: 900,
  [Piece.WhiteKing]: 20_000,
  [Piece.BlackKing]: 20_000,
};

export function scoreMove(position: Position, move: Move): number {
  if (move.type === MoveType.PROMOTION) {
    const promotedType = pieceType(
  move.promotionPiece as Piece
);
    const promotedValue =
      promotedType === PieceType.Queen ? 900 :
      promotedType === PieceType.Rook ? 500 :
      promotedType === PieceType.Bishop ? 330 :
      promotedType === PieceType.Knight ? 320 : 0;

    return 10_000 + promotedValue;
  }

  if (move.type === MoveType.EN_PASSANT) {
    return 5_100;
  }

  const attacker = position.pieceAt(move.from);
  const victim = position.pieceAt(move.to);

  if (victim !== Piece.None) {
    const victimValue = PIECE_VALUES[victim] ?? 0;
    const attackerValue = PIECE_VALUES[attacker] ?? 0;

    // MVV-LVA: prefer valuable victims and cheaper attackers.
    return 5_000 + victimValue * 10 - attackerValue;
  }

  return 0;
}

export function orderMoves(
  position: Position,
  moves: Move[]
): Move[] {
  return [...moves].sort(
    (a, b) => scoreMove(position, b) - scoreMove(position, a)
  );
}
