
import { Position } from "../core/position.js";
import { Move } from "../move/move.js";
import { MoveGenerator } from "../move/move-generator.js";
import { findBestMove } from "./negamax.js";
import { TranspositionTable } from "./transposition-table.js";
import {
  type SearchControl,
  SearchStoppedError,
} from "./search-control.js";

export interface IterativeDeepeningResult {
  bestMove: Move | null;
  completedDepth: number;
}

export function iterativeDeepening(
  position: Position,
  maxDepth: number,
  control?: SearchControl
): IterativeDeepeningResult {
  const legalMoves = MoveGenerator.generateLegalMoves(position);

  if (legalMoves.length === 0 || maxDepth < 1) {
    return {
      bestMove: null,
      completedDepth: 0,
    };
  }

  const table = new TranspositionTable();

  // Keep a legal fallback if the search stops before depth 1 completes.
  let bestMove: Move | null = legalMoves[0] ?? null;
  let completedDepth = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      const move = findBestMove(
        position,
        depth,
        table,
        undefined,
        control
      );

      if (move !== null) {
        bestMove = move;
        completedDepth = depth;
      }
    } catch (error) {
      if (error instanceof SearchStoppedError) {
        break;
      }

      throw error;
    }
  }

  return {
    bestMove,
    completedDepth,
  };
}
