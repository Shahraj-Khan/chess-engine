import { CastlingRights } from "./castling.js";
import { Color } from "./color.js";
import {
  Piece,
  PieceType,
  isValidPiece,
  makePiece,
  pieceColor,
  pieceToChar,
  type NonEmptyPieceType,
} from "./piece.js";
import {
  NO_SQUARE,
  NUM_SQUARES,
  isValidSquare,
  makeSquare,
  squareToString,
  type Square,
} from "./square.js";

const BACK_RANK: readonly NonEmptyPieceType[] = [
  PieceType.Rook,
  PieceType.Knight,
  PieceType.Bishop,
  PieceType.Queen,
  PieceType.King,
  PieceType.Bishop,
  PieceType.Knight,
  PieceType.Rook,
];

function assertSquare(square: number): void {
  if (!isValidSquare(square)) {
    throw new RangeError(`Invalid square index: ${square}`);
  }
}

/**
 * A chess position: piece placement plus the non-board state needed by FIDE
 * rules (side to move, castling rights, en passant target, move counters).
 *
 * The board is private and is changed only through `putPiece`, `removePiece`
 * and `movePiece`. Keeping every board mutation in these three methods is
 * deliberate: Zobrist hashing, bitboards or piece lists can later be updated
 * incrementally in exactly one place.
 *
 * Mutators validate their arguments and throw on misuse. Readers such as
 * `pieceAt` do not validate, because they sit on the hot path of search.
 *
 * This class stores state only; it does not know chess rules. Legality
 * belongs to move generation (a later phase).
 */
export class Position {
  private readonly squares: Uint8Array;

  sideToMove: Color;
  castlingRights: CastlingRights;
  /** En passant target square as written in FEN, or `NO_SQUARE`. */
  enPassantSquare: number;
  /** Plies since the last capture or pawn move (fifty-move rule counter). */
  halfmoveClock: number;
  /** Starts at 1 and increments after Black's move. */
  fullmoveNumber: number;

  /** Creates an empty board: White to move, no rights, no en passant. */
  constructor() {
    this.squares = new Uint8Array(NUM_SQUARES);
    this.sideToMove = Color.White;
    this.castlingRights = CastlingRights.None;
    this.enPassantSquare = NO_SQUARE;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
  }

  static empty(): Position {
    return new Position();
  }

  /** The standard starting position. */
  static initial(): Position {
    const position = new Position();
    for (let file = 0; file < 8; file++) {
      position.putPiece(makeSquare(file, 0), makePiece(Color.White, BACK_RANK[file]!));
      position.putPiece(makeSquare(file, 1), Piece.WhitePawn);
      position.putPiece(makeSquare(file, 6), Piece.BlackPawn);
      position.putPiece(makeSquare(file, 7), makePiece(Color.Black, BACK_RANK[file]!));
    }
    position.castlingRights = CastlingRights.All;
    return position;
  }

  /** Piece on `square`, or `Piece.None`. The square is not validated. */
  pieceAt(square: Square): Piece {
    return this.squares[square] as Piece;
  }

  isEmpty(square: Square): boolean {
    return this.squares[square] === Piece.None;
  }

  /** Places a piece on an empty square. */
  putPiece(square: Square, piece: Piece): void {
    assertSquare(square);
    if (!isValidPiece(piece)) {
      throw new RangeError(`Invalid piece value: ${piece}`);
    }
    if (this.squares[square] !== Piece.None) {
      throw new Error(
        `Cannot put ${pieceToChar(piece)} on ${squareToString(square)}: square is occupied by ` +
          pieceToChar(this.squares[square] as Piece),
      );
    }
    this.squares[square] = piece;
  }

  /** Removes and returns the piece on `square`. Throws if it is empty. */
  removePiece(square: Square): Piece {
    assertSquare(square);
    const piece = this.squares[square] as Piece;
    if (piece === Piece.None) {
      throw new Error(`Cannot remove piece from ${squareToString(square)}: square is empty`);
    }
    this.squares[square] = Piece.None;
    return piece;
  }

  /**
   * Moves a piece from `from` to `to` at the state level and returns the
   * captured piece (`Piece.None` if the destination was empty). No chess rules
   * are checked, but capturing a piece of the mover's own color throws since
   * that can never be intended.
   */
  movePiece(from: Square, to: Square): Piece {
    assertSquare(from);
    assertSquare(to);
    if (from === to) {
      throw new Error(`Cannot move a piece onto its own square (${squareToString(from)})`);
    }
    const moving = this.squares[from] as Piece;
    if (moving === Piece.None) {
      throw new Error(`Cannot move from ${squareToString(from)}: square is empty`);
    }
    const captured = this.squares[to] as Piece;
    if (captured !== Piece.None && pieceColor(captured) === pieceColor(moving)) {
      throw new Error(
        `Cannot move ${pieceToChar(moving)} from ${squareToString(from)} to ` +
          `${squareToString(to)}: occupied by a friendly piece`,
      );
    }
    this.squares[to] = moving;
    this.squares[from] = Piece.None;
    return captured;
  }

  /** Empties the board and resets all state to the defaults of a new Position. */
  clear(): void {
    this.squares.fill(Piece.None);
    this.sideToMove = Color.White;
    this.castlingRights = CastlingRights.None;
    this.enPassantSquare = NO_SQUARE;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
  }

  /** Returns an independent deep copy. */
  clone(): Position {
    const copy = new Position();
    copy.copyFrom(this);
    return copy;
  }

  /** Overwrites this position with `other` without allocating. */
  copyFrom(other: Position): void {
    this.squares.set(other.squares);
    this.sideToMove = other.sideToMove;
    this.castlingRights = other.castlingRights;
    this.enPassantSquare = other.enPassantSquare;
    this.halfmoveClock = other.halfmoveClock;
    this.fullmoveNumber = other.fullmoveNumber;
  }

  /** Structural equality of board and all state fields. */
  equals(other: Position): boolean {
    if (
      this.sideToMove !== other.sideToMove ||
      this.castlingRights !== other.castlingRights ||
      this.enPassantSquare !== other.enPassantSquare ||
      this.halfmoveClock !== other.halfmoveClock ||
      this.fullmoveNumber !== other.fullmoveNumber
    ) {
      return false;
    }
    for (let square = 0; square < NUM_SQUARES; square++) {
      if (this.squares[square] !== other.squares[square]) return false;
    }
    return true;
  }

  /** ASCII diagram of the board, rank 8 at the top. For debugging. */
  toString(): string {
    const lines: string[] = [];
    for (let rank = 7; rank >= 0; rank--) {
      const cells: string[] = [];
      for (let file = 0; file < 8; file++) {
        cells.push(pieceToChar(this.pieceAt(makeSquare(file, rank))));
      }
      lines.push(`${rank + 1} ${cells.join(" ")}`);
    }
    lines.push("  a b c d e f g h");
    return lines.join("\n");
  }
}
