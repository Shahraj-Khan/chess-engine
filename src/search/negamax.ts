import { Position } from "../core/position.js";
import { Color } from "../core/color.js";
import { MoveGenerator } from "../move/move-generator.js";
import { makeMove, unmakeMove } from "../move/make-move.js";
import { evaluate } from "../evaluation/evaluate.js";
import { Move } from "../move/move.js";

export function negamax(position: Position, depth: number): number {
  if (depth === 0) {
    const score = evaluate(position);

    return position.sideToMove === Color.White ? score : -score;
  }

  let bestScore = -Infinity;

  const moves = MoveGenerator.generateLegalMoves(position);

if (moves.length === 0) {
  return MoveGenerator.isKingInCheck(position, position.sideToMove)
    ? -Infinity
    : 0;
}

  for (const move of moves) {
    const undoState = makeMove(position, move);

    const score = -negamax(position, depth - 1);

    unmakeMove(position, move, undoState);

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

export function findBestMove(
  position: Position,
  depth: number
): Move | null {
  const moves = MoveGenerator.generateLegalMoves(position);

  if (moves.length === 0) {
    return null;
  }

  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const undoState = makeMove(position, move);

    const score = -negamax(position, depth - 1);

    unmakeMove(position, move, undoState);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}