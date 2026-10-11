import test from "node:test";
import assert from "node:assert/strict";


import { Move, MoveType } from "../src/move/move.js";
import { Position } from "../src/core/position.js";
import { Piece } from "../src/core/piece.js";
import { makeMove, unmakeMove } from "../src/move/make-move.js";
import { Color } from "../src/core/color.js";
import { CastlingRights } from "../src/core/castling.js";




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

test("makes a normal move", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);

  const move = new Move(4, 12);

  // This function does not exist yet.
  // We will implement it in the next step.
  makeMove(position, move);

  assert.equal(position.pieceAt(4), Piece.None);
  assert.equal(position.pieceAt(12), Piece.WhiteKing);
});

test("makes a capture move", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);
  position.putPiece(12, Piece.BlackRook);

  const move = new Move(4, 12);

  makeMove(position, move);

  assert.equal(position.pieceAt(4), Piece.None);
  assert.equal(position.pieceAt(12), Piece.WhiteKing);
});

test("changes the side to move after a move", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);

  const move = new Move(4, 12);

  assert.equal(position.sideToMove, Color.White);

  makeMove(position, move);

  assert.equal(position.sideToMove, Color.Black);
});

test("increments the fullmove number after Black moves", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);
  position.putPiece(60, Piece.BlackKing);

  assert.equal(position.fullmoveNumber, 1);

  const whiteMove = new Move(4, 12);
  makeMove(position, whiteMove);

  assert.equal(position.fullmoveNumber, 1);

  const blackMove = new Move(60, 52);
  makeMove(position, blackMove);

  assert.equal(position.fullmoveNumber, 2);
});

test("resets the halfmove clock after a pawn move", () => {
  const position = Position.empty();

  position.putPiece(12, Piece.WhitePawn);
  position.putPiece(60, Piece.BlackKing);

  position.halfmoveClock = 7;

  const move = new Move(12, 20);
  makeMove(position, move);

  assert.equal(position.halfmoveClock, 0);
});

test("increments the halfmove clock after a non-pawn non-capture move", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);
  position.putPiece(60, Piece.BlackKing);

  position.halfmoveClock = 7;

  const move = new Move(4, 12);
  makeMove(position, move);

  assert.equal(position.halfmoveClock, 8);
});

test("resets the halfmove clock after a capture", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);
  position.putPiece(12, Piece.BlackKnight);
  position.putPiece(60, Piece.BlackKing);

  position.halfmoveClock = 7;

  const move = new Move(4, 12);
  makeMove(position, move);

  assert.equal(position.halfmoveClock, 0);
});

test("sets the en passant square after a two-square pawn move", () => {
  const position = Position.empty();

  position.putPiece(12, Piece.WhitePawn);
  position.putPiece(60, Piece.BlackKing);
  position.sideToMove = Color.White;

  const move = new Move(12, 28);
  makeMove(position, move);

  assert.equal(position.enPassantSquare, 20);
});

test("clears the en passant square after a non-double-pawn move", () => {
  const position = Position.empty();

  position.putPiece(12, Piece.WhitePawn); // e2
  position.putPiece(52, Piece.BlackPawn); // e7
  position.putPiece(60, Piece.BlackKing); // e8

  position.sideToMove = Color.White;

  // White: e2-e4
  makeMove(position, new Move(12, 28));

  assert.equal(position.enPassantSquare, 20);

  // Black: e7-e6
  makeMove(position, new Move(52, 44));

  assert.equal(position.enPassantSquare, -1);
});

test("sets the en passant square after a black two-square pawn move", () => {
  const position = Position.empty();

  position.putPiece(52, Piece.BlackPawn); // e7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.sideToMove = Color.Black;

  // Black: e7-e5
  makeMove(position, new Move(52, 36));

  assert.equal(position.enPassantSquare, 44);
});

test("makes an en passant capture", () => {
  const position = Position.empty();

  position.putPiece(36, Piece.WhitePawn); // e5
  position.putPiece(51, Piece.BlackPawn); // d7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.sideToMove = Color.Black;

  // Black: d7-d5
  makeMove(position, new Move(51, 35));

  assert.equal(position.enPassantSquare, 43);

  // White: e5xd6 en passant
  makeMove(
    position,
    new Move(36, 43, MoveType.EN_PASSANT)
  );

  assert.equal(position.pieceAt(43), Piece.WhitePawn);
  assert.equal(position.pieceAt(35), Piece.None);
});

