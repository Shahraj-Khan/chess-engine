import { Position } from "../core/position.js";
import { Color } from "../core/color.js";
import { Piece, PieceType, pieceColor, pieceType } from "../core/piece.js";
import { Move } from "./move.js";
import { makeMove } from "./make-move.js";
import { CastlingRights } from "../core/castling.js";
import { MoveType } from "./move.js";



export class MoveGenerator {
  public static generate(position: Position): Move[] {
    const moves: Move[] = [];

    for (let square = 0; square < 64; square++) {
      const piece = position.pieceAt(square);

      if (piece === Piece.None) {
        continue;
      }

      if (pieceColor(piece) !== position.sideToMove) {
        continue;
      }

if (pieceType(piece) === PieceType.Pawn) {
  this.generatePawnMoves(position, square, moves);
} else if (pieceType(piece) === PieceType.Knight) {
  this.generateKnightMoves(position, square, moves);
} else if (pieceType(piece) === PieceType.Bishop) {
  this.generateBishopMoves(position, square, moves);
}else if (pieceType(piece) === PieceType.Rook) {
  this.generateRookMoves(position, square, moves);
}else if (pieceType(piece) === PieceType.Queen) {
  this.generateQueenMoves(position, square, moves);
}else if (pieceType(piece) === PieceType.King) {
  this.generateKingMoves(position, square, moves);
}
    }

    return moves;
  }

private static generatePawnMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  const direction = position.sideToMove === Color.White ? 8 : -8;
  const startRank = position.sideToMove === Color.White ? 1 : 6;

  const oneStep = square + direction;

  const addPromotionMoves = (from: number, to: number) => {
  moves.push(
    new Move(from, to, MoveType.PROMOTION, PieceType.Queen),
    new Move(from, to, MoveType.PROMOTION, PieceType.Rook),
    new Move(from, to, MoveType.PROMOTION, PieceType.Bishop),
    new Move(from, to, MoveType.PROMOTION, PieceType.Knight)
  );
};

  // One-square move
  if (
    oneStep >= 0 &&
    oneStep < 64 &&
    position.isEmpty(oneStep)
  ) {
  const oneStepRank = Math.floor(oneStep / 8);

  if (oneStepRank === 0 || oneStepRank === 7) {
    addPromotionMoves(square, oneStep);
  } else {
    moves.push(new Move(square, oneStep));
  }

    // Two-square move from starting rank
    const rank = Math.floor(square / 8);

    if (rank === startRank) {
      const twoSteps = square + direction * 2;

      if (position.isEmpty(twoSteps)) {
        moves.push(new Move(square, twoSteps));
      }
    }
  }

  // Pawn captures
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const captureRank =
    position.sideToMove === Color.White ? rank + 1 : rank - 1;

  if (captureRank >= 0 && captureRank <= 7) {

    // Capture to the left
    if (file > 0) {
      const targetSquare = captureRank * 8 + (file - 1);
      const targetPiece = position.pieceAt(targetSquare);

if (
  targetPiece !== Piece.None &&
  pieceColor(targetPiece) !== position.sideToMove
) {
  if (captureRank === 0 || captureRank === 7) {
    addPromotionMoves(square, targetSquare);
  } else {
    moves.push(new Move(square, targetSquare));
  }
}

      if (position.enPassantSquare === targetSquare) {
        moves.push(
          new Move(square, targetSquare, MoveType.EN_PASSANT)
        );
      }
    }

    // Capture to the right
    if (file < 7) {
      const targetSquare = captureRank * 8 + (file + 1);
      const targetPiece = position.pieceAt(targetSquare);

if (
  targetPiece !== Piece.None &&
  pieceColor(targetPiece) !== position.sideToMove
) {
  if (captureRank === 0 || captureRank === 7) {
    addPromotionMoves(square, targetSquare);
  } else {
    moves.push(new Move(square, targetSquare));
  }
}

      if (position.enPassantSquare === targetSquare) {
        moves.push(
          new Move(square, targetSquare, MoveType.EN_PASSANT)
        );
      }
    }
  }
}
  private static generateKnightMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const offsets = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ];

  for (const [fileOffset, rankOffset] of offsets) {
    const targetFile = file + fileOffset;
    const targetRank = rank + rankOffset;

    if (
      targetFile < 0 ||
      targetFile > 7 ||
      targetRank < 0 ||
      targetRank > 7
    ) {
      continue;
    }

    const targetSquare = targetRank * 8 + targetFile;
    const targetPiece = position.pieceAt(targetSquare);

    if (
      targetPiece === Piece.None ||
      pieceColor(targetPiece) !== position.sideToMove
    ) {
      moves.push(new Move(square, targetSquare));
    }
  }
}

