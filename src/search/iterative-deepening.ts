import { Position } from "../core/position.js";
import { Move } from "../move/move.js";
import { MoveGenerator } from "../move/move-generator.js";
import { findBestMove } from "./negamax.js";

export interface IterativeDeepeningResult {
  bestMove: Move | null;
  completedDepth: number;
}

export function iterativeDeepening(
  position: Position,
  maxDepth: number
): IterativeDeepeningResult {
  const legalMoves = MoveGenerator.generateLegalMoves(position);

  if (legalMoves.length === 0) {
    return {
      bestMove: null,
      completedDepth: 0,
    };
  }

  let bestMove: Move | null = legalMoves[0];
  let completedDepth = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const move = findBestMove(position, depth);

    if (move !== null) {
      bestMove = move;
      completedDepth = depth;
    }
  }

  return {
    bestMove,
    completedDepth,
  };
}
