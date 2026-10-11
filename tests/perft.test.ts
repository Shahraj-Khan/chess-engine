import { test } from "node:test";
import assert from "node:assert/strict";
import { perft } from "../src/move/perft.js";

import { Position } from "../src/core/position.js";
import { MoveGenerator } from "../src/move/move-generator.js";
import { parseFen } from "../src/core/fen.js";
import { makeMove, unmakeMove } from "../src/move/make-move.js";


test("perft depth 1 from starting position", () => {
  const position = Position.initial();

  const moves = MoveGenerator.generateLegalMoves(position);

  assert.equal(moves.length, 20);
});

test("perft starting position", () => {
  const position = Position.initial();

  assert.equal(perft(position, 1), 20);
  assert.equal(perft(position, 2), 400);
  assert.equal(perft(position, 3), 8902);
});

test("perft Kiwipete position", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  assert.equal(perft(position, 1), 48);
  assert.equal(perft(position, 2), 2039);
});

test("debug Kiwipete legal moves", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  const moves = MoveGenerator.generateLegalMoves(position);

  console.log(
    moves.map(
      (move) => `${move.from}->${move.to} (${move.type})`
    ).join("\n")
  );

  assert.equal(moves.length, 48);
});

test("perft depth 1 restores the original Kiwipete position", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  const original = position.clone();

  perft(position, 1);

  assert.equal(position.equals(original), true);
});

test("debug Kiwipete perft divide", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  const moves = MoveGenerator.generateLegalMoves(position);

  for (const move of moves) {
    const undoState = makeMove(position, move);
    const nodes = perft(position, 1);
    unmakeMove(position, move, undoState);

    const file = (square: number) => String.fromCharCode(97 + (square % 8));
const rank = (square: number) => String(Math.floor(square / 8) + 1);

console.log(
  `${file(move.from)}${rank(move.from)}->${file(move.to)}${rank(move.to)}: ${nodes}`
);
  }

  assert.equal(moves.length, 48);
});

test("black keeps castling rights after a non-rook capture", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  const moves = MoveGenerator.generateLegalMoves(position);

  const move = moves.find(
    (move) => move.from === 36 && move.to === 53
  );

  assert.ok(move);

  const undoState = makeMove(position, move);

  assert.equal(
    position.castlingRights,
    15
  );

  unmakeMove(position, move, undoState);
});

test("debug Kiwipete perft depth 1 moves", () => {
  const position = parseFen(
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"
  );

  const moves = MoveGenerator.generateLegalMoves(position);

  for (const move of moves) {
    const before = position.clone();

    const undoState = makeMove(position, move);
    const count = perft(position, 0);

    console.log(
      `${move.from}->${move.to} (${move.type}) => ${count}`
    );

    unmakeMove(position, move, undoState);

    assert.equal(position.equals(before), true);
  }

  assert.equal(moves.length, 48);
});