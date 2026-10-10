import test from "node:test";
import assert from "node:assert/strict";

import { MoveGenerator } from "../src/move/move-generator.js";
import { Position } from "../src/core/position.js";
import { Piece } from "../src/core/piece.js";
import { Color } from "../src/core/color.js";

test("initial position generates 20 moves", () => {
  const position = Position.initial();

  const moves = MoveGenerator.generate(position);

  assert.equal(moves.length, 20);
});

test("black pieces generate 20 moves after white's first move", () => {
  const position = Position.initial();

  // White plays e2-e4.
  position.movePiece(12, 28);
  position.sideToMove = 1;

  const moves = MoveGenerator.generate(position);

  assert.equal(moves.length, 20);

  // Black pawn e7 can move to e6 and e5.
  assert.ok(
    moves.some((move) => move.from === 52 && move.to === 44),
  );

  assert.ok(
    moves.some((move) => move.from === 52 && move.to === 36),
  );

  // Black knights should have 4 available moves.
  const knightMoves = moves.filter(
    (move) =>
      (move.from === 57 && (move.to === 40 || move.to === 42)) ||
      (move.from === 62 && (move.to === 45 || move.to === 47)),
  );

  assert.equal(knightMoves.length, 4);
});

test("pawns generate diagonal captures", () => {
  const position = Position.empty();

  // White pawn on e4
  position.putPiece(28, Piece.WhitePawn);

  // Black pieces on d5 and f5
  position.putPiece(35, Piece.BlackKnight);
  position.putPiece(37, Piece.BlackBishop);

  const moves = MoveGenerator.generate(position);

  assert.ok(
    moves.some((move) => move.from === 28 && move.to === 35),
  );

  assert.ok(
    moves.some((move) => move.from === 28 && move.to === 37),
  );
});

test("black pawns generate diagonal captures", () => {
  const position = Position.empty();

  // Black pawn on e5
  position.putPiece(36, Piece.BlackPawn);

  // White pieces on d4 and f4
  position.putPiece(27, Piece.WhiteKnight);
  position.putPiece(29, Piece.WhiteBishop);

  position.sideToMove = 1;

  const moves = MoveGenerator.generate(position);

  assert.ok(
    moves.some((move) => move.from === 36 && move.to === 27),
  );

  assert.ok(
    moves.some((move) => move.from === 36 && move.to === 29),
  );
});

test("bishop generates diagonal moves until blocked", () => {
  const position = Position.empty();

  // White bishop on d4
  position.putPiece(27, Piece.WhiteBishop);

  const moves = MoveGenerator.generate(position);

  assert.equal(moves.length, 13);

  // Up-right: e5, f6, g7, h8
  assert.ok(moves.some((move) => move.from === 27 && move.to === 36));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 45));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 54));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 63));

  // Up-left: c5, b6, a7
  assert.ok(moves.some((move) => move.from === 27 && move.to === 34));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 41));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 48));

  // Down-right: e3, f2, g1
  assert.ok(moves.some((move) => move.from === 27 && move.to === 20));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 13));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 6));

  // Down-left: c3, b2, a1
  assert.ok(moves.some((move) => move.from === 27 && move.to === 18));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 9));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 0));
});

test("bishop stops at friendly pieces and captures enemy pieces", () => {
  const position = Position.empty();

  // White bishop on d4
  position.putPiece(27, Piece.WhiteBishop);

  // Friendly piece on f6 -> bishop must stop here
  position.putPiece(45, Piece.WhiteKnight);

  // Enemy piece on b6 -> bishop can capture it
  position.putPiece(41, Piece.BlackKnight);

  const moves = MoveGenerator.generate(position);

  // b6 capture is allowed
  assert.ok(
    moves.some((move) => move.from === 27 && move.to === 41),
  );

  // f6 is blocked by own piece, so capture/move is NOT allowed
  assert.ok(
    !moves.some((move) => move.from === 27 && move.to === 45),
  );

  // g7/h8 beyond the friendly piece must also be unreachable
  assert.ok(
    !moves.some((move) => move.from === 27 && move.to === 54),
  );

  assert.ok(
    !moves.some((move) => move.from === 27 && move.to === 63),
  );
});


test("rook generates horizontal and vertical moves until blocked", () => {
  const position = Position.empty();

  // White rook on d4
  position.putPiece(27, Piece.WhiteRook);

  const moves = MoveGenerator.generate(position);

  assert.equal(moves.length, 14);

  // Up: d5, d6, d7, d8
  assert.ok(moves.some((move) => move.from === 27 && move.to === 35));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 43));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 51));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 59));

  // Down: d3, d2, d1
  assert.ok(moves.some((move) => move.from === 27 && move.to === 19));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 11));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 3));

  // Right: e4, f4, g4, h4
  assert.ok(moves.some((move) => move.from === 27 && move.to === 28));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 29));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 30));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 31));

  // Left: c4, b4, a4
  assert.ok(moves.some((move) => move.from === 27 && move.to === 26));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 25));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 24));
});

