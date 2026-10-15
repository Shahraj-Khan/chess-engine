import assert from "node:assert/strict";
import { test } from "node:test";
import { Position } from "../src/core/position.js";
import { parseSquare } from "../src/core/square.js";
import { makeMove } from "../src/move/make-move.js";
import { MoveGenerator } from "../src/move/move-generator.js";
import { findBookMove } from "../src/opening-book/opening-book.js";

function playMoves(moves: string[]): Position {
  const position = Position.initial();

  for (const text of moves) {
    const from = parseSquare(text.slice(0, 2));
    const to = parseSquare(text.slice(2, 4));

    const move = MoveGenerator.generateLegalMoves(position).find(
      (candidate) =>
        candidate.from === from && candidate.to === to,
    );

    assert.ok(move, `Expected legal move: ${text}`);
    makeMove(position, move);
  }

  return position;
}

test("opening book returns a legal move from the starting position", () => {
  const position = Position.initial();
  const move = findBookMove(position, []);

  assert.ok(move);

  const legalMoves = MoveGenerator.generateLegalMoves(position);
  assert.ok(
    legalMoves.some(
      (candidate) =>
        candidate.from === move.from && candidate.to === move.to,
    ),
    "Opening book must return a legal move",
  );
});

test("opening book returns a legal move after e2e4 e7e5", () => {
  const moves = ["e2e4", "e7e5"];
  const position = playMoves(moves);
  const move = findBookMove(position, moves);

  assert.ok(move);

  const legalMoves = MoveGenerator.generateLegalMoves(position);
  assert.ok(
    legalMoves.some(
      (candidate) =>
        candidate.from === move.from &&
        candidate.to === move.to &&
        candidate.type === move.type &&
        candidate.promotionPiece === move.promotionPiece,
    ),
    "Opening book must return a legal candidate",
  );
});

test("opening book returns null for an unknown opening line", () => {
  const position = Position.initial();

  assert.equal(findBookMove(position, ["g1f3"]), null);
});
