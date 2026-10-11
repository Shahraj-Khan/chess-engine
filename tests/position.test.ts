import assert from "node:assert/strict";
import { describe, it } from "node:test";
import test from "node:test";

import {
  CastlingRights,
  Color,
  NO_SQUARE,
  Piece,
  Position,
  Square,
  makeSquare,
} from "../src/index.js";

function countPieces(position: Position): { white: number; black: number } {
  let white = 0;
  let black = 0;
  for (let square = 0; square < 64; square++) {
    const piece = position.pieceAt(square);
    if (piece === Piece.None) continue;
    if (piece < 8) white++;
    else black++;
  }
  return { white, black };
}

describe("empty position", () => {
  it("has no pieces and default state", () => {
    const position = Position.empty();
    for (let square = 0; square < 64; square++) {
      assert.equal(position.pieceAt(square), Piece.None);
      assert.equal(position.isEmpty(square), true);
    }
    assert.equal(position.sideToMove, Color.White);
    assert.equal(position.castlingRights, CastlingRights.None);
    assert.equal(position.enPassantSquare, NO_SQUARE);
    assert.equal(position.halfmoveClock, 0);
    assert.equal(position.fullmoveNumber, 1);
  });
});

describe("initial position", () => {
  const position = Position.initial();

  it("has the standard back ranks", () => {
    const white = [
      Piece.WhiteRook, Piece.WhiteKnight, Piece.WhiteBishop, Piece.WhiteQueen,
      Piece.WhiteKing, Piece.WhiteBishop, Piece.WhiteKnight, Piece.WhiteRook,
    ];
    const black = [
      Piece.BlackRook, Piece.BlackKnight, Piece.BlackBishop, Piece.BlackQueen,
      Piece.BlackKing, Piece.BlackBishop, Piece.BlackKnight, Piece.BlackRook,
    ];
    for (let file = 0; file < 8; file++) {
      assert.equal(position.pieceAt(makeSquare(file, 0)), white[file]);
      assert.equal(position.pieceAt(makeSquare(file, 7)), black[file]);
    }
    assert.equal(position.pieceAt(Square.E1), Piece.WhiteKing);
    assert.equal(position.pieceAt(Square.D8), Piece.BlackQueen);
  });

  it("has pawns on ranks 2 and 7 and empty ranks 3-6", () => {
    for (let file = 0; file < 8; file++) {
      assert.equal(position.pieceAt(makeSquare(file, 1)), Piece.WhitePawn);
      assert.equal(position.pieceAt(makeSquare(file, 6)), Piece.BlackPawn);
      for (let rank = 2; rank <= 5; rank++) {
        assert.equal(position.isEmpty(makeSquare(file, rank)), true);
      }
    }
  });

  it("has 16 pieces per side", () => {
    assert.deepEqual(countPieces(position), { white: 16, black: 16 });
  });

  it("has the standard starting state", () => {
    assert.equal(position.sideToMove, Color.White);
    assert.equal(position.castlingRights, CastlingRights.All);
    assert.equal(position.enPassantSquare, NO_SQUARE);
    assert.equal(position.halfmoveClock, 0);
    assert.equal(position.fullmoveNumber, 1);
  });

  it("returns a fresh instance each time", () => {
    const other = Position.initial();
    assert.notEqual(other, position);
    other.removePiece(Square.E2);
    assert.equal(position.pieceAt(Square.E2), Piece.WhitePawn);
  });
});

describe("piece placement", () => {
  it("puts a piece on an empty square", () => {
    const position = Position.empty();
    position.putPiece(Square.D4, Piece.BlackKnight);
    assert.equal(position.pieceAt(Square.D4), Piece.BlackKnight);
    assert.equal(position.isEmpty(Square.D4), false);
    assert.deepEqual(countPieces(position), { white: 0, black: 1 });
  });

  it("refuses to overwrite an occupied square", () => {
    const position = Position.empty();
    position.putPiece(Square.D4, Piece.WhiteQueen);
    assert.throws(() => position.putPiece(Square.D4, Piece.BlackQueen), /occupied/);
    assert.equal(position.pieceAt(Square.D4), Piece.WhiteQueen);
  });

  it("rejects invalid squares and pieces", () => {
    const position = Position.empty();
    assert.throws(() => position.putPiece(-1, Piece.WhitePawn), RangeError);
    assert.throws(() => position.putPiece(64, Piece.WhitePawn), RangeError);
    assert.throws(() => position.putPiece(1.5, Piece.WhitePawn), RangeError);
    assert.throws(() => position.putPiece(Square.A1, Piece.None), RangeError);
    assert.throws(() => position.putPiece(Square.A1, 7 as Piece), RangeError);
    assert.deepEqual(countPieces(position), { white: 0, black: 0 });
  });
});