test("queen generates rook and bishop moves", () => {
  const position = Position.empty();

  // White queen on d4
  position.putPiece(27, Piece.WhiteQueen);

  const moves = MoveGenerator.generate(position);

  // Queen from d4 has 27 possible moves on an empty board
  assert.equal(moves.length, 27);

  // Rook-like
  assert.ok(moves.some((move) => move.from === 27 && move.to === 35));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 19));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 28));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 26));

  // Bishop-like
  assert.ok(moves.some((move) => move.from === 27 && move.to === 36));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 18));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 34));
  assert.ok(moves.some((move) => move.from === 27 && move.to === 20));
});

test("queen stops at friendly pieces and captures enemy pieces", () => {
  const position = Position.empty();

  // White queen on d4
  position.putPiece(27, Piece.WhiteQueen);

  // Friendly piece blocks upward
  position.putPiece(43, Piece.WhitePawn);

  // Enemy piece can be captured on the right
  position.putPiece(29, Piece.BlackPawn);

  const moves = MoveGenerator.generate(position);

  // d5 is allowed
  assert.ok(moves.some((move) => move.from === 27 && move.to === 35));

  // d6 is blocked by friendly piece on d6
  assert.ok(!moves.some((move) => move.from === 27 && move.to === 43));

  // d7 beyond the blocker is also impossible
  assert.ok(!moves.some((move) => move.from === 27 && move.to === 51));

  // e4 enemy piece can be captured
  assert.ok(moves.some((move) => move.from === 27 && move.to === 29));

  // f4 beyond captured piece is blocked
  assert.ok(!moves.some((move) => move.from === 27 && move.to === 30));
});

test("king generates one-square moves", () => {
  const position = Position.empty();

  // White king on d4
  position.putPiece(27, Piece.WhiteKing);

  const moves = MoveGenerator.generate(position);

  assert.equal(moves.length, 8);

  const expectedSquares = [
    18, // c3
    19, // d3
    20, // e3
    26, // c4
    28, // e4
    34, // c5
    35, // d5
    36, // e5
  ];

  for (const square of expectedSquares) {
    assert.ok(
      moves.some(
        (move) => move.from === 27 && move.to === square
      )
    );
  }
});

test("king cannot capture friendly pieces but can capture enemy pieces", () => {
  const position = Position.empty();

  // White king on d4
  position.putPiece(27, Piece.WhiteKing);

  // Friendly pieces
  position.putPiece(35, Piece.WhitePawn); // d5
  position.putPiece(26, Piece.WhitePawn); // c4

  // Enemy piece
  position.putPiece(36, Piece.BlackPawn); // e5

  const moves = MoveGenerator.generate(position);

  // Friendly pieces cannot be captured
  assert.ok(!moves.some((move) => move.from === 27 && move.to === 35));
  assert.ok(!moves.some((move) => move.from === 27 && move.to === 26));

  // Enemy piece can be captured
  assert.ok(moves.some((move) => move.from === 27 && move.to === 36));
});

test("detects a square attacked by a rook", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteRook); // e1
  position.putPiece(60, Piece.BlackKing); // e8

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 60, Color.White),
    true
  );
});

test("rook attack is blocked by another piece", () => {
  const position = Position.empty();

  // White rook on e1
  position.putPiece(4, Piece.WhiteRook);

  // White pawn blocks the rook on e4
  position.putPiece(28, Piece.WhitePawn);

  // Black king on e8
  position.putPiece(60, Piece.BlackKing);

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 60, Color.White),
    false
  );
});

test("detects a square attacked by a bishop", () => {
  const position = Position.empty();

  // White bishop on c1
  position.putPiece(2, Piece.WhiteBishop);

  // Black king on h6
  position.putPiece(47, Piece.BlackKing);

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 47, Color.White),
    true
  );
});

test("detects a square attacked by a knight", () => {
  const position = Position.empty();

  // White knight on f5
  position.putPiece(37, Piece.WhiteKnight);

  // Black king on h6
  position.putPiece(47, Piece.BlackKing);

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 47, Color.White),
    true
  );
});

test("knight does not attack a non-knight square", () => {
  const position = Position.empty();

  // White knight on f5
  position.putPiece(37, Piece.WhiteKnight);

  // Black king on f6 — not a knight move away
  position.putPiece(45, Piece.BlackKing);

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 45, Color.White),
    false
  );
});

test("detects a square attacked by a pawn", () => {
  const position = Position.empty();

  // White pawn on e5
  position.putPiece(36, Piece.WhitePawn);

  // Black king on d6
  position.putPiece(43, Piece.BlackKing);

  assert.equal(
    MoveGenerator.isSquareAttacked(position, 43, Color.White),
    true
  );
});