test("makes a black en passant capture", () => {
  const position = Position.empty();

  position.putPiece(27, Piece.BlackPawn); // d4
  position.putPiece(12, Piece.WhitePawn); // e2
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.sideToMove = Color.White;

  // White: e2-e4
  makeMove(position, new Move(12, 28));

  assert.equal(position.enPassantSquare, 20);

  // Black: d4xe3 en passant
  makeMove(
    position,
    new Move(27, 20, MoveType.EN_PASSANT)
  );

  assert.equal(position.pieceAt(20), Piece.BlackPawn);
  assert.equal(position.pieceAt(28), Piece.None);
});

test("removes both white castling rights when white king moves", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.castlingRights =
    CastlingRights.WhiteKingSide |
    CastlingRights.WhiteQueenSide;

  position.sideToMove = Color.White;

  makeMove(
    position,
    new Move(4, 12) // Ke1-e2
  );

  assert.equal(position.castlingRights & CastlingRights.WhiteKingSide, 0);
  assert.equal(position.castlingRights & CastlingRights.WhiteQueenSide, 0);
});

test("removes both black castling rights when black king moves", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.castlingRights =
    CastlingRights.BlackKingSide |
    CastlingRights.BlackQueenSide;

  position.sideToMove = Color.Black;

  makeMove(
    position,
    new Move(60, 52) // Ke8-e7
  );

  assert.equal(position.castlingRights & CastlingRights.BlackKingSide, 0);
  assert.equal(position.castlingRights & CastlingRights.BlackQueenSide, 0);
});

test("removes white king-side castling right when h1 rook moves", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(7, Piece.WhiteRook);  // h1
  position.putPiece(60, Piece.BlackKing); // e8

  position.castlingRights =
    CastlingRights.WhiteKingSide |
    CastlingRights.WhiteQueenSide;

  position.sideToMove = Color.White;

  makeMove(
    position,
    new Move(7, 15) // Rh1-h2
  );

  assert.equal(position.castlingRights & CastlingRights.WhiteKingSide, 0);

  // Queen-side right should remain.
  assert.notEqual(
    position.castlingRights & CastlingRights.WhiteQueenSide,
    0
  );
});

test("removes white king-side castling right when h1 rook is captured", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);   // e1
  position.putPiece(7, Piece.WhiteRook);   // h1
  position.putPiece(14, Piece.BlackKing);  // g2
  position.putPiece(6, Piece.BlackBishop); // g1

  position.castlingRights =
    CastlingRights.WhiteKingSide |
    CastlingRights.WhiteQueenSide;

  position.sideToMove = Color.Black;

  makeMove(
    position,
    new Move(6, 7) // Bg1xh1
  );

  assert.equal(position.castlingRights & CastlingRights.WhiteKingSide, 0);

  // Queen-side right should remain.
  assert.notEqual(
    position.castlingRights & CastlingRights.WhiteQueenSide,
    0
  );
});

test("white king-side castling moves king and rook", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(7, Piece.WhiteRook); // h1

  position.castlingRights = CastlingRights.WhiteKingSide;

  const move = new Move(4, 6, MoveType.CASTLE); // e1 -> g1

  makeMove(position, move);

  assert.equal(position.pieceAt(6), Piece.WhiteKing); // g1
  assert.equal(position.pieceAt(5), Piece.WhiteRook); // f1

  assert.equal(position.pieceAt(4), Piece.None); // e1 empty
  assert.equal(position.pieceAt(7), Piece.None); // h1 empty
});

test("black king-side castling moves king and rook", () => {
  const position = Position.empty();

  position.putPiece(60, Piece.BlackKing); // e8
  position.putPiece(63, Piece.BlackRook); // h8

  position.castlingRights = CastlingRights.BlackKingSide;

  const move = new Move(60, 62, MoveType.CASTLE); // e8 -> g8

  makeMove(position, move);

  assert.equal(position.pieceAt(62), Piece.BlackKing); // g8
  assert.equal(position.pieceAt(61), Piece.BlackRook); // f8

  assert.equal(position.pieceAt(60), Piece.None); // e8 empty
  assert.equal(position.pieceAt(63), Piece.None); // h8 empty
});