private static generateBishopMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const directions = [
    [1, 1],   // up-right
    [-1, 1],  // up-left
    [1, -1],  // down-right
    [-1, -1], // down-left
  ];

  for (const [fileDirection, rankDirection] of directions) {
    let targetFile = file + fileDirection;
    let targetRank = rank + rankDirection;

    while (
      targetFile >= 0 &&
      targetFile <= 7 &&
      targetRank >= 0 &&
      targetRank <= 7
    ) {
      const targetSquare = targetRank * 8 + targetFile;
      const targetPiece = position.pieceAt(targetSquare);

      if (targetPiece === Piece.None) {
        moves.push(new Move(square, targetSquare));
      } else {
        if (pieceColor(targetPiece) !== position.sideToMove) {
          moves.push(new Move(square, targetSquare));
        }

        break;
      }

      targetFile += fileDirection;
      targetRank += rankDirection;
    }
  }
}


private static generateRookMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const directions = [
    [1, 0],   // right
    [-1, 0],  // left
    [0, 1],   // up
    [0, -1],  // down
  ];

  for (const [fileDirection, rankDirection] of directions) {
    let targetFile = file + fileDirection;
    let targetRank = rank + rankDirection;

    while (
      targetFile >= 0 &&
      targetFile <= 7 &&
      targetRank >= 0 &&
      targetRank <= 7
    ) {
      const targetSquare = targetRank * 8 + targetFile;
      const targetPiece = position.pieceAt(targetSquare);

      if (targetPiece === Piece.None) {
        moves.push(new Move(square, targetSquare));
      } else {
        if (pieceColor(targetPiece) !== position.sideToMove) {
          moves.push(new Move(square, targetSquare));
        }

        break;
      }

      targetFile += fileDirection;
      targetRank += rankDirection;
    }
  }
}

private static generateQueenMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  this.generateBishopMoves(position, square, moves);
  this.generateRookMoves(position, square, moves);
}

private static generateKingMoves(
  position: Position,
  square: number,
  moves: Move[],
): void {
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const directions = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];

  for (const [fileDirection, rankDirection] of directions) {
    const targetFile = file + fileDirection;
    const targetRank = rank + rankDirection;

    if (
      targetFile < 0 ||
      targetFile > 7 ||
      targetRank < 0 ||
      targetRank > 7
    ) {
      continue;
    }

    const targetSquare = targetRank * 8 + targetFile;
    const targetPiece = position.pieceAt(targetSquare);

    if (targetPiece === Piece.None) {
      moves.push(new Move(square, targetSquare));
    } else if (pieceColor(targetPiece) !== position.sideToMove) {
      moves.push(new Move(square, targetSquare));
    }
  }

  // White king-side castling
if (
  position.sideToMove === Color.White &&
  (position.castlingRights & CastlingRights.WhiteKingSide) !== 0 &&
  position.isEmpty(5) &&
  position.isEmpty(6) &&
  !this.isSquareAttacked(position, 4, Color.Black) &&
  !this.isSquareAttacked(position, 5, Color.Black) &&
  !this.isSquareAttacked(position, 6, Color.Black)
) {
  moves.push(new Move(4, 6, MoveType.CASTLE));
}

if (
  position.sideToMove === Color.White &&
  (position.castlingRights & CastlingRights.WhiteQueenSide) !== 0 &&
  position.isEmpty(1) &&
  position.isEmpty(2) &&
  position.isEmpty(3) &&
  !this.isSquareAttacked(position, 4, Color.Black) &&
  !this.isSquareAttacked(position, 3, Color.Black) &&
  !this.isSquareAttacked(position, 2, Color.Black)
) {
  moves.push(new Move(4, 2, MoveType.CASTLE));
}

if (
  position.sideToMove === Color.Black &&
  (position.castlingRights & CastlingRights.BlackKingSide) !== 0 &&
  position.isEmpty(61) &&
  position.isEmpty(62) &&
  !this.isSquareAttacked(position, 60, Color.White) &&
  !this.isSquareAttacked(position, 61, Color.White) &&
  !this.isSquareAttacked(position, 62, Color.White)
) {
  moves.push(new Move(60, 62, MoveType.CASTLE));
}

if (
  position.sideToMove === Color.Black &&
  (position.castlingRights & CastlingRights.BlackQueenSide) !== 0 &&
  position.isEmpty(57) &&
  position.isEmpty(58) &&
  position.isEmpty(59) &&
  !this.isSquareAttacked(position, 60, Color.White) &&
  !this.isSquareAttacked(position, 59, Color.White) &&
  !this.isSquareAttacked(position, 58, Color.White)
) {
  moves.push(new Move(60, 58, MoveType.CASTLE));
}

}

public static isSquareAttacked(
  position: Position,
  square: number,
  byColor: Color,
): boolean {
  const file = square % 8;
  const rank = Math.floor(square / 8);

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

for (const [fileDirection, rankDirection] of directions) {
    let targetFile = file + fileDirection;
    let targetRank = rank + rankDirection;

    while (
      targetFile >= 0 &&
      targetFile <= 7 &&
      targetRank >= 0 &&
      targetRank <= 7
    ) {
      const targetSquare = targetRank * 8 + targetFile;
      const targetPiece = position.pieceAt(targetSquare);

      if (targetPiece === Piece.None) {
        targetFile += fileDirection;
        targetRank += rankDirection;
        continue;
      }

if (
  pieceColor(targetPiece) === byColor &&
  (pieceType(targetPiece) === PieceType.Rook ||
    pieceType(targetPiece) === PieceType.Queen)
) {
        return true;
      }

      break;
    }
  }

  const bishopDirections = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
];

for (const [fileDirection, rankDirection] of bishopDirections) {
  let targetFile = file + fileDirection;
  let targetRank = rank + rankDirection;

  while (
    targetFile >= 0 &&
    targetFile <= 7 &&
    targetRank >= 0 &&
    targetRank <= 7
  ) {
    const targetSquare = targetRank * 8 + targetFile;
    const targetPiece = position.pieceAt(targetSquare);

    if (targetPiece === Piece.None) {
      targetFile += fileDirection;
      targetRank += rankDirection;
      continue;
    }

if (
  pieceColor(targetPiece) === byColor &&
  (pieceType(targetPiece) === PieceType.Bishop ||
    pieceType(targetPiece) === PieceType.Queen)
) {
      return true;
    }

    break;
  }
}

const kingOffsets = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

for (const [fileOffset, rankOffset] of kingOffsets) {
  const targetFile = file + fileOffset;
  const targetRank = rank + rankOffset;

  if (
    targetFile < 0 ||
    targetFile > 7 ||
    targetRank < 0 ||
    targetRank > 7
  ) {
    continue;
  }

  const targetSquare = targetRank * 8 + targetFile;
  const targetPiece = position.pieceAt(targetSquare);

  if (
    targetPiece !== Piece.None &&
    pieceColor(targetPiece) === byColor &&
    pieceType(targetPiece) === PieceType.King
  ) {
    return true;
  }
}

const knightOffsets = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];


const pawnDirection = byColor === Color.White ? -1 : 1;

for (const fileOffset of [-1, 1]) {
  const targetFile = file + fileOffset;
  const targetRank = rank + pawnDirection;

  if (
    targetFile < 0 ||
    targetFile > 7 ||
    targetRank < 0 ||
    targetRank > 7
  ) {
    continue;
  }

  const targetSquare = targetRank * 8 + targetFile;
  const targetPiece = position.pieceAt(targetSquare);

  if (
    targetPiece !== Piece.None &&
    pieceColor(targetPiece) === byColor &&
    pieceType(targetPiece) === PieceType.Pawn
  ) {
    return true;
  }
}

for (const [fileOffset, rankOffset] of knightOffsets) {
  const targetFile = file + fileOffset;
  const targetRank = rank + rankOffset;

  if (
    targetFile < 0 ||
    targetFile > 7 ||
    targetRank < 0 ||
    targetRank > 7
  ) {
    continue;
  }

  const targetSquare = targetRank * 8 + targetFile;
  const targetPiece = position.pieceAt(targetSquare);

  if (
    targetPiece !== Piece.None &&
    pieceColor(targetPiece) === byColor &&
    pieceType(targetPiece) === PieceType.Knight
  ) {
    return true;
  }
}

  return false;

}

public static isKingInCheck(
  position: Position,
  color: Color,
): boolean {
  let kingSquare = -1;

  for (let square = 0; square < 64; square++) {
    const piece = position.pieceAt(square);

    if (
      piece !== Piece.None &&
      pieceColor(piece) === color &&
      pieceType(piece) === PieceType.King
    ) {
      kingSquare = square;
      break;
    }
  }

  if (kingSquare === -1) {
    return false;
  }

  return this.isSquareAttacked(
    position,
    kingSquare,
    color === Color.White ? Color.Black : Color.White,
  );
}

public static isCheckmate(position: Position): boolean {
  return (
    this.isKingInCheck(position, position.sideToMove) &&
    this.generateLegalMoves(position).length === 0
  );
}

public static isStalemate(position: Position): boolean {
  return (
    !this.isKingInCheck(position, position.sideToMove) &&
    this.generateLegalMoves(position).length === 0
  );
}

public static generateLegalMoves(position: Position): Move[] {
  const pseudoLegalMoves = this.generate(position);
  const legalMoves: Move[] = [];

  for (const move of pseudoLegalMoves) {
    const nextPosition = position.clone();

    makeMove(nextPosition, move);

    if (!this.isKingInCheck(nextPosition, position.sideToMove)) {
      legalMoves.push(move);
    }
  }

  return legalMoves;
}

}
