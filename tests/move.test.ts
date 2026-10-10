import test from "node:test";
import assert from "node:assert/strict";

import { Move, MoveType } from "../src/move/move.js";

test("Move stores source and destination squares", () => {
  const move = new Move(12, 28);

  assert.equal(move.from, 12);
  assert.equal(move.to, 28);
});

test("Move defaults to NORMAL", () => {
  const move = new Move(12, 28);

  assert.equal(move.type, MoveType.NORMAL);
  assert.equal(move.promotionPiece, 0);
});

test("Move stores special move type", () => {
  const move = new Move(4, 6, MoveType.CASTLE);

  assert.equal(move.type, MoveType.CASTLE);
});

test("Move stores promotion piece", () => {
  const move = new Move(52, 60, MoveType.PROMOTION, 5);

  assert.equal(move.type, MoveType.PROMOTION);
  assert.equal(move.promotionPiece, 5);
});