
import { Position } from "../core/position.js";
import { Move } from "../move/move.js";
import { MoveGenerator } from "../move/move-generator.js";
import { findBestMove } from "./negamax.js";
import { TranspositionTable } from "./transposition-table.js";

export interface IterativeDeepeningResult {
  bestMove: Move | null;
  completedDepth: number;
}

export function iterativeDeepening(
  position: Position,
  maxDepth: number
): IterativeDeepeningResult {
  const legalMoves = MoveGenerator.generateLegalMoves(position);

  if (legalMoves.length === 0 || maxDepth < 1) {
    return {
      bestMove: null,
      completedDepth: 0,
    };
  }

  const table = new TranspositionTable();

  let bestMove: Move | null = legalMoves[0] ?? null;
  let completedDepth = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const move = findBestMove(position, depth, table);

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
