
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Position } from "../src/core/position.js";
import { Color } from "../src/core/color.js";
import { Piece } from "../src/core/piece.js";
import { makeSquare } from "../src/core/square.js";
import { CastlingRights } from "../src/core/castling.js";
import { computeZobristHash } from "../src/search/zobrist.js";

describe("Zobrist hashing", () => {
  it("returns the same hash for the same position", () => {
    const position = Position.initial();

    assert.equal(
      computeZobristHash(position),
      computeZobristHash(position.clone())
    );
  });

  it("changes the hash when the side to move changes", () => {
    const position = Position.initial();
    const originalHash = computeZobristHash(position);

    position.sideToMove = Color.Black;

    assert.notEqual(computeZobristHash(position), originalHash);
  });

  it("changes the hash when a piece moves", () => {
    const position = Position.initial();
    const originalHash = computeZobristHash(position);

    position.movePiece(makeSquare(4, 1), makeSquare(4, 3));

    assert.notEqual(computeZobristHash(position), originalHash);
  });

  it("changes the hash when castling rights change", () => {
    const position = Position.initial();
    const originalHash = computeZobristHash(position);

    position.castlingRights = CastlingRights.None;

    assert.notEqual(computeZobristHash(position), originalHash);
  });

  it("changes the hash when the en passant file changes", () => {
    const position = Position.initial();
    const originalHash = computeZobristHash(position);

    position.enPassantSquare = makeSquare(4, 2);

    assert.notEqual(computeZobristHash(position), originalHash);
  });

  it("handles a position with no pieces", () => {
    const position = Position.empty();

    assert.equal(
      computeZobristHash(position),
      computeZobristHash(position.clone())
    );
  });

  it("distinguishes positions with different pieces", () => {
    const first = Position.empty();
    const second = Position.empty();

    first.putPiece(makeSquare(4, 0), Piece.WhiteKing);
    first.putPiece(makeSquare(4, 7), Piece.BlackKing);

    second.putPiece(makeSquare(4, 0), Piece.WhiteKing);
    second.putPiece(makeSquare(3, 7), Piece.BlackKing);

    assert.notEqual(
      computeZobristHash(first),
      computeZobristHash(second)
    );
  });
});
