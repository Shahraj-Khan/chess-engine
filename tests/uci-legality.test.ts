
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";
import { parseFen, START_FEN } from "../src/core/fen.js";
import { MoveGenerator } from "../src/move/move-generator.js";
import { squareToString } from "../src/core/square.js";

test("UCI bestmove is legal in the starting position", async () => {
  const engine = spawn(
    process.execPath,
    ["dist/src/uci/uci.js"],
    { stdio: ["pipe", "pipe", "pipe"] },
  );

  try {
    const output = await new Promise<string>((resolve, reject) => {
      let result = "";

      const timeout = setTimeout(() => {
        reject(new Error("Engine did not return bestmove in time"));
      }, 10000);

      engine.stdout.on("data", (chunk: Buffer) => {
        result += chunk.toString();

        const match = result.match(
          /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)$/m,
        );

        if (match) {
          clearTimeout(timeout);
          resolve(match[1]!);
        }
      });

      engine.stdin.write("position startpos\ngo depth 2\n");
    });

    const position = parseFen(START_FEN);
    const legalMoves = MoveGenerator.generateLegalMoves(position);

    const bestmove = output;
    const from = bestmove.slice(0, 2);
    const to = bestmove.slice(2, 4);
    const promotion = bestmove.length === 5
      ? bestmove[4]
      : "";

    const isLegal = legalMoves.some((move) => {
      const moveFrom = squareToString(move.from);
      const moveTo = squareToString(move.to);

      if (moveFrom !== from || moveTo !== to) {
        return false;
      }

      if (move.type === 3) {
        return promotion !== "" && move.promotionPiece !== 0;
      }

      return promotion === "";
    });

    assert.ok(isLegal, `Engine returned an illegal move: ${bestmove}`);
  } finally {
    engine.kill();
  }
});
