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

test("bishop gets a bonus for being active in the center", () => {
  const position = parseFen(
    "4k3/8/8/3B4/8/8/8/4K3 w - - 0 1"
  );

  assert.ok(evaluate(position) > 330);
});

test("black bishop gets a bonus for being active in the center", () => {
  const position = parseFen(
    "4k3/8/3b4/8/8/8/8/4K3 b - - 0 1"
  );

  assert.ok(evaluate(position) < -330);
});

test("rook gets a bonus for being active on an open file", () => {
  const position = parseFen(
    "4k3/8/8/8/8/8/8/R3K3 w - - 0 1"
  );

  assert.ok(evaluate(position) > 500);
});

test("black rook gets a positional bonus", () => {
  const position = parseFen(
    "4k3/8/8/8/8/8/8/4K2r b - - 0 1"
  );

  assert.ok(evaluate(position) < -500);
});

test("queen gets a small bonus for being active in the center", () => {
  const position = parseFen(
    "4k3/8/8/3Q4/8/8/8/4K3 w - - 0 1"
  );

  assert.ok(evaluate(position) > 900);
});

test("black queen gets a positional bonus in the center", () => {
  const position = parseFen(
    "4k3/8/8/3q4/8/8/8/4K3 b - - 0 1"
  );

  assert.ok(evaluate(position) < -900);
});

test("king gets a safety bonus when castled", () => {
  const position = parseFen(
    "r3k2r/pppq1ppp/2np1n2/8/8/5N2/PPPP1PPP/RNBQ1RK1 w - - 0 1"
  );

  assert.ok(evaluate(position) > 0);
});

test("exposed king gets a safety penalty", () => {
  const position = parseFen(
    "r3k2r/pppq1ppp/2np1n2/8/8/5N2/PPPP1PPP/RNBQK2R w - - 0 1"
  );

  assert.ok(evaluate(position) < 0);
});