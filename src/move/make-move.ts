import { Color } from "../core/color.js";
import { Piece, pieceType, PieceType } from "../core/piece.js";
import { Move, MoveType } from "./move.js";
import { Position } from "../core/position.js";
import { CastlingRights } from "../core/castling.js";

export function makeMove(position: Position, move: Move): void {
  const movingColor = position.sideToMove;
  const movingPiece = position.pieceAt(move.from);

if (move.type === MoveType.EN_PASSANT) {
  const capturedPawnSquare =
    movingColor === Color.White ? move.to - 8 : move.to + 8;

  position.removePiece(capturedPawnSquare);
}

  const capturedPiece = position.movePiece(move.from, move.to);

  if (move.type === MoveType.PROMOTION) {
  position.removePiece(move.to);
  position.putPiece(move.to, move.promotionPiece as Piece);
}

if (move.type === MoveType.CASTLE) {
  if (move.to === 6) {
    // White king-side: h1 -> f1
    position.movePiece(7, 5);
  } else if (move.to === 62) {
    // Black king-side: h8 -> f8
    position.movePiece(63, 61);
  } else if (move.to === 2) {
    // White queen-side: a1 -> d1
    position.movePiece(0, 3);
  } else if (move.to === 58) {
    // Black queen-side: a8 -> d8
    position.movePiece(56, 59);
  }
}

  if (move.to === 7) {
  position.castlingRights &= ~CastlingRights.WhiteKingSide;
} else if (move.to === 0) {
  position.castlingRights &= ~CastlingRights.WhiteQueenSide;
} else if (move.to === 63) {
  position.castlingRights &= ~CastlingRights.BlackKingSide;
} else if (move.to === 56) {
  position.castlingRights &= ~CastlingRights.BlackQueenSide;
}

   const movingPieceType = pieceType(movingPiece);

if (
  movingPieceType === PieceType.Pawn &&
  Math.abs(move.to - move.from) === 16
) {
  position.enPassantSquare = (move.from + move.to) / 2;
} else {
  position.enPassantSquare = -1;
}

if (movingPieceType === PieceType.King) {
  if (movingColor === Color.White) {
    position.castlingRights &=
      ~(CastlingRights.WhiteKingSide | CastlingRights.WhiteQueenSide);
  } else {
    position.castlingRights &=
      ~(CastlingRights.BlackKingSide | CastlingRights.BlackQueenSide);
  }
}

if (movingPieceType === PieceType.Rook) {
  if (move.from === 7) {
    position.castlingRights &= ~CastlingRights.WhiteKingSide;
  } else if (move.from === 0) {
    position.castlingRights &= ~CastlingRights.WhiteQueenSide;
  } else if (move.from === 63) {
    position.castlingRights &= ~CastlingRights.BlackKingSide;
  } else if (move.from === 56) {
    position.castlingRights &= ~CastlingRights.BlackQueenSide;
  }
}

  position.sideToMove =
    movingColor === Color.White ? Color.Black : Color.White;

  if (movingColor === Color.Black) {
    position.fullmoveNumber += 1;
  }

  if (
    pieceType(movingPiece) === PieceType.Pawn ||
    capturedPiece !== Piece.None
  ) {
    position.halfmoveClock = 0;
  } else {
    position.halfmoveClock += 1;
  }
}