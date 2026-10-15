import type { ReactNode } from 'react'
import { FlipIcon, PlusIcon, RestartIcon, UndoIcon } from './icons'
import './GameControls.css'

interface GameControlsProps {
  readonly canUndo: boolean
  readonly canRestart: boolean
  readonly onUndo: () => void
  readonly onRestart: () => void
  readonly onFlip: () => void
  readonly onNewGame: () => void
}

interface ControlButtonProps {
  readonly label: string
  readonly icon: ReactNode
  readonly disabled?: boolean
  readonly primary?: boolean
  readonly onClick: () => void
}

function ControlButton({ label, icon, disabled, primary, onClick }: ControlButtonProps) {
  return (
    <button
      type="button"
      className={primary ? 'btn btn--primary controls__button' : 'btn controls__button'}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function GameControls({
  canUndo,
  canRestart,
  onUndo,
  onRestart,
  onFlip,
  onNewGame,
}: GameControlsProps) {
  return (
    <div className="controls" role="toolbar" aria-label="Game controls">
      <ControlButton label="Undo" icon={<UndoIcon />} disabled={!canUndo} onClick={onUndo} />
      <ControlButton
        label="Restart"
        icon={<RestartIcon />}
        disabled={!canRestart}
        onClick={onRestart}
      />
      <ControlButton label="Flip" icon={<FlipIcon />} onClick={onFlip} />
      <ControlButton label="New game" icon={<PlusIcon />} primary onClick={onNewGame} />
    </div>
  )
}
