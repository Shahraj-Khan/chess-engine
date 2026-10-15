import { COLOR_NAMES } from './chessUtils'
import type { Color, DrawReason, GameSnapshot } from './types'

export type EngineStatus = 'disconnected' | 'connected' | 'thinking'

export type StatusTone = 'neutral' | 'check' | 'over' | 'thinking'

export type StatusIcon = 'turn' | 'check' | 'flag' | 'draw' | 'engine'

export interface GameStatusMessage {
  readonly tone: StatusTone
  readonly icon: StatusIcon
  readonly title: string
  readonly detail: string
}

const DRAW_DETAIL: Record<DrawReason, string> = {
  'insufficient-material': 'Neither side has enough material to deliver checkmate.',
  'threefold-repetition': 'The same position occurred three times.',
  'fifty-move-rule': 'Fifty moves passed without a capture or pawn move.',
  other: 'The game ended in a draw.',
}

interface StatusInput {
  readonly snapshot: GameSnapshot
  readonly engineStatus: EngineStatus
  readonly engineColor: Color | null
}

/** Derives the headline message for the game-status card. Pure and unit-testable. */
export function describeGameStatus({
  snapshot,
  engineStatus,
  engineColor,
}: StatusInput): GameStatusMessage {
  const { result, inCheck, turn } = snapshot
  const side = COLOR_NAMES[turn]

  if (result?.kind === 'checkmate') {
    return {
      tone: 'over',
      icon: 'flag',
      title: 'Checkmate',
      detail: `${COLOR_NAMES[result.winner]} wins the game.`,
    }
  }
  if (result?.kind === 'stalemate') {
    return {
      tone: 'over',
      icon: 'draw',
      title: 'Stalemate',
      detail: `${side} has no legal moves but is not in check. The game is drawn.`,
    }
  }
  if (result?.kind === 'draw') {
    return { tone: 'over', icon: 'draw', title: 'Draw', detail: DRAW_DETAIL[result.reason] }
  }

  if (engineStatus === 'thinking' && engineColor === turn) {
    return {
      tone: 'thinking',
      icon: 'engine',
      title: 'Engine thinking…',
      detail: `NFamily Engine is searching as ${side}.`,
    }
  }
  if (inCheck) {
    return { tone: 'check', icon: 'check', title: 'Check', detail: `${side} is in check and to move.` }
  }
  return {
    tone: 'neutral',
    icon: 'turn',
    title: `${side} to move`,
    detail: snapshot.lastMove ? `Last move: ${snapshot.lastMove.san}` : 'Select a piece to begin.',
  }
}
