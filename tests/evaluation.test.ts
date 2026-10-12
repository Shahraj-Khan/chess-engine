import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseFen } from "../src/core/fen.js";
import { evaluate } from "../src/evaluation/evaluate.js";

test("starting position has equal material", () => {
  const position = parseFen(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );

  assert.equal(evaluate(position), 0);
});

test("white up one pawn has a score of +100", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/7P/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1"
  );

  assert.equal(evaluate(position), 100);
});

test("black up one pawn has a score of -100", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/8/7p/8/PPPPPPP1/RNBQKBNR b KQkq - 0 1"
  );

  assert.equal(evaluate(position), -100);
});

test("white up one queen has a score of +900", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/7Q/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1"
  );

  assert.equal(evaluate(position), 900);
});

test("black up one queen has a score of -900", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/7q/8/8/PPPPPPP1/RNBQKBNR b KQkq - 0 1"
  );

  assert.equal(evaluate(position), -900);
});

test("white up one rook has a score of +500", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/7R/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1"
  );

  assert.equal(evaluate(position), 500);
});

test("black up one rook has a score of -500", () => {
  const position = parseFen(
    "rnbqkbnr/ppppppp1/8/7r/8/8/PPPPPPP1/RNBQKBNR b KQkq - 0 1"
  );

  assert.equal(evaluate(position), -500);
});

test("white up one bishop has a score of +330", () => {
  const position = parseFen(
    "rnbqk1nr/ppppppp1/8/7B/8/8/PPPPPPP1/RNBQK1NR w KQkq - 0 1"
  );

  assert.equal(evaluate(position), 330);
});

test("black up one bishop has a score of -330", () => {
  const position = parseFen(
    "rnbqk1nr/ppppppp1/8/7b/8/8/PPPPPPP1/RNBQK1NR b KQkq - 0 1"
  );

  assert.equal(evaluate(position), -330);
});

test("white up one knight has a score of +320", () => {
  const position = parseFen(
    "4k3/8/8/7N/8/8/8/4K3 w - - 0 1"
  );
  assert.equal(evaluate(position), 320);
});

test("knight gets a bonus for being in the center", () => {
  const position = parseFen(
    "4k3/8/8/3N4/8/8/8/4K3 w - - 0 1"
  );

  assert.ok(evaluate(position) > 320);
});

test("black knight gets a bonus for being in the center", () => {
  const position = parseFen(
    "4k3/8/8/8/3n4/8/8/4K3 b - - 0 1"
  );

  assert.ok(evaluate(position) < -320);
});

test("black knight gets a bonus on black's side of the center", () => {
  const position = parseFen(
    "4k3/8/3n4/8/8/8/8/4K3 b - - 0 1"
  );

  assert.ok(evaluate(position) < -320);
});