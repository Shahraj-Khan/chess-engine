import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  Color,
  Piece,
  PieceType,
  charToPiece,
  isValidPiece,
  makePiece,
  oppositeColor,
  pieceColor,
  pieceToChar,
  pieceType,
  type NonEmptyPieceType,
} from "../src/index.js";

const TYPES: readonly NonEmptyPieceType[] = [
  PieceType.Pawn,
  PieceType.Knight,
  PieceType.Bishop,
  PieceType.Rook,
  PieceType.Queen,
  PieceType.King,
];

describe("colors", () => {
  it("has opposite colors", () => {
    assert.equal(oppositeColor(Color.White), Color.Black);
    assert.equal(oppositeColor(Color.Black), Color.White);
  });
});

describe("pieces", () => {
  it("encodes and decodes color and type for all 12 pieces", () => {
    for (const color of [Color.White, Color.Black] as const) {
      for (const type of TYPES) {
        const piece = makePiece(color, type);
        assert.equal(pieceColor(piece), color);
        assert.equal(pieceType(piece), type);
        assert.equal(isValidPiece(piece), true);
      }
    }
  });

  it("matches the named piece constants", () => {
    assert.equal(makePiece(Color.White, PieceType.King), Piece.WhiteKing);
    assert.equal(makePiece(Color.Black, PieceType.Pawn), Piece.BlackPawn);
    assert.equal(makePiece(Color.Black, PieceType.Queen), Piece.BlackQueen);
  });

  it("maps pieces to FEN letters and back", () => {
    assert.equal(pieceToChar(Piece.WhiteKing), "K");
    assert.equal(pieceToChar(Piece.BlackKnight), "n");
    assert.equal(pieceToChar(Piece.None), ".");
    for (const ch of "PNBRQKpnbrqk") {
      const piece = charToPiece(ch);
      assert.notEqual(piece, undefined, ch);
      assert.equal(pieceToChar(piece as Piece), ch);
    }
  });

  it("rejects characters that are not pieces", () => {
    for (const ch of ["", "x", "1", ".", "PP", " "]) {
      assert.equal(charToPiece(ch), undefined, JSON.stringify(ch));
    }
  });

  it("rejects invalid piece values", () => {
    for (const value of [0, 7, 8, 15, 16, -1, 1.5]) {
      assert.equal(isValidPiece(value), false, String(value));
    }
  });
});
