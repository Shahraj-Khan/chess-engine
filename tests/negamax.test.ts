import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseFen } from "../src/core/fen.js";
import {
  negamax,
  findBestMove,
} from "../src/search/negamax.js";


test("negamax prefers winning a queen", () => {
  const position = parseFen(
    "4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1"
  );

  const score = negamax(position, 1);

  assert.equal(score, 915);
});

test("findBestMove chooses a queen capture", () => {
  const position = parseFen(
    "4k3/8/8/8/8/3q4/8/3RK3 w - - 0 1"
  );

  const bestMove = findBestMove(position, 1);

  assert.ok(bestMove !== null);
  assert.equal(bestMove.from, 3);
  assert.equal(bestMove.to, 19);
});

test("negamax detects checkmate", () => {
  const position = parseFen(
    "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1"
  );

  const score = negamax(position, 1);

  assert.equal(score, -Infinity);
});

test("negamax detects stalemate", () => {
  const position = parseFen(
    "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"
  );

  const score = negamax(position, 1);

  assert.equal(score, 0);
});