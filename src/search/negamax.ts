
import { Position } from "../core/position.js";
import { MoveGenerator } from "../move/move-generator.js";
import { makeMove, unmakeMove } from "../move/make-move.js";
import { Move } from "../move/move.js";
import { quiescence } from "./quiescence.js";
import { orderMoves } from "./move-ordering.js";
import {
  TranspositionTable,
  TTBound,
} from "./transposition-table.js";
import { computeZobristHash } from "./zobrist.js";

export interface SearchStats {
  nodes: number;
  ttHits: number;
  ttCutoffs: number;
  betaCutoffs: number;
}

export function createSearchStats(): SearchStats {
  return {
    nodes: 0,
    ttHits: 0,
    ttCutoffs: 0,
    betaCutoffs: 0,
  };
}

const MATE_SCORE = Infinity;

const defaultTable = new TranspositionTable();

export function negamax(
  position: Position,
  depth: number,
  alpha: number = -Infinity,
  beta: number = Infinity,
  table: TranspositionTable = defaultTable,
  stats?: SearchStats
): number {
  if (stats) {
    stats.nodes++;
  }

  const originalAlpha = alpha;
  const originalBeta = beta;
  const hash = computeZobristHash(position);

  const cached = table.probe(hash);

  if (cached && cached.depth >= depth) {
    if (stats) {
      stats.ttHits++;
    }

    if (cached.bound === TTBound.Exact) {
      return cached.score;
    }

    if (cached.bound === TTBound.LowerBound) {
      alpha = Math.max(alpha, cached.score);
    } else if (cached.bound === TTBound.UpperBound) {
      beta = Math.min(beta, cached.score);
    }

    if (alpha >= beta) {
      if (stats) {
        stats.ttCutoffs++;
      }

      return cached.score;
    }
  }

  if (depth <= 0) {
    return quiescence(position, alpha, beta);
  }

  let bestScore = -Infinity;
  let bestMove: Move | null = null;

  const moves = orderMoves(
    position,
    MoveGenerator.generateLegalMoves(position)
  );

  if (moves.length === 0) {
    return MoveGenerator.isKingInCheck(position, position.sideToMove)
      ? -MATE_SCORE
      : 0;
  }

  for (const move of moves) {
    const undoState = makeMove(position, move);

    const score = -negamax(
      position,
      depth - 1,
      -beta,
      -alpha,
      table,
      stats
    );

    unmakeMove(position, move, undoState);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }

    alpha = Math.max(alpha, score);

    if (alpha >= beta) {
      if (stats) {
        stats.betaCutoffs++;
      }

      break;
    }
  }

  let bound = TTBound.Exact;

  if (bestScore <= originalAlpha) {
    bound = TTBound.UpperBound;
  } else if (bestScore >= originalBeta) {
    bound = TTBound.LowerBound;
  }

  table.store({
    hash,
    depth,
    score: bestScore,
    bound,
    bestMove,
  });

  return bestScore;
}

export function findBestMove(
  position: Position,
  depth: number,
  table: TranspositionTable = defaultTable,
  stats?: SearchStats
): Move | null {
  const moves = MoveGenerator.generateLegalMoves(position);

  if (moves.length === 0) {
    return null;
  }

  const hash = computeZobristHash(position);
  const cached = table.probe(hash);

  const orderedMoves = orderMoves(position, moves);

  if (cached?.bestMove) {
    const index = orderedMoves.findIndex(
      (move) =>
        move.from === cached.bestMove!.from &&
        move.to === cached.bestMove!.to
    );

    if (index > 0) {
      const [ttMove] = orderedMoves.splice(index, 1);
      orderedMoves.unshift(ttMove!);
    }
  }

  let bestMove: Move | null = orderedMoves[0] ?? null;
  let bestScore = -Infinity;

  for (const move of orderedMoves) {
    const undoState = makeMove(position, move);

const score = -negamax(
  position,
  depth - 1,
  -Infinity,
  -bestScore,
  table,
  stats
);

    unmakeMove(position, move, undoState);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  table.store({
    hash,
    depth,
    score: bestScore,
    bound: TTBound.Exact,
    bestMove,
  });

  return bestMove;
}
