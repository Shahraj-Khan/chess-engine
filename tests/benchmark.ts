
import { performance } from "node:perf_hooks";

import { parseFen } from "../src/core/fen.js";
import { TranspositionTable } from "../src/search/transposition-table.js";
import {
  negamax,
  findBestMove,
  createSearchStats,
} from "../src/search/negamax.js";

const positions = [
  {
    name: "Starting position",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  },
  {
    name: "Open position",
    fen: "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 1",
  },
  {
    name: "Endgame position",
    fen: "8/5pk1/6p1/8/3K4/6P1/5P2/8 w - - 0 1",
  },
];

const depth = 3;
const runs = 5;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

for (const item of positions) {
  const position = parseFen(item.fen);
  const coldTimes: number[] = [];
  const warmTimes: number[] = [];

  let expectedScore: number | null = null;
  let scoresMatch = true;

  let profileStats = createSearchStats();

  // Warm up the JavaScript runtime.
  negamax(
    position,
    2,
    -Infinity,
    Infinity,
    new TranspositionTable()
  );

  // Measure fresh-table searches and collect first-run statistics.
  for (let i = 0; i < runs; i++) {
    const table = new TranspositionTable();
    const stats = createSearchStats();

    const start = performance.now();

    const score = negamax(
      position,
      depth,
      -Infinity,
      Infinity,
      table,
      stats
    );

    coldTimes.push(performance.now() - start);

    if (i === 0) {
      profileStats = { ...stats };
    }

    if (expectedScore === null) {
      expectedScore = score;
    } else if (score !== expectedScore) {
      scoresMatch = false;
    }
  }

  // Measure searches that reuse a populated table.
  const sharedTable = new TranspositionTable();

  const initialScore = negamax(
    position,
    depth,
    -Infinity,
    Infinity,
    sharedTable
  );

  for (let i = 0; i < runs; i++) {
    const start = performance.now();

    const score = negamax(
      position,
      depth,
      -Infinity,
      Infinity,
      sharedTable
    );

    warmTimes.push(performance.now() - start);

    if (score !== initialScore) {
      scoresMatch = false;
    }
  }

  console.log(`\n=== ${item.name} ===`);
  console.log(`Depth: ${depth}, Runs: ${runs}`);
  console.log(`Cold average: ${average(coldTimes).toFixed(2)} ms`);
  console.log(`Warm average: ${average(warmTimes).toFixed(2)} ms`);
  console.log(`Score: ${initialScore}`);
  console.log(`Scores match: ${scoresMatch}`);
  console.log(`Table entries: ${sharedTable.size}`);

  console.log("\n--- Search Profiling (first cold run) ---");
  console.log(`Nodes: ${profileStats.nodes}`);
  console.log(`TT Hits: ${profileStats.ttHits}`);
  console.log(`TT Cutoffs: ${profileStats.ttCutoffs}`);
  console.log(`Beta Cutoffs: ${profileStats.betaCutoffs}`);


  // Profile best-move search with a fresh table.
  const searchTable = new TranspositionTable();
  const searchStats = createSearchStats();

  const searchStart = performance.now();

  const bestMove = findBestMove(
    position,
    depth,
    searchTable,
    searchStats
  );

  const searchTime = performance.now() - searchStart;

  console.log("\n--- Best Move Search Profiling ---");
  console.log(`Best move: ${JSON.stringify(bestMove)}`);
  console.log(`Search time: ${searchTime.toFixed(2)} ms`);
  console.log(`Nodes: ${searchStats.nodes}`);
  console.log(`TT Hits: ${searchStats.ttHits}`);
  console.log(`TT Cutoffs: ${searchStats.ttCutoffs}`);
  console.log(`Beta Cutoffs: ${searchStats.betaCutoffs}`);


}
