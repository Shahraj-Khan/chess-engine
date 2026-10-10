import { CastlingRights, castlingToString, parseCastling } from "./castling.js";
import { Color } from "./color.js";
import { Piece, PieceType, charToPiece, pieceColor, pieceToChar, pieceType } from "./piece.js";
import { Position } from "./position.js";
import {
  NO_SQUARE,
  NUM_SQUARES,
  Square,
  makeSquare,
  parseSquare,
  rankOf,
  squareToString,
} from "./square.js";

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class FenError extends Error {
  constructor(message: string) {
    super(`Invalid FEN: ${message}`);
    this.name = "FenError";
  }
}

/**
 * Parses a FEN string into a new Position.
 *
 * Accepts 6 fields, or 4 fields (the halfmove clock and fullmove number then
 * default to 0 and 1, as in EPD-style input). The parser checks structure and
 * basic consistency: one king per side, no pawns on the back ranks, castling
 * rights that match king/rook placement, and an en passant square that matches
 * a pawn that could just have double-pushed. Deeper legality (such as the side
 * not to move being in check) needs attack detection and is not checked here.
 *
 * @throws FenError if the text is not a valid FEN.
 */
export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  if (fields.length !== 4 && fields.length !== 6) {
    throw new FenError(`expected 4 or 6 space-separated fields, got ${fields.length}`);
  }
  const placement = fields[0] as string;
  const activeColor = fields[1] as string;
  const castling = fields[2] as string;
  const enPassant = fields[3] as string;
  const halfmove = fields.length === 6 ? (fields[4] as string) : "0";
  const fullmove = fields.length === 6 ? (fields[5] as string) : "1";

  const position = new Position();

  parsePlacement(placement, position);
  validatePieces(position);

  if (activeColor === "w") {
    position.sideToMove = Color.White;
  } else if (activeColor === "b") {
    position.sideToMove = Color.Black;
  } else {
    throw new FenError(`side to move must be 'w' or 'b', got '${activeColor}'`);
  }

  const rights = parseCastling(castling);
  if (rights === undefined) {
    throw new FenError(`invalid castling field '${castling}'`);
  }
  position.castlingRights = rights;
  validateCastlingRights(position);

  position.enPassantSquare = parseEnPassant(enPassant, position);
  position.halfmoveClock = parseCounter(halfmove, "halfmove clock", 0);
  position.fullmoveNumber = parseCounter(fullmove, "fullmove number", 1);

  return position;
}

/** Serializes a Position to a 6-field FEN string. */
export function toFen(position: Position): string {
  const ranks: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = "";
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const piece = position.pieceAt(makeSquare(file, rank));
      if (piece === Piece.None) {
        empty++;
        continue;
      }
      if (empty > 0) {
        row += empty;
        empty = 0;
      }
      row += pieceToChar(piece);
    }
    if (empty > 0) row += empty;
    ranks.push(row);
  }

  return [
    ranks.join("/"),
    position.sideToMove === Color.White ? "w" : "b",
    castlingToString(position.castlingRights),
    position.enPassantSquare === NO_SQUARE ? "-" : squareToString(position.enPassantSquare),
    position.halfmoveClock,
    position.fullmoveNumber,
  ].join(" ");
}

function parsePlacement(placement: string, position: Position): void {
  const rows = placement.split("/");
  if (rows.length !== 8) {
    throw new FenError(`piece placement must have 8 ranks, got ${rows.length}`);
  }
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i; // FEN lists rank 8 first
    let file = 0;
    let previousWasDigit = false;
    for (const ch of rows[i] as string) {
      if (ch >= "1" && ch <= "8") {
        if (previousWasDigit) {
          throw new FenError(`adjacent digits in rank ${rank + 1}`);
        }
        file += ch.charCodeAt(0) - "0".charCodeAt(0);
        previousWasDigit = true;
        continue;
      }
      const piece = charToPiece(ch);
      if (piece === undefined) {
        throw new FenError(`unknown character '${ch}' in rank ${rank + 1}`);
      }
      if (file >= 8) {
        throw new FenError(`rank ${rank + 1} has more than 8 squares`);
      }
      position.putPiece(makeSquare(file, rank), piece);
      file++;
      previousWasDigit = false;
    }
    if (file !== 8) {
      throw new FenError(`rank ${rank + 1} describes ${file} squares, expected 8`);
    }
  }
}

