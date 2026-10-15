import { Move, MoveType } from "../move/move.js";
import { MoveGenerator } from "../move/move-generator.js";
import { PieceType } from "../core/piece.js";
import { Position } from "../core/position.js";

export interface OpeningLine {
  name: string;
  moves: string[];
  weight: number;
}

const OPENING_LINES: OpeningLine[] = [
  {
    name: "King's Gambit",
    moves: ["e2e4", "e7e5", "f2f4"],
    weight: 3,
  },
  {
    name: "Queen's Gambit",
    moves: ["d2d4", "d7d5", "c2c4"],
    weight: 5,
  },
  {
    name: "Evans Gambit",
    moves: [
      "e2e4", "e7e5", "g1f3", "b8c6",
      "f1c4", "f8c5", "b2b4",
    ],
    weight: 2,
  },
  {
    name: "Italian Game",
    moves: ["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"],
    weight: 5,
  },
  {
    name: "Ruy Lopez",
    moves: [
      "e2e4", "e7e5", "g1f3", "b8c6", "f1b5",
    ],
    weight: 5,
  },
  {
    name: "Sicilian Defense",
    moves: ["e2e4", "c7c5"],
    weight: 5,
  },
  {
    name: "French Defense",
    moves: ["e2e4", "e7e6"],
    weight: 4,
  },
  {
    name: "Caro-Kann Defense",
    moves: ["e2e4", "c7c6"],
    weight: 4,
  },
  {
    name: "Scandinavian Defense",
    moves: ["e2e4", "d7d5"],
    weight: 3,
  },
  {
    name: "Indian Defense",
    moves: ["d2d4", "g8f6"],
    weight: 4,
  },
  {
    name: "Slav Defense",
    moves: ["d2d4", "d7d5", "c2c4", "c7c6"],
    weight: 4,
  },
  {
    name: "English Opening",
    moves: ["c2c4"],
    weight: 3,
  },
  {
    name: "Réti Opening",
    moves: ["g1f3"],
    weight: 3,
  },
];

function moveToUci(move: Move): string {
  const files = "abcdefgh";
  const fromSquare =
    files[move.from % 8] + (Math.floor(move.from / 8) + 1);
  const toSquare =
    files[move.to % 8] + (Math.floor(move.to / 8) + 1);

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
      line.weight > 0 &&
      line.moves.length > playedMoves.length &&
      playedMoves.every(
        (move, index) => line.moves[index] === move.toLowerCase(),
      ),
  );

  if (candidates.length === 0) {
    return null;
  }

  const legalMoves = MoveGenerator.generateLegalMoves(position);
  const legalUciMoves = new Map(
    legalMoves.map((move) => [moveToUci(move), move]),
  );

  const weightedMoves = new Map<string, { move: Move; weight: number }>();

  for (const line of candidates) {
    const nextMove = line.moves[playedMoves.length];
    if (!nextMove) continue;

    const legalMove = legalUciMoves.get(nextMove);
    if (!legalMove) continue;

    const existing = weightedMoves.get(nextMove);
    weightedMoves.set(nextMove, {
      move: legalMove,
      weight: (existing?.weight ?? 0) + line.weight,
    });
  }

  const entries = [...weightedMoves.values()];
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  let selection = Math.random() * totalWeight;

  for (const entry of entries) {
    selection -= entry.weight;
    if (selection < 0) {
      return entry.move;
    }
  }

  return entries[entries.length - 1]?.move ?? null;
}
