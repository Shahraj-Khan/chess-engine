import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CastlingRights,
  Color,
  FenError,
  NO_SQUARE,
  Piece,
  Position,
  START_FEN,
  Square,
  parseFen,
  toFen,
} from "../src/index.js";

/** Well-known test positions (standard perft suite) plus en passant cases. */
const ROUND_TRIP_FENS: ReadonlyArray<readonly [name: string, fen: string]> = [
  ["start position", START_FEN],
  ["kiwipete", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"],
  ["endgame (perft pos 3)", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
  ["promotions (perft pos 4)", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"],
  ["perft pos 5", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"],
  ["perft pos 6", "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"],
  ["after 1.e4 (black ep)", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"],
  ["after 1.e4 d5 2.e5 f5 (white ep)", "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3"],
  ["large counters", "4k3/8/8/8/8/8/8/4K3 b - - 99 250"],
];

describe("FEN parsing", () => {
  it("parses the start position identically to Position.initial()", () => {
    assert.equal(parseFen(START_FEN).equals(Position.initial()), true);
  });

  it("parses piece placement", () => {
    const position = parseFen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
    assert.equal(position.pieceAt(Square.A8), Piece.BlackRook);
    assert.equal(position.pieceAt(Square.E8), Piece.BlackKing);
    assert.equal(position.pieceAt(Square.E7), Piece.BlackQueen);
    assert.equal(position.pieceAt(Square.D5), Piece.WhitePawn);
    assert.equal(position.pieceAt(Square.E5), Piece.WhiteKnight);
    assert.equal(position.pieceAt(Square.F3), Piece.WhiteQueen);
    assert.equal(position.pieceAt(Square.H3), Piece.BlackPawn);
    assert.equal(position.pieceAt(Square.B4), Piece.BlackPawn);
    assert.equal(position.isEmpty(Square.B1), true);
  });

  it("parses side to move", () => {
    assert.equal(parseFen(START_FEN).sideToMove, Color.White);
    assert.equal(parseFen("4k3/8/8/8/8/8/8/4K3 b - - 0 1").sideToMove, Color.Black);
  });

  it("parses castling rights", () => {
    const base = "r3k2r/8/8/8/8/8/8/R3K2R w ";
    assert.equal(parseFen(`${base}KQkq - 0 1`).castlingRights, CastlingRights.All);
    assert.equal(parseFen(`${base}- - 0 1`).castlingRights, CastlingRights.None);
    assert.equal(
      parseFen(`${base}Kq - 0 1`).castlingRights,
      CastlingRights.WhiteKingSide | CastlingRights.BlackQueenSide,
    );
    assert.equal(parseFen(`${base}Qk - 0 1`).castlingRights, CastlingRights.WhiteQueenSide | CastlingRights.BlackKingSide);
  });

  it("parses the en passant square", () => {
    assert.equal(parseFen(START_FEN).enPassantSquare, NO_SQUARE);
    const black = parseFen("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    assert.equal(black.enPassantSquare, Square.E3);
    const white = parseFen("rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3");
    assert.equal(white.enPassantSquare, Square.F6);
  });

  it("parses the halfmove clock and fullmove number", () => {
    const position = parseFen("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8");
    assert.equal(position.halfmoveClock, 1);
    assert.equal(position.fullmoveNumber, 8);
  });

  it("defaults the counters when given a 4-field FEN", () => {
    const position = parseFen("4k3/8/8/8/8/8/8/4K3 w - -");
    assert.equal(position.halfmoveClock, 0);
    assert.equal(position.fullmoveNumber, 1);
  });

  it("tolerates surrounding and repeated whitespace", () => {
    const position = parseFen(`  ${START_FEN.replaceAll(" ", "   ")}\n`);
    assert.equal(position.equals(Position.initial()), true);
  });

  it("returns independent positions on each call", () => {
    const a = parseFen(START_FEN);
    const b = parseFen(START_FEN);
    a.removePiece(Square.E2);
    assert.equal(b.pieceAt(Square.E2), Piece.WhitePawn);
  });
});

describe("FEN generation", () => {
  it("generates the start FEN from Position.initial()", () => {
    assert.equal(toFen(Position.initial()), START_FEN);
  });

  it("generates FEN for a hand-built position", () => {
    const position = Position.empty();
    position.putPiece(Square.E1, Piece.WhiteKing);
    position.putPiece(Square.E8, Piece.BlackKing);
    position.putPiece(Square.A7, Piece.WhitePawn);
    position.sideToMove = Color.Black;
    position.halfmoveClock = 12;
    position.fullmoveNumber = 34;
    assert.equal(toFen(position), "4k3/P7/8/8/8/8/8/4K3 b - - 12 34");
  });

  it("reflects state-level piece movement and state changes", () => {
    const position = Position.initial();
    position.movePiece(Square.E2, Square.E4);
    position.sideToMove = Color.Black;
    position.enPassantSquare = Square.E3;
    assert.equal(
      toFen(position),
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
    );

    position.movePiece(Square.G8, Square.F6);
    position.sideToMove = Color.White;
    position.enPassantSquare = NO_SQUARE;
    position.halfmoveClock = 1;
    position.fullmoveNumber = 2;
    position.castlingRights &= ~CastlingRights.BlackKingSide;
    assert.equal(
      toFen(position),
      "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQq - 1 2",
    );
  });

  it("emits castling rights in canonical order", () => {
    const position = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w qkQK - 0 1");
    assert.equal(toFen(position), "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
  });
});

describe("FEN round trips", () => {
  for (const [name, fen] of ROUND_TRIP_FENS) {
    it(`round-trips ${name}`, () => {
      const position = parseFen(fen);
      assert.equal(toFen(position), fen);
      assert.equal(toFen(position.clone()), fen);
      assert.equal(parseFen(toFen(position)).equals(position), true);
    });
  }
});

describe("FEN validation", () => {
  const invalid: ReadonlyArray<readonly [name: string, fen: string]> = [
    ["empty string", ""],
    ["too few fields", "4k3/8/8/8/8/8/8/4K3 w"],
    ["five fields", "4k3/8/8/8/8/8/8/4K3 w - - 0"],
    ["seven fields", "4k3/8/8/8/8/8/8/4K3 w - - 0 1 x"],
    ["seven ranks", "4k3/8/8/8/8/8/4K3 w - - 0 1"],
    ["nine ranks", "4k3/8/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["rank with nine squares", "4k3/8/8/8/8/8/8/4K4 w - - 0 1"],
    ["rank too short", "4k3/8/8/8/8/8/8/4K2 w - - 0 1"],
    ["too many pieces in a rank", "4k3/8/8/8/8/8/8/4KPPPPP w - - 0 1"],
    ["unknown piece character", "4k3/8/8/8/8/8/8/4K2x w - - 0 1"],
    ["adjacent digits", "4k3/8/8/8/8/8/8/44K w - - 0 1"],
    ["digit zero", "4k3/8/8/8/8/8/8/0K7 w - - 0 1"],
    ["digit nine", "4k3/8/8/8/8/8/8/9 w - - 0 1"],
    ["bad side to move", "4k3/8/8/8/8/8/8/4K3 x - - 0 1"],
    ["uppercase side to move", "4k3/8/8/8/8/8/8/4K3 W - - 0 1"],
    ["duplicate castling letters", "r3k2r/8/8/8/8/8/8/R3K2R w KKkq - 0 1"],
    ["bad castling letter", "r3k2r/8/8/8/8/8/8/R3K2R w KQkx - 0 1"],
    ["dash mixed with castling letters", "r3k2r/8/8/8/8/8/8/R3K2R w -K - 0 1"],
    ["castling without a rook", "4k3/8/8/8/8/8/8/4K3 w K - 0 1"],
    ["castling with moved king", "4k3/8/8/8/8/8/8/R2K3R w KQ - 0 1"],
    ["black castling without its rook", "r3k3/8/8/8/8/8/8/4K3 w k - 0 1"],
    ["en passant square off the board", "4k3/8/8/8/8/8/8/4K3 w - e9 0 1"],
    ["en passant on wrong rank", "4k3/8/8/8/4P3/8/8/4K3 b - e4 0 1"],
    ["en passant rank wrong for side to move", "4k3/8/8/8/4P3/8/8/4K3 w - e3 0 1"],
    ["en passant without a pawn", "4k3/8/8/8/8/8/8/4K3 b - e3 0 1"],
    ["en passant with occupied target", "4k3/8/8/8/4P3/4n3/8/4K3 b - e3 0 1"],
    ["en passant with occupied origin square", "4k3/8/8/8/4P3/8/4N3/4K3 b - e3 0 1"],
    ["negative halfmove clock", "4k3/8/8/8/8/8/8/4K3 w - - -1 1"],
    ["non-numeric halfmove clock", "4k3/8/8/8/8/8/8/4K3 w - - x 1"],
    ["fractional fullmove number", "4k3/8/8/8/8/8/8/4K3 w - - 0 1.5"],
    ["fullmove number zero", "4k3/8/8/8/8/8/8/4K3 w - - 0 0"],
    ["missing white king", "4k3/8/8/8/8/8/8/8 w - - 0 1"],
    ["missing black king", "8/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["two white kings", "4k3/8/8/8/8/8/8/3KK3 w - - 0 1"],
    ["two black kings", "3kk3/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["pawn on rank 1", "4k3/8/8/8/8/8/8/3PK3 w - - 0 1"],
    ["pawn on rank 8", "3Pk3/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["pieces overflowing a rank", "4k3/8/8/8/8/8/8/pppppppp1 w - - 0 1"],
    ["nine white pawns", "4k3/8/8/8/8/P7/PPPPPPPP/4K3 w - - 0 1"],
  ];

  for (const [name, fen] of invalid) {
    it(`rejects ${name}`, () => {
      assert.throws(() => parseFen(fen), FenError, fen);
    });
  }

  it("reports problems with a descriptive FenError message", () => {
    assert.throws(
      () => parseFen("4k3/8/8/8/8/8/8/4K3 x - - 0 1"),
      (error: unknown) =>
        error instanceof FenError &&
        error.name === "FenError" &&
        error.message.startsWith("Invalid FEN:") &&
        error.message.includes("side to move"),
    );
  });
});