const COLOR_NAMES = ["white", "black"] as const;

function validatePieces(position: Position): void {
  const kings = [0, 0];
  const pawns = [0, 0];
  for (let square = 0; square < NUM_SQUARES; square++) {
    const piece = position.pieceAt(square);
    if (piece === Piece.None) continue;
    const color = pieceColor(piece);
    const type = pieceType(piece);
    if (type === PieceType.King) {
      kings[color]!++;
    } else if (type === PieceType.Pawn) {
      pawns[color]!++;
      const rank = rankOf(square);
      if (rank === 0 || rank === 7) {
        throw new FenError(`pawn on ${squareToString(square)} (pawns cannot be on rank 1 or 8)`);
      }
    }
  }
  for (const color of [Color.White, Color.Black] as const) {
    if (kings[color] !== 1) {
      throw new FenError(`${COLOR_NAMES[color]} must have exactly one king, found ${kings[color]}`);
    }
    if (pawns[color]! > 8) {
      throw new FenError(`${COLOR_NAMES[color]} has more than 8 pawns`);
    }
  }
}

const CASTLING_REQUIREMENTS = [
  { flag: CastlingRights.WhiteKingSide, label: "K", king: Square.E1, kingPiece: Piece.WhiteKing, rook: Square.H1, rookPiece: Piece.WhiteRook },
  { flag: CastlingRights.WhiteQueenSide, label: "Q", king: Square.E1, kingPiece: Piece.WhiteKing, rook: Square.A1, rookPiece: Piece.WhiteRook },
  { flag: CastlingRights.BlackKingSide, label: "k", king: Square.E8, kingPiece: Piece.BlackKing, rook: Square.H8, rookPiece: Piece.BlackRook },
  { flag: CastlingRights.BlackQueenSide, label: "q", king: Square.E8, kingPiece: Piece.BlackKing, rook: Square.A8, rookPiece: Piece.BlackRook },
] as const;

function validateCastlingRights(position: Position): void {
  for (const req of CASTLING_REQUIREMENTS) {
    if (!(position.castlingRights & req.flag)) continue;
    if (position.pieceAt(req.king) !== req.kingPiece || position.pieceAt(req.rook) !== req.rookPiece) {
      throw new FenError(
        `castling right '${req.label}' is set but the king and rook are not on their original squares`,
      );
    }
  }
}

function parseEnPassant(text: string, position: Position): number {
  if (text === "-") return NO_SQUARE;
  const square = parseSquare(text);
  if (square === NO_SQUARE) {
    throw new FenError(`invalid en passant square '${text}'`);
  }

  // After a double push the target is on rank 6 if White is to move (Black
  // just pushed) and on rank 3 if Black is to move (White just pushed).
  const whiteToMove = position.sideToMove === Color.White;
  if (rankOf(square) !== (whiteToMove ? 5 : 2)) {
    throw new FenError(
      `en passant square '${text}' is on the wrong rank for ${whiteToMove ? "White" : "Black"} to move`,
    );
  }

  const pawnSquare = whiteToMove ? square - 8 : square + 8; // pawn that just moved
  const originSquare = whiteToMove ? square + 8 : square - 8; // where it came from
  const enemyPawn = whiteToMove ? Piece.BlackPawn : Piece.WhitePawn;
  if (
    !position.isEmpty(square) ||
    !position.isEmpty(originSquare) ||
    position.pieceAt(pawnSquare) !== enemyPawn
  ) {
    throw new FenError(`en passant square '${text}' is inconsistent with the piece placement`);
  }
  return square;
}

function parseCounter(text: string, name: string, min: number): number {
  if (!/^\d+$/.test(text)) {
    throw new FenError(`${name} must be a non-negative integer, got '${text}'`);
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < min) {
    throw new FenError(`${name} must be at least ${min}, got '${text}'`);
  }
  return value;
}