describe("piece removal", () => {
  it("removes and returns the piece", () => {
    const position = Position.initial();
    assert.equal(position.removePiece(Square.E1), Piece.WhiteKing);
    assert.equal(position.isEmpty(Square.E1), true);
    assert.deepEqual(countPieces(position), { white: 15, black: 16 });
  });

  it("throws when the square is empty or invalid", () => {
    const position = Position.empty();
    assert.throws(() => position.removePiece(Square.E4), /empty/);
    assert.throws(() => position.removePiece(64), RangeError);
  });
});

describe("piece movement (state level)", () => {
  it("moves a piece to an empty square", () => {
    const position = Position.initial();
    const captured = position.movePiece(Square.E2, Square.E4);
    assert.equal(captured, Piece.None);
    assert.equal(position.isEmpty(Square.E2), true);
    assert.equal(position.pieceAt(Square.E4), Piece.WhitePawn);
    assert.deepEqual(countPieces(position), { white: 16, black: 16 });
  });

  it("returns the captured piece when the destination is occupied by an enemy", () => {
    const position = Position.empty();
    position.putPiece(Square.A1, Piece.WhiteRook);
    position.putPiece(Square.A8, Piece.BlackRook);
    assert.equal(position.movePiece(Square.A1, Square.A8), Piece.BlackRook);
    assert.equal(position.pieceAt(Square.A8), Piece.WhiteRook);
    assert.equal(position.isEmpty(Square.A1), true);
    assert.deepEqual(countPieces(position), { white: 1, black: 0 });
  });

  it("does not touch position state fields", () => {
    const position = Position.initial();
    position.movePiece(Square.E2, Square.E4);
    assert.equal(position.sideToMove, Color.White);
    assert.equal(position.castlingRights, CastlingRights.All);
    assert.equal(position.enPassantSquare, NO_SQUARE);
    assert.equal(position.halfmoveClock, 0);
    assert.equal(position.fullmoveNumber, 1);
  });

  it("rejects impossible moves and leaves the board unchanged", () => {
    const position = Position.initial();
    const before = position.clone();
    assert.throws(() => position.movePiece(Square.E4, Square.E5), /empty/);
    assert.throws(() => position.movePiece(Square.E2, Square.E2), /own square/);
    assert.throws(() => position.movePiece(Square.A1, Square.A2), /friendly/);
    assert.throws(() => position.movePiece(-1, Square.A2), RangeError);
    assert.throws(() => position.movePiece(Square.A2, 64), RangeError);
    assert.equal(position.equals(before), true);
  });
});

describe("position state", () => {
  it("tracks side to move", () => {
    const position = Position.initial();
    position.sideToMove = Color.Black;
    assert.equal(position.sideToMove, Color.Black);
  });

  it("tracks castling rights as independent flags", () => {
    const position = Position.initial();
    position.castlingRights &= ~CastlingRights.WhiteKingSide;
    assert.equal(
      position.castlingRights,
      CastlingRights.WhiteQueenSide | CastlingRights.BlackKingSide | CastlingRights.BlackQueenSide,
    );
    position.castlingRights = CastlingRights.None;
    assert.equal(position.castlingRights, 0);
  });

  it("tracks the en passant square", () => {
    const position = Position.initial();
    position.enPassantSquare = Square.E3;
    assert.equal(position.enPassantSquare, Square.E3);
    position.enPassantSquare = NO_SQUARE;
    assert.equal(position.enPassantSquare, NO_SQUARE);
  });

  it("tracks the move counters", () => {
    const position = Position.initial();
    position.halfmoveClock = 17;
    position.fullmoveNumber = 42;
    assert.equal(position.halfmoveClock, 17);
    assert.equal(position.fullmoveNumber, 42);
  });

  it("clear() resets board and state", () => {
    const position = Position.initial();
    position.sideToMove = Color.Black;
    position.enPassantSquare = Square.E3;
    position.halfmoveClock = 5;
    position.fullmoveNumber = 9;
    position.clear();
    assert.equal(position.equals(Position.empty()), true);
  });
});

