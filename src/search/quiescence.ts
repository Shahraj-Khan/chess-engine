import { Position } from "../core/position.js";
import { Color } from "../core/color.js";
import { Piece } from "../core/piece.js";
import { MoveGenerator } from "../move/move-generator.js";
import { makeMove, unmakeMove } from "../move/make-move.js";
import { evaluate } from "../evaluation/evaluate.js";
import { MoveType } from "../move/move.js";

export function quiescence(
  position: Position,
  alpha: number = -Infinity,
  beta: number = Infinity
): number {
  const inCheck = MoveGenerator.isKingInCheck(
    position,
    position.sideToMove
  );

  const legalMoves = MoveGenerator.generateLegalMoves(position);

  if (legalMoves.length === 0) {
    return inCheck ? -Infinity : 0;
  }

  const evaluation = evaluate(position);
  const standPat =
    position.sideToMove === Color.White
      ? evaluation
      : -evaluation;

  if (!inCheck) {
    if (standPat >= beta) {
      return beta;
    }

    alpha = Math.max(alpha, standPat);
  }

  const tacticalMoves = inCheck
    ? legalMoves
    : legalMoves.filter((move) => {
        const targetPiece = position.pieceAt(move.to);

        return (
          targetPiece !== Piece.None ||
          move.type === MoveType.EN_PASSANT ||
          move.type === MoveType.PROMOTION
        );
      });

  for (const move of tacticalMoves) {
    const undoState = makeMove(position, move);

    const score = -quiescence(position, -beta, -alpha);

    unmakeMove(position, move, undoState);

    if (score >= beta) {
      return beta;
    }

    alpha = Math.max(alpha, score);
  }

  return alpha;
}
