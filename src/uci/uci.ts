
import { createInterface } from "node:readline";
import { Position } from "../core/position.js";
import { START_FEN, parseFen } from "../core/fen.js";
import { parseSquare, squareToString } from "../core/square.js";
import { PieceType } from "../core/piece.js";
import { Move, MoveType } from "../move/move.js";
import { makeMove } from "../move/make-move.js";
import { MoveGenerator } from "../move/move-generator.js";
import { iterativeDeepening } from "../search/iterative-deepening.js";

let position = parseFen(START_FEN);

function moveToUci(move: Move): string {
  let result =
    squareToString(move.from) + squareToString(move.to);

  if (move.type === MoveType.PROMOTION) {
    const promotionNames: Record<number, string> = {
      [PieceType.Queen]: "q",
      [PieceType.Rook]: "r",
      [PieceType.Bishop]: "b",
      [PieceType.Knight]: "n",
    };

    result += promotionNames[move.promotionPiece] ?? "q";
  }

  return result;
}



function setPosition(command: string): void {
  const tokens = command.trim().split(/\s+/);
  const movesIndex = tokens.indexOf("moves");

  const baseTokens =
    movesIndex === -1 ? tokens : tokens.slice(0, movesIndex);

  let nextPosition: Position;

  try {
    if (baseTokens[1] === "startpos") {
      nextPosition = Position.initial();
    } else if (baseTokens[1] === "fen") {
      const fen = baseTokens.slice(2).join(" ");

      if (!fen) {
        console.log("info string Invalid position: missing FEN");
        return;
      }

      nextPosition = parseFen(fen);
    } else {
      console.log("info string Invalid position command");
      return;
    }

    if (movesIndex !== -1) {
      const moveTexts = tokens.slice(movesIndex + 1);

      for (const moveText of moveTexts) {
        const legalMoves = MoveGenerator.generateLegalMoves(nextPosition);

        const from = parseSquare(moveText.slice(0, 2));
        const to = parseSquare(moveText.slice(2, 4));
        const promotion =
          moveText.length === 5 ? moveText[4]!.toLowerCase() : null;

        const promotionTypes: Record<string, PieceType> = {
          q: PieceType.Queen,
          r: PieceType.Rook,
          b: PieceType.Bishop,
          n: PieceType.Knight,
        };

        const move = legalMoves.find((candidate) => {
          if (candidate.from !== from || candidate.to !== to) {
            return false;
          }

          if (candidate.type === MoveType.PROMOTION) {
            return (
              promotion !== null &&
              candidate.promotionPiece === promotionTypes[promotion]
            );
          }

          return promotion === null;
        });

        if (!/^[a-h][1-8][a-h][1-8][qrbnQRBN]?$/.test(moveText) || !move) {
          console.log(`info string Invalid move: ${moveText}`);
          return;
        }

        makeMove(nextPosition, move);
      }
    }

    // Commit only after the entire position and move history are valid.
    position = nextPosition;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    console.log(`info string Invalid position: ${message}`);
  }
}


export function startUci(): void {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line: string) => {
    const command = line.trim();

    try {
      if (command === "uci") {
        console.log("id name NFamily Chess Engine");
        console.log("id author NFamily");
        console.log("uciok");
      } else if (command === "isready") {
        console.log("readyok");
      } else if (command === "ucinewgame") {
        position = Position.initial();
      } else if (command.startsWith("position ")) {
        setPosition(command);
      } else if (command.startsWith("go")) {
        const tokens = command.split(/\s+/);
        const depthIndex = tokens.indexOf("depth");
        const depth =
          depthIndex !== -1
            ? Number(tokens[depthIndex + 1])
            : 3;

        if (!Number.isInteger(depth) || depth < 1) {
          console.log("info string Invalid search depth");
          console.log("bestmove 0000");
          return;
        }

        const result = iterativeDeepening(position, depth);

        console.log(`info depth ${result.completedDepth}`);

        console.log(
          `bestmove ${
            result.bestMove ? moveToUci(result.bestMove) : "0000"
          }`,
        );
      } else if (command === "quit") {
        rl.close();
      } else if (command !== "") {
        console.log(`info string Unknown command: ${command}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);

      console.log(`info string Error: ${message}`);
    }
  });
}

startUci();
