/**
 * Squares are integers 0..63 laid out as `rank * 8 + file`, with a1 = 0,
 * h1 = 7, a8 = 56, h8 = 63. This is the same layout little-endian bitboards
 * use, so a square index is also its bit index.
 */
export type Square = number;

/** Sentinel for "no square" (e.g. no en passant target). */
export const NO_SQUARE = -1;
export const NUM_SQUARES = 64;

export const Square = {
  A1: 0, B1: 1, C1: 2, D1: 3, E1: 4, F1: 5, G1: 6, H1: 7,
  A2: 8, B2: 9, C2: 10, D2: 11, E2: 12, F2: 13, G2: 14, H2: 15,
  A3: 16, B3: 17, C3: 18, D3: 19, E3: 20, F3: 21, G3: 22, H3: 23,
  A4: 24, B4: 25, C4: 26, D4: 27, E4: 28, F4: 29, G4: 30, H4: 31,
  A5: 32, B5: 33, C5: 34, D5: 35, E5: 36, F5: 37, G5: 38, H5: 39,
  A6: 40, B6: 41, C6: 42, D6: 43, E6: 44, F6: 45, G6: 46, H6: 47,
  A7: 48, B7: 49, C7: 50, D7: 51, E7: 52, F7: 53, G7: 54, H7: 55,
  A8: 56, B8: 57, C8: 58, D8: 59, E8: 60, F8: 61, G8: 62, H8: 63,
} as const;

const FILE_NAMES = "abcdefgh";
const RANK_NAMES = "12345678";

/** File 0..7 (a..h). */
export function fileOf(square: Square): number {
  return square & 7;
}

/** Rank 0..7 (rank 1..rank 8). */
export function rankOf(square: Square): number {
  return square >> 3;
}

export function makeSquare(file: number, rank: number): Square {
  return (rank << 3) | file;
}

export function isValidSquare(square: number): boolean {
  return Number.isInteger(square) && square >= 0 && square < NUM_SQUARES;
}

/** Algebraic name such as "e4". The square must be valid. */
export function squareToString(square: Square): string {
  return FILE_NAMES.charAt(fileOf(square)) + RANK_NAMES.charAt(rankOf(square));
}

/** Parses "e4"-style names; returns `NO_SQUARE` if the text is not a square. */
export function parseSquare(text: string): Square {
  if (text.length !== 2) return NO_SQUARE;
  const file = FILE_NAMES.indexOf(text.charAt(0));
  const rank = RANK_NAMES.indexOf(text.charAt(1));
  if (file < 0 || rank < 0) return NO_SQUARE;
  return makeSquare(file, rank);
}
