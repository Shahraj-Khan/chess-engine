import type { DisplaySettings } from '../settings'
import { Dialog } from './Dialog'

interface SettingsDialogProps {
  readonly open: boolean
  readonly settings: DisplaySettings
  readonly onChange: (settings: DisplaySettings) => void
  readonly onClose: () => void
}

interface SwitchRowProps {
  readonly title: string
  readonly hint: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
}

function SwitchRow({ title, hint, checked, onChange }: SwitchRowProps) {
  return (
    <label className="switch">
      <span className="switch__text">
        <span className="switch__title">{title}</span>
        <span className="switch__hint">{hint}</span>
      </span>
      <input
        className="switch__input"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className="switch__track" aria-hidden="true" />
    </label>
  )
}

export function SettingsDialog({ open, settings, onChange, onClose }: SettingsDialogProps) {
  return (
    <Dialog
      open={open}
      title="Settings"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <SwitchRow
        title="Board coordinates"
        hint="Show ranks and files on the board edge."
        checked={settings.showCoordinates}
        onChange={(showCoordinates) => onChange({ ...settings, showCoordinates })}
      />
      <SwitchRow
        title="Legal-move hints"
        hint="Mark the squares a selected piece can reach."
        checked={settings.showLegalMoves}
        onChange={(showLegalMoves) => onChange({ ...settings, showLegalMoves })}
      />
      <SwitchRow
        title="Piece animation"
        hint="Slide pieces to their new squares. Always off when your system requests reduced motion."
        checked={settings.animatePieces}
        onChange={(animatePieces) => onChange({ ...settings, animatePieces })}
      />
    </Dialog>
  )
}
