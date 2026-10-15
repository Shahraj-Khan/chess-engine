import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { SearchLimits } from '../engine/engineClient'
import type { Color } from '../game/types'
import { DIFFICULTY_NAMES, MAX_DEPTH, MIN_DEPTH, MOVE_TIME_OPTIONS } from '../settings'
import { Piece } from './pieces/Piece'
import './MatchSetup.css'

interface MatchSetupProps {
  readonly playerColor: Color
  readonly limits: SearchLimits
  readonly engineConnected: boolean
  readonly onPlayerColorChange: (color: Color) => void
  readonly onLimitsChange: (limits: SearchLimits) => void
}

const SIDE_OPTIONS: ReadonlyArray<{ readonly color: Color; readonly label: string }> = [
  { color: 'w', label: 'White' },
  { color: 'b', label: 'Black' },
]

export function MatchSetup({
  playerColor,
  limits,
  engineConnected,
  onPlayerColorChange,
  onLimitsChange,
}: MatchSetupProps) {
  const id = useId()
  const sideName = `${id}-side`
  const depthId = `${id}-depth`
  const timeId = `${id}-time`
  const difficulty = DIFFICULTY_NAMES[limits.depth - MIN_DEPTH] ?? ''
  const fill = ((limits.depth - MIN_DEPTH) / (MAX_DEPTH - MIN_DEPTH)) * 100

  return (
    <section className="panel setup" aria-labelledby={`${id}-title`}>
      <div className="panel__header">
        <h2 className="panel__title" id={`${id}-title`}>
          Match setup
        </h2>
      </div>

      <div className="setup__body">
        <fieldset className="field setup__fieldset">
          <legend className="field__label">Play as</legend>
          <div className="segmented">
            {SIDE_OPTIONS.map(({ color, label }) => (
              <label className="segmented__option" key={color}>
                <input
                  type="radio"
                  name={sideName}
                  value={color}
                  checked={playerColor === color}
                  onChange={() => onPlayerColorChange(color)}
                />
                <span className="segmented__label">
                  <span className="setup__side-icon" aria-hidden="true">
                    <Piece type="k" color={color} tone="ink" />
                  </span>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <div className="field__row">
            <label className="field__label" htmlFor={depthId}>
              Difficulty
            </label>
            <span className="field__value">
              {difficulty} · depth {limits.depth}
            </span>
          </div>
          <input
            id={depthId}
            className="range"
            type="range"
            min={MIN_DEPTH}
            max={MAX_DEPTH}
            step={1}
            value={limits.depth}
            style={{ '--fill': `${fill}%` } as CSSProperties}
            aria-valuetext={`${difficulty}, search depth ${limits.depth}`}
            onChange={(event) =>
              onLimitsChange({ ...limits, depth: Number(event.currentTarget.value) })
            }
          />
        </div>

        <div className="field">
          <label className="field__label" htmlFor={timeId}>
            Move time
          </label>
          <select
            id={timeId}
            className="select"
            value={limits.moveTimeMs === null ? '' : String(limits.moveTimeMs)}
            onChange={(event) => {
              const value = event.currentTarget.value
              onLimitsChange({ ...limits, moveTimeMs: value === '' ? null : Number(value) })
            }}
          >
            {MOVE_TIME_OPTIONS.map((option) => (
              <option key={option.label} value={option.value === null ? '' : String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="setup__note">
          {engineConnected
            ? 'Difficulty and move time are sent with every engine search.'
            : 'Difficulty and move time apply once an engine is connected. Until then, both sides are played locally.'}
        </p>
      </div>
    </section>
  )
}
