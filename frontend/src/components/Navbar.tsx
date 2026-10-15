import type { EngineStatus } from '../game/status'
import { EngineStatusPill } from './EngineStatusPill'
import { Logo } from './Logo'
import { PlusIcon, SlidersIcon } from './icons'
import './Navbar.css'

interface NavbarProps {
  readonly engineStatus: EngineStatus
  readonly onNewGame: () => void
  readonly onOpenSettings: () => void
}

export function Navbar({ engineStatus, onNewGame, onOpenSettings }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="brand">
          <Logo />
          <div className="brand__text">
            <span className="brand__name">NFamily</span>
            <span className="brand__sub">CHESS LAB</span>
          </div>
        </div>

        <nav className="navbar__actions" aria-label="Application">
          <EngineStatusPill status={engineStatus} live />
          <button type="button" className="btn btn--primary navbar__new" onClick={onNewGame}>
            <PlusIcon />
            <span className="navbar__new-label">New Game</span>
          </button>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            <SlidersIcon />
          </button>
        </nav>
      </div>
    </header>
  )
}
