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

test("perft position 3", () => {
  const position = parseFen(
    "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"
  );

  assert.equal(perft(position, 1), 14);
  assert.equal(perft(position, 2), 191);
  assert.equal(perft(position, 3), 2812);
});

test("debug perft position 4 legal moves", () => {
  const position = parseFen(
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"
  );

  const moves = MoveGenerator.generateLegalMoves(position);

  console.log("Position 4 legal moves:", moves.length);

  for (const move of moves) {
    console.log(`${move.from}->${move.to}`, move.type);
  }

  assert.equal(moves.length, 6);
});

test("debug position after d2-d4 Qa3-e3", () => {
  const position = parseFen(
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"
  );

  const whiteMove = MoveGenerator.generateLegalMoves(position)
    .find((move) => move.from === 11 && move.to === 27)!;

  makeMove(position, whiteMove);

  const blackMove = MoveGenerator.generateLegalMoves(position)
    .find((move) => move.from === 16 && move.to === 20)!;

  makeMove(position, blackMove);

  console.log("SIDE TO MOVE:", position.sideToMove);
  console.log("BOARD:");
  console.log(position.toString());

  const whiteMoves = MoveGenerator.generateLegalMoves(position);

  console.log(
    "WHITE LEGAL MOVES:",
    whiteMoves.map(
      (move) =>
        `${move.from}->${move.to} type=${move.type} promotion=${move.promotionPiece}`
    )
  );
});

test("perft position 4", () => {
const position = parseFen(
  "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"
);
assert.equal(perft(position, 1), 6);
assert.equal(perft(position, 2), 264);
for (const move of MoveGenerator.generateLegalMoves(position)) {
  const child = position.clone();
  makeMove(child, move);

  console.log(
    `DIVIDE ${move.from}->${move.to}: ${perft(child, 2)}`
  );
}
assert.equal(perft(position, 3), 9467);
});

test("perft position 5", () => {
  const position = parseFen(
    "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"
  );

  assert.equal(perft(position, 1), 44);
  assert.equal(perft(position, 2), 1486);
  assert.equal(perft(position, 3), 62379);
});


const position = parseFen(
  "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"
);

const moves = MoveGenerator.generateLegalMoves(position);

console.log(
  moves.map(
    (move) => `${move.from}-${move.to}`
  )
);

assert.equal(perft(position, 1), 46);
assert.equal(perft(position, 2), 2079);
assert.equal(perft(position, 3), 89890);