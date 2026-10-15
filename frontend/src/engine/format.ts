import type { EngineScore } from './engineClient'

export const EMPTY_VALUE = '—'

export function formatNodes(nodes: number | undefined): string {
  return nodes === undefined ? EMPTY_VALUE : nodes.toLocaleString('en-US')
}

export function formatNps(nps: number | undefined): string {
  if (nps === undefined) return EMPTY_VALUE
  if (nps >= 1_000_000) return `${(nps / 1_000_000).toFixed(2)} M/s`
  if (nps >= 1_000) return `${(nps / 1_000).toFixed(1)} k/s`
  return `${Math.round(nps)} /s`
}

export function formatTime(timeMs: number | undefined): string {
  if (timeMs === undefined) return EMPTY_VALUE
  return timeMs >= 1000 ? `${(timeMs / 1000).toFixed(2)} s` : `${Math.round(timeMs)} ms`
}

export function formatScore(score: EngineScore | undefined): string {
  if (!score) return EMPTY_VALUE
  if (score.kind === 'mate') return `${score.value > 0 ? '+' : '−'}M${Math.abs(score.value)}`
  const pawns = score.value / 100
  const sign = pawns > 0 ? '+' : pawns < 0 ? '−' : ''
  return `${sign}${Math.abs(pawns).toFixed(2)}`
}

export function formatMoveTime(moveTimeMs: number | null): string {
  if (moveTimeMs === null) return 'Depth only'
  return moveTimeMs < 1000 ? `${moveTimeMs} ms` : `${moveTimeMs / 1000} s`
}
