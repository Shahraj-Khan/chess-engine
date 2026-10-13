
import { Position } from "../core/position.js";
import { Color } from "../core/color.js";
import { Piece } from "../core/piece.js";


const MASK_64 = (1n << 64n) - 1n;

// Deterministic pseudo-random 64-bit number generator.
function createRandomGenerator() {
  let state = 0x9e3779b97f4a7c15n;

  return function nextRandom(): bigint {
    state = (state + 0x9e3779b97f4a7c15n) & MASK_64;

    let value = state;
    value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & MASK_64;
    value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & MASK_64;

    return (value ^ (value >> 31n)) & MASK_64;
  };
}

const nextRandom = createRandomGenerator();

const PIECE_KEYS: bigint[][] = Array.from(
  { length: 15 },
  () => Array.from({ length: 64 }, () => nextRandom())
);

const SIDE_KEY = nextRandom();

const CASTLING_KEYS: bigint[] = Array.from(
  { length: 16 },
  () => nextRandom()
);

const EN_PASSANT_KEYS: bigint[] = Array.from(
  { length: 8 },
  () => nextRandom()
);

export function computeZobristHash(position: Position): bigint {
  let hash = 0n;

  for (let square = 0; square < 64; square++) {
    const piece = position.pieceAt(square);

    if (piece !== Piece.None) {
      hash ^= PIECE_KEYS[piece]![square]!;
    }
  }

  if (position.sideToMove === Color.Black) {
    hash ^= SIDE_KEY;
  }

  hash ^= CASTLING_KEYS[position.castlingRights]!;

  if (position.enPassantSquare !== -1) {
    const file = position.enPassantSquare % 8;
    hash ^= EN_PASSANT_KEYS[file]!;
  }

  return hash;
}
