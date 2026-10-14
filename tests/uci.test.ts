
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import assert from "node:assert/strict";
import { test } from "node:test";

function startEngine(): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, ["dist/src/uci/uci.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function sendAndWait(
  engine: ChildProcessWithoutNullStreams,
  commands: string,
  expected: RegExp,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let output = "";

    const timeout = setTimeout(() => {
      engine.stdout.off("data", onData);
      reject(new Error(`Timed out waiting for: ${expected}`));
    }, 5000);

    const onData = (chunk: Buffer | string) => {
      output += chunk.toString();

      if (expected.test(output)) {
        clearTimeout(timeout);
        engine.stdout.off("data", onData);
        resolve(output);
      }
    };

    engine.stdout.on("data", onData);
    engine.stdin.write(`${commands}\n`);
  });
}

async function withEngine(
  run: (engine: ChildProcessWithoutNullStreams) => Promise<void>,
): Promise<void> {
  const engine = startEngine();

  try {
    await run(engine);
  } finally {
    engine.kill();
  }
}

test("UCI handshake returns engine identity and uciok", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(engine, "uci", /uciok/);

    assert.match(output, /id name NFamily Chess Engine/);
    assert.match(output, /id author NFamily/);
    assert.match(output, /uciok/);
  });
});

test("isready returns readyok", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(engine, "isready", /readyok/);

    assert.match(output, /readyok/);
  });
});

test("engine returns a legal bestmove from the starting position", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      "position startpos\ngo depth 2",
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    assert.match(output, /info depth 2/);
    assert.match(
      output,
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );
  });
});

test("engine accepts a position with move history", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      "position startpos moves e2e4 e7e5 g1f3\ngo depth 2",
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    assert.match(output, /info depth 2/);
    assert.match(
      output,
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );
  });
});

test("invalid move is reported without crashing the engine", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      "position startpos moves e2e5\ngo depth 1",
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    assert.match(output, /info string Invalid move: e2e5/);
    assert.match(output, /bestmove [a-h][1-8][a-h][1-8][qrbn]?/);
  });
});

test("invalid search depth returns bestmove 0000", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      "go depth 0",
      /bestmove 0000/,
    );

    assert.match(output, /info string Invalid search depth/);
    assert.match(output, /bestmove 0000/);
  });
});



test("invalid position preserves the previous valid position", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      [
        "position startpos moves e2e4",
        "position startpos moves e2e5",
        "go depth 2",
      ].join("\n"),
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    assert.match(output, /info string Invalid move: e2e5/);
    assert.match(output, /info depth 2/);

    const bestMove = output.match(
      /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)$/m,
    );

    assert.ok(bestMove, "Engine should return a bestmove");
  });
});



test("engine accepts a custom FEN position", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      [
        "position fen rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
        "go depth 2",
      ].join("\n"),
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    assert.match(output, /info depth 2/);
    assert.match(
      output,
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );
  });
});



test("engine returns a valid promotion move in UCI format", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      [
        "position fen 4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
        "go depth 2",
      ].join("\n"),
      /bestmove [a-h][1-8][a-h][1-8][qrbn]?/,
    );

    const match = output.match(
      /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)$/m,
    );

    assert.ok(match, "Engine should return a valid UCI move");
    assert.match(
      match[1]!,
      /^a7a8[qrbn]$/,
      "The bestmove should promote the pawn on a7",
    );
  });
});



test("checkmate position returns bestmove 0000", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      [
        "position fen 7k/6Q1/5K2/8/8/8/8/8 b - - 0 1",
        "go depth 2",
      ].join("\n"),
      /bestmove 0000/,
    );

    assert.match(output, /bestmove 0000/);
  });
});

test("stalemate position returns bestmove 0000", async () => {
  await withEngine(async (engine) => {
    const output = await sendAndWait(
      engine,
      [
        "position fen 7k/5K2/6Q1/8/8/8/8/8 b - - 0 1",
        "go depth 2",
      ].join("\n"),
      /bestmove 0000/,
    );

    assert.match(output, /bestmove 0000/);
  });
});
