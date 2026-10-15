import { Move, MoveType } from "../move/move.js";
import { MoveGenerator } from "../move/move-generator.js";

import { PieceType } from "../core/piece.js";
import { Position } from "../core/position.js";


export interface OpeningLine {
  name: string;
  moves: string[];
}

const OPENING_LINES: OpeningLine[] = [
  {
    name: "King's Gambit",
    moves: ["e2e4", "e7e5", "f2f4"],
  },
  {
    name: "Queen's Gambit",
    moves: ["d2d4", "d7d5", "c2c4"],
  },
  {
    name: "Evans Gambit",
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "b2b4"],
  },
];

function moveToUci(move: Move): string {
  const from = move.from;
  const to = move.to;

  const files = "abcdefgh";
  const fromSquare = files[from % 8] + (Math.floor(from / 8) + 1);
  const toSquare = files[to % 8] + (Math.floor(to / 8) + 1);

  if (move.type !== MoveType.PROMOTION) {
    return fromSquare + toSquare;
  }

  const promotionNames: Record<number, string> = {
    [PieceType.Queen]: "q",
    [PieceType.Rook]: "r",
    [PieceType.Bishop]: "b",
    [PieceType.Knight]: "n",
  };

  return fromSquare + toSquare + (promotionNames[move.promotionPiece] ?? "q");
}

export function findBookMove(
  position: Position,
  playedMoves: readonly string[],
): Move | null {
  const candidates = OPENING_LINES.filter(
    (line) =>
      line.moves.length > playedMoves.length &&
      playedMoves.every((move, index) => line.moves[index] === move),
  );

  if (candidates.length === 0) {
    return null;
  }

  const legalMoves = MoveGenerator.generateLegalMoves(position);
  const legalUciMoves = new Map(
    legalMoves.map((move) => [moveToUci(move), move]),
  );

  for (const line of candidates) {
    const nextMove = line.moves[playedMoves.length];
    if (!nextMove) continue;

    const legalMove = legalUciMoves.get(nextMove);
    if (legalMove) return legalMove;
  }

  return null;
}
