/** Castling rights as a 4-bit mask. */
export type CastlingRights = number;

export const CastlingRights = {
  None: 0,
  WhiteKingSide: 1,
  WhiteQueenSide: 2,
  BlackKingSide: 4,
  BlackQueenSide: 8,
  All: 15,
} as const;

/** FEN letters in canonical output order. */
const FLAGS: ReadonlyArray<readonly [letter: string, flag: number]> = [
  ["K", CastlingRights.WhiteKingSide],
  ["Q", CastlingRights.WhiteQueenSide],
  ["k", CastlingRights.BlackKingSide],
  ["q", CastlingRights.BlackQueenSide],
];

/** FEN castling field: "KQkq" subset in canonical order, or "-" for none. */
export function castlingToString(rights: CastlingRights): string {
  let text = "";
  for (const [letter, flag] of FLAGS) {
    if (rights & flag) text += letter;
  }
  return text === "" ? "-" : text;
}

/**
 * Parses a FEN castling field. Letters may appear in any order but must not
 * repeat, and "-" must stand alone. Returns `undefined` if invalid.
 */
export function parseCastling(text: string): CastlingRights | undefined {
  if (text === "-") return CastlingRights.None;
  if (text.length === 0 || text.length > FLAGS.length) return undefined;
  let rights = 0;
  for (const ch of text) {
    const entry = FLAGS.find(([letter]) => letter === ch);
    if (entry === undefined) return undefined;
    if (rights & entry[1]) return undefined; // duplicate letter
    rights |= entry[1];
  }
  return rights;
}