test("white queen-side castling moves king and rook", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(0, Piece.WhiteRook); // a1

  position.castlingRights = CastlingRights.WhiteQueenSide;

  const move = new Move(4, 2, MoveType.CASTLE); // e1 -> c1

  makeMove(position, move);

  assert.equal(position.pieceAt(2), Piece.WhiteKing); // c1
  assert.equal(position.pieceAt(3), Piece.WhiteRook); // d1

  assert.equal(position.pieceAt(4), Piece.None); // e1 empty
  assert.equal(position.pieceAt(0), Piece.None); // a1 empty
});

test("black queen-side castling moves king and rook", () => {
  const position = Position.empty();

  position.putPiece(60, Piece.BlackKing); // e8
  position.putPiece(56, Piece.BlackRook); // a8

  position.castlingRights = CastlingRights.BlackQueenSide;

  const move = new Move(60, 58, MoveType.CASTLE); // e8 -> c8

  makeMove(position, move);

  assert.equal(position.pieceAt(58), Piece.BlackKing); // c8
  assert.equal(position.pieceAt(59), Piece.BlackRook); // d8

  assert.equal(position.pieceAt(60), Piece.None); // e8 empty
  assert.equal(position.pieceAt(56), Piece.None); // a8 empty
});

test("white king-side castling removes all white castling rights", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(7, Piece.WhiteRook); // h1

  position.castlingRights =
    CastlingRights.WhiteKingSide | CastlingRights.WhiteQueenSide;

  const move = new Move(4, 6, MoveType.CASTLE);

  makeMove(position, move);

  assert.equal(position.castlingRights, CastlingRights.None);
});

test("black king-side castling removes all black castling rights", () => {
  const position = Position.empty();

  position.putPiece(60, Piece.BlackKing); // e8
  position.putPiece(63, Piece.BlackRook); // h8

  position.castlingRights =
    CastlingRights.BlackKingSide | CastlingRights.BlackQueenSide;

  position.sideToMove = Color.Black;

  const move = new Move(60, 62, MoveType.CASTLE);

  makeMove(position, move);

  assert.equal(position.castlingRights, CastlingRights.None);
});

test("white queen-side castling removes all white castling rights", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(0, Piece.WhiteRook); // a1

  position.castlingRights =
    CastlingRights.WhiteKingSide | CastlingRights.WhiteQueenSide;

  const move = new Move(4, 2, MoveType.CASTLE);

  makeMove(position, move);

  assert.equal(position.castlingRights, CastlingRights.None);
});

test("black queen-side castling removes all black castling rights", () => {
  const position = Position.empty();

  position.putPiece(60, Piece.BlackKing); // e8
  position.putPiece(56, Piece.BlackRook); // a8

  position.castlingRights =
    CastlingRights.BlackKingSide | CastlingRights.BlackQueenSide;

  position.sideToMove = Color.Black;

  const move = new Move(60, 58, MoveType.CASTLE);

  makeMove(position, move);

  assert.equal(position.castlingRights, CastlingRights.None);
});

test("castling clears the en passant square", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(7, Piece.WhiteRook); // h1

  position.castlingRights =
    CastlingRights.WhiteKingSide | CastlingRights.WhiteQueenSide;

  // Pretend an en passant square was already available.
  position.enPassantSquare = 20;

  const move = new Move(4, 6, MoveType.CASTLE);

  makeMove(position, move);

  assert.equal(position.enPassantSquare, -1);
});

test("promotes a white pawn to a queen", () => {
  const position = Position.empty();

  position.putPiece(54, Piece.WhitePawn); // g7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    54,
    62,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(54), Piece.None);
  assert.equal(position.pieceAt(62), Piece.WhiteQueen);
});

test("promotes a black pawn to a queen", () => {
  const position = Position.empty();

  position.putPiece(12, Piece.BlackPawn); // e2
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.sideToMove = Color.Black;

  const move = new Move(
    12,
    4,
    MoveType.PROMOTION,
    Piece.BlackQueen
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(12), Piece.None);
  assert.equal(position.pieceAt(4), Piece.BlackQueen);
});

