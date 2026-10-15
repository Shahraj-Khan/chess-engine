import type { SearchLimits } from './engine/engineClient'

/** Display preferences, persisted in localStorage. */
export interface DisplaySettings {
  readonly showCoordinates: boolean
  readonly showLegalMoves: boolean
  readonly animatePieces: boolean
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showCoordinates: true,
  showLegalMoves: true,
  animatePieces: true,
}

export function isDisplaySettings(value: unknown): value is DisplaySettings {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.showCoordinates === 'boolean' &&
    typeof candidate.showLegalMoves === 'boolean' &&
    typeof candidate.animatePieces === 'boolean'
  )
}

export const MIN_DEPTH = 1
export const MAX_DEPTH = 8

export const DIFFICULTY_NAMES: readonly string[] = [
  'Beginner',
  'Easy',
  'Casual',
  'Club',
  'Advanced',
  'Strong',
  'Expert',
  'Maximum',
]

export const MOVE_TIME_OPTIONS: ReadonlyArray<{ readonly value: number | null; readonly label: string }> = [
  { value: null, label: 'Depth only (no time limit)' },
  { value: 500, label: '0.5 seconds' },
  { value: 1000, label: '1 second' },
  { value: 2000, label: '2 seconds' },
  { value: 5000, label: '5 seconds' },
  { value: 10000, label: '10 seconds' },
]

export const DEFAULT_SEARCH_LIMITS: SearchLimits = { depth: 4, moveTimeMs: null }

export function isSearchLimits(value: unknown): value is SearchLimits {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  const depthOk =
    typeof candidate.depth === 'number' &&
    Number.isInteger(candidate.depth) &&
    candidate.depth >= MIN_DEPTH &&
    candidate.depth <= MAX_DEPTH
  const timeOk =
    candidate.moveTimeMs === null ||
    MOVE_TIME_OPTIONS.some((option) => option.value === candidate.moveTimeMs)
  return depthOk && timeOk
}
