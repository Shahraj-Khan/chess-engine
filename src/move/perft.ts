import { Position } from "../core/position.js";
import { MoveGenerator } from "./move-generator.js";
import { makeMove, unmakeMove } from "./make-move.js";

export function perft(position: Position, depth: number): number {
  if (depth === 0) {
    return 1;
  }

  let nodes = 0;

  const moves = MoveGenerator.generateLegalMoves(position);

  for (const move of moves) {
    const undoState = makeMove(position, move);

    nodes += perft(position, depth - 1);

    unmakeMove(position, move, undoState);
  }

  return nodes;
}