test("promotes a white pawn to a knight", () => {
  const position = Position.empty();

  position.putPiece(54, Piece.WhitePawn); // g7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    54,
    62,
    MoveType.PROMOTION,
    Piece.WhiteKnight
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(54), Piece.None);
  assert.equal(position.pieceAt(62), Piece.WhiteKnight);
});

test("promotes a white pawn to a rook", () => {
  const position = Position.empty();

  position.putPiece(54, Piece.WhitePawn); // g7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    54,
    62,
    MoveType.PROMOTION,
    Piece.WhiteRook
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(54), Piece.None);
  assert.equal(position.pieceAt(62), Piece.WhiteRook);
});

test("promotes a white pawn to a bishop", () => {
  const position = Position.empty();

  position.putPiece(54, Piece.WhitePawn); // g7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    54,
    62,
    MoveType.PROMOTION,
    Piece.WhiteBishop
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(54), Piece.None);
  assert.equal(position.pieceAt(62), Piece.WhiteBishop);
});

test("promotes a black pawn to a knight", () => {
  const position = Position.empty();

  position.putPiece(14, Piece.BlackPawn); // g2
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    14,
    6,
    MoveType.PROMOTION,
    Piece.BlackKnight
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(14), Piece.None);
  assert.equal(position.pieceAt(6), Piece.BlackKnight);
});

test("promotes a black pawn to a rook", () => {
  const position = Position.empty();

  position.putPiece(14, Piece.BlackPawn); // g2
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    14,
    6,
    MoveType.PROMOTION,
    Piece.BlackRook
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(14), Piece.None);
  assert.equal(position.pieceAt(6), Piece.BlackRook);
});

test("promotes a black pawn to a bishop", () => {
  const position = Position.empty();

  position.putPiece(14, Piece.BlackPawn); // g2
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    14,
    6,
    MoveType.PROMOTION,
    Piece.BlackBishop
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(14), Piece.None);
  assert.equal(position.pieceAt(6), Piece.BlackBishop);
});

test("promotes a white pawn to a queen after capture", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn); // a7
  position.putPiece(57, Piece.BlackRook); // b8
  position.putPiece(4, Piece.WhiteKing);   // e1
  position.putPiece(60, Piece.BlackKing);  // e8

  const move = new Move(
    48,
    57,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(48), Piece.None);
  assert.equal(position.pieceAt(57), Piece.WhiteQueen);
});

test("promotes a black pawn to a queen after capture", () => {
  const position = Position.empty();

  position.putPiece(9, Piece.BlackPawn);   // b2
  position.putPiece(0, Piece.WhiteRook);   // a1
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    9,
    0,
    MoveType.PROMOTION,
    Piece.BlackQueen
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(9), Piece.None);
  assert.equal(position.pieceAt(0), Piece.BlackQueen);
});

test("promotes a black pawn to a knight after capture", () => {
  const position = Position.empty();

  position.putPiece(9, Piece.BlackPawn);   // b2
  position.putPiece(0, Piece.WhiteRook);   // a1
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    9,
    0,
    MoveType.PROMOTION,
    Piece.BlackKnight
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(9), Piece.None);
  assert.equal(position.pieceAt(0), Piece.BlackKnight);
});

test("promotes a white pawn to a knight after capture", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn);   // a7
  position.putPiece(57, Piece.BlackRook);   // b8
  position.putPiece(4, Piece.WhiteKing);    // e1
  position.putPiece(60, Piece.BlackKing);   // e8

  const move = new Move(
    48,
    57,
    MoveType.PROMOTION,
    Piece.WhiteKnight
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(48), Piece.None);
  assert.equal(position.pieceAt(57), Piece.WhiteKnight);
});

test("promotes a white pawn to a rook after capture", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn);  // a7
  position.putPiece(57, Piece.BlackRook);  // b8
  position.putPiece(4, Piece.WhiteKing);   // e1
  position.putPiece(60, Piece.BlackKing);  // e8

  const move = new Move(
    48,
    57,
    MoveType.PROMOTION,
    Piece.WhiteRook
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(48), Piece.None);
  assert.equal(position.pieceAt(57), Piece.WhiteRook);
});

test("promotes a black pawn to a rook after capture", () => {
  const position = Position.empty();

  position.putPiece(9, Piece.BlackPawn);  // b2
  position.putPiece(0, Piece.WhiteRook);  // a1
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  const move = new Move(
    9,
    0,
    MoveType.PROMOTION,
    Piece.BlackRook
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(9), Piece.None);
  assert.equal(position.pieceAt(0), Piece.BlackRook);
});

