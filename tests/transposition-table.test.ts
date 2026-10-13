
import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parseFen } from "../src/core/fen.js";
import {
  negamax,
  createSearchStats,
} from "../src/search/negamax.js";
import {
  TranspositionTable,
  TTBound,
} from "../src/search/transposition-table.js";
import { computeZobristHash } from "../src/search/zobrist.js";
import { findBestMove } from "../src/search/negamax.js";
import { MoveGenerator } from "../src/move/move-generator.js";


test("transposition table stores and retrieves an entry", () => {
  const table = new TranspositionTable();
  const position = parseFen(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const hash = computeZobristHash(position);

  const entry = {
    hash,
    depth: 3,
    score: 25,
    bound: TTBound.Exact,
    bestMove: null,
  };

  table.store(entry);

  assert.deepEqual(table.probe(hash), entry);
  assert.equal(table.size, 1);
});

test("transposition table preserves a deeper entry", () => {
  const table = new TranspositionTable();
  const hash = 123n;

  table.store({
    hash,
    depth: 5,
    score: 50,
    bound: TTBound.Exact,
    bestMove: null,
  });

  table.store({
    hash,
    depth: 2,
    score: 20,
    bound: TTBound.Exact,
    bestMove: null,
  });

  assert.equal(table.probe(hash)?.depth, 5);
  assert.equal(table.probe(hash)?.score, 50);
});

test("transposition table can be cleared", () => {
  const table = new TranspositionTable();

  table.store({
    hash: 123n,
    depth: 1,
    score: 10,
    bound: TTBound.Exact,
    bestMove: null,
  });

  table.clear();

  assert.equal(table.size, 0);
  assert.equal(table.probe(123n), null);
});

test("negamax returns the same score with a reused table", () => {
  const position = parseFen(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const table = new TranspositionTable();

  const scoreWithoutWarmTable = negamax(
    position,
    2,
    -Infinity,
    Infinity,
    new TranspositionTable()
  );

  const scoreWithWarmTable = negamax(
    position,
    2,
    -Infinity,
    Infinity,
    table
  );

  const repeatedScore = negamax(
    position,
    2,
    -Infinity,
    Infinity,
    table
  );

  assert.equal(scoreWithWarmTable, scoreWithoutWarmTable);
  assert.equal(repeatedScore, scoreWithoutWarmTable);
});


test("findBestMove returns a legal move when reusing a transposition table", () => {
  const position = parseFen(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  const table = new TranspositionTable();

  findBestMove(position, 2, table);

  const bestMove = findBestMove(position, 2, table);
  const legalMoves = MoveGenerator.generateLegalMoves(position);

  assert.ok(bestMove !== null);
  assert.ok(
    legalMoves.some(
      (move) => move.from === bestMove.from && move.to === bestMove.to
    )
  );
});



test("negamax records a transposition table hit", () => {
  const position = parseFen(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );

  const table = new TranspositionTable();

  // First search populates the table.
  negamax(position, 2, -Infinity, Infinity, table);

  // Second search should reuse the cached root entry.
  const stats = createSearchStats();

  negamax(position, 2, -Infinity, Infinity, table, stats);

  assert.ok(
    stats.ttHits > 0,
    `Expected at least one TT hit, received ${stats.ttHits}`
  );

  assert.ok(
    stats.nodes > 0,
    "Expected the search node counter to increase"
  );
});

