
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { Position } from "../src/core/position.js";
import { iterativeDeepening } from "../src/search/iterative-deepening.js";

test("iterative deepening completes requested search depth", () => {
  const position = Position.initial();

  const result = iterativeDeepening(position, 2);

  assert.ok(result.bestMove !== null);
  assert.equal(result.completedDepth, 2);

  // The selected move must be legal in the original position.
  const { MoveGenerator } = requireMoveGenerator();
  const legalMoves = MoveGenerator.generateLegalMoves(position);

  assert.ok(
    legalMoves.some(
      (move) =>
        move.from === result.bestMove!.from &&
        move.to === result.bestMove!.to &&
        move.type === result.bestMove!.type &&
        move.promotionPiece === result.bestMove!.promotionPiece
    )
  );
});

test("iterative deepening preserves the position", () => {
  const position = Position.initial();
  const before = position.toString();

  iterativeDeepening(position, 2);

  assert.equal(position.toString(), before);
});

test("iterative deepening returns no move for a terminal position", () => {
  const position = Position.initial();

  const result = iterativeDeepening(position, 0);

  assert.equal(result.bestMove, null);
  assert.equal(result.completedDepth, 0);
});

// Keep imports static for TypeScript/ESM compatibility.
function requireMoveGenerator() {
  return { MoveGenerator };
}

import { MoveGenerator } from "../src/move/move-generator.js";

test("iterative deepening safely stops when the deadline has expired", () => {
  const position = Position.initial();
  const before = position.toString();

  const result = iterativeDeepening(position, 64, {
    deadline: Date.now() - 1,
  });

  assert.ok(result.bestMove !== null);
  assert.equal(result.completedDepth, 0);
  assert.equal(position.toString(), before);

  const legalMoves = MoveGenerator.generateLegalMoves(position);

  assert.ok(
    legalMoves.some(
      (move) =>
        move.from === result.bestMove!.from &&
        move.to === result.bestMove!.to &&
        move.type === result.bestMove!.type &&
        move.promotionPiece === result.bestMove!.promotionPiece
    )
  );
});

test("iterative deepening safely stops during search", () => {
  const position = Position.initial();
  const before = position.toString();
  let checks = 0;

  const result = iterativeDeepening(position, 64, {
    shouldStop: () => {
      checks++;
      return checks > 30;
    },
  });

  assert.ok(checks > 30);
  assert.ok(result.bestMove !== null);
  assert.equal(position.toString(), before);

  const legalMoves = MoveGenerator.generateLegalMoves(position);

  assert.ok(
    legalMoves.some(
      (move) =>
        move.from === result.bestMove!.from &&
        move.to === result.bestMove!.to &&
        move.type === result.bestMove!.type &&
        move.promotionPiece === result.bestMove!.promotionPiece
    )
  );
});