test("resets the halfmove clock after promotion", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn); // a7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  position.halfmoveClock = 37;

  const move = new Move(
    48,
    56,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  makeMove(position, move);

  assert.equal(position.pieceAt(56), Piece.WhiteQueen);
  assert.equal(position.halfmoveClock, 0);
});

test("changes side to move after promotion", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn); // a7
  position.putPiece(4, Piece.WhiteKing);  // e1
  position.putPiece(60, Piece.BlackKing); // e8

  assert.equal(position.sideToMove, Color.White);

  const move = new Move(
    48,
    56,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  makeMove(position, move);

  assert.equal(position.sideToMove, Color.Black);
});

test("increments the fullmove number after black promotion", () => {
  const position = Position.empty();

  position.putPiece(9, Piece.BlackPawn);   // b2
  position.putPiece(4, Piece.WhiteKing);   // e1
  position.putPiece(60, Piece.BlackKing);  // e8

  position.sideToMove = Color.Black;
  position.fullmoveNumber = 10;

  const move = new Move(
    9,
    1,
    MoveType.PROMOTION,
    Piece.BlackQueen
  );


  
  makeMove(position, move);

  assert.equal(position.pieceAt(1), Piece.BlackQueen);
  assert.equal(position.fullmoveNumber, 11);
});

test("unmakes a normal move", () => {
  const position = Position.initial();
  const original = position.clone();

  const move = new Move(12, 28); // e2 -> e4

const undoState = makeMove(position, move);
unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmake restores side to move", () => {
  const position = Position.initial();

  const move = new Move(12, 28); // e2 -> e4

  const originalSide = position.sideToMove;

const undoState = makeMove(position, move);
unmakeMove(position, move, undoState);

  assert.equal(position.sideToMove, originalSide);
});

test("unmake restores en passant square", () => {
  const position = Position.initial();

  const move = new Move(12, 28); // e2 -> e4

  const originalEnPassantSquare = position.enPassantSquare;

const undoState = makeMove(position, move);
unmakeMove(position, move, undoState);

  assert.equal(
    position.enPassantSquare,
    originalEnPassantSquare
  );
});

test("unmakes a normal move", () => {
  const position = Position.initial();
  const original = position.clone();

  const move = new Move(12, 28);

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmakes a capture and restores captured piece", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing);   // e1
  position.putPiece(60, Piece.BlackKing);  // e8
  position.putPiece(12, Piece.WhiteRook);  // e2
  position.putPiece(20, Piece.BlackRook);  // e3

  const original = position.clone();

  const move = new Move(12, 20); // e2 -> e3, captures black rook

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmakes an en passant capture and restores the captured pawn", () => {
  const position = Position.empty();

  position.putPiece(36, Piece.WhitePawn); // e5
  position.putPiece(35, Piece.BlackPawn); // d5

  position.sideToMove = Color.White;
  position.enPassantSquare = 43; // d6

  const original = position.clone();

  const move = new Move(36, 43, MoveType.EN_PASSANT);

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmakes a promotion and restores the pawn", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn); // a7
  position.sideToMove = Color.White;

  const original = position.clone();

  const move = new Move(
    48,
    56,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmakes kingside castling and restores king and rook", () => {
  const position = Position.empty();

  position.putPiece(4, Piece.WhiteKing); // e1
  position.putPiece(7, Piece.WhiteRook); // h1

  position.sideToMove = Color.White;
  position.castlingRights = CastlingRights.WhiteKingSide;

  const original = position.clone();

  const move = new Move(4, 6, MoveType.CASTLE); // e1 -> g1

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});

test("unmakes a promotion capture and restores the pawn and captured piece", () => {
  const position = Position.empty();

  position.putPiece(48, Piece.WhitePawn);  // a7
  position.putPiece(57, Piece.BlackRook);  // b8

  position.sideToMove = Color.White;

  const original = position.clone();

  const move = new Move(
    48,
    57,
    MoveType.PROMOTION,
    Piece.WhiteQueen
  );

  const undoState = makeMove(position, move);
  unmakeMove(position, move, undoState);

  assert.equal(position.equals(original), true);
});