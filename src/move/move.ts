export enum MoveType {
  NORMAL,
  CASTLE,
  EN_PASSANT,
  PROMOTION,
}

export class Move {
  constructor(
    public readonly from: number,
    public readonly to: number,
    public readonly type: MoveType = MoveType.NORMAL,
    public readonly promotionPiece: number = 0
  ) {}
}