describe("cloning and copying", () => {
  it("clone() is equal to the original", () => {
    const original = Position.initial();
    original.sideToMove = Color.Black;
    original.enPassantSquare = Square.E3;
    original.halfmoveClock = 3;
    original.fullmoveNumber = 7;
    const copy = original.clone();
    assert.notEqual(copy, original);
    assert.equal(copy.equals(original), true);
  });

  it("clone() is independent: mutating the copy leaves the original untouched", () => {
    const original = Position.initial();
    const snapshot = original.clone();
    const copy = original.clone();

    copy.movePiece(Square.E2, Square.E4);
    copy.removePiece(Square.A8);
    copy.sideToMove = Color.Black;
    copy.castlingRights = CastlingRights.None;
    copy.enPassantSquare = Square.E3;
    copy.halfmoveClock = 10;
    copy.fullmoveNumber = 20;

    assert.equal(original.equals(snapshot), true);
    assert.equal(original.equals(copy), false);
  });

  it("clone() is independent: mutating the original leaves the copy untouched", () => {
    const original = Position.initial();
    const copy = original.clone();
    original.removePiece(Square.D1);
    original.sideToMove = Color.Black;
    assert.equal(copy.pieceAt(Square.D1), Piece.WhiteQueen);
    assert.equal(copy.sideToMove, Color.White);
  });

  it("copyFrom() overwrites board and state in place", () => {
    const source = Position.initial();
    source.movePiece(Square.E2, Square.E4);
    source.sideToMove = Color.Black;
    source.enPassantSquare = Square.E3;

    const target = Position.empty();
    target.putPiece(Square.H5, Piece.WhiteQueen);
    target.copyFrom(source);

    assert.equal(target.equals(source), true);
    target.removePiece(Square.E4);
    assert.equal(source.pieceAt(Square.E4), Piece.WhitePawn);
  });
});

describe("equals()", () => {
  it("detects differences in every state field and in the board", () => {
    const base = Position.initial();
    const variants: Array<(p: Position) => void> = [
      (p) => { p.sideToMove = Color.Black; },
      (p) => { p.castlingRights = CastlingRights.WhiteKingSide; },
      (p) => { p.enPassantSquare = Square.E3; },
      (p) => { p.halfmoveClock = 1; },
      (p) => { p.fullmoveNumber = 2; },
      (p) => { p.removePiece(Square.A1); },
    ];
    for (const mutate of variants) {
      const variant = base.clone();
      mutate(variant);
      assert.equal(base.equals(variant), false);
    }
  });
});

describe("toString()", () => {
  it("renders the initial position with rank 8 at the top", () => {
    assert.equal(
      Position.initial().toString(),
      [
        "8 r n b q k b n r",
        "7 p p p p p p p p",
        "6 . . . . . . . .",
        "5 . . . . . . . .",
        "4 . . . . . . . .",
        "3 . . . . . . . .",
        "2 P P P P P P P P",
        "1 R N B Q K B N R",
        "  a b c d e f g h",
      ].join("\n"),
    );
  });
});

test("moves the king to a new square", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);

  position.movePiece(4, 12);

  assert.equal(position.pieceAt(4), Piece.None);
  assert.equal(position.pieceAt(12), Piece.WhiteKing);
});


test("moves a piece and returns the captured piece", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);
  position.putPiece(12, Piece.BlackRook);

  const captured = position.movePiece(4, 12);

  assert.equal(captured, Piece.BlackRook);
  assert.equal(position.pieceAt(4), Piece.None);
  assert.equal(position.pieceAt(12), Piece.WhiteKing);
});