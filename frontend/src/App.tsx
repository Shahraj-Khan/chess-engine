import { useCallback, useMemo, useState } from 'react'
import { ChessBoard } from './components/board/ChessBoard'
import { GameOverBanner } from './components/board/GameOverBanner'
import { PromotionPicker } from './components/board/PromotionPicker'
import { ConfirmDialog } from './components/ConfirmDialog'
import { EnginePanel } from './components/EnginePanel'
import { Footer } from './components/Footer'
import { GameControls } from './components/GameControls'
import { GameStatus } from './components/GameStatus'
import { Hero } from './components/Hero'
import { MatchSetup } from './components/MatchSetup'
import { MoveHistory } from './components/MoveHistory'
import { Navbar } from './components/Navbar'
import { PieceDefs } from './components/pieces/Piece'
import { PlayerCard } from './components/PlayerCard'
import type { PlayerBadge } from './components/PlayerCard'
import { SettingsDialog } from './components/SettingsDialog'
import { createHttpEngineClient } from './engine/engineClient'
import type { EngineClient } from './engine/engineClient'
import { useEngine, useEngineConnection } from './engine/useEngine'
import { COLOR_NAMES, moveToUci, opposite } from './game/chessUtils'
import { summariseMaterial } from './game/gameModel'
import { describeGameStatus } from './game/status'
import type { EngineStatus } from './game/status'
import type { Color } from './game/types'
import { useChessGame } from './game/useChessGame'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import {
  DEFAULT_DISPLAY_SETTINGS,
  DEFAULT_SEARCH_LIMITS,
  isDisplaySettings,
  isSearchLimits,
} from './settings'
import './App.css'

interface AppProps {
  /** Engine bridge. Defaults to a client that honestly reports "disconnected". */
  readonly engineClient?: EngineClient
}

const DEFAULT_ENGINE_CLIENT = createHttpEngineClient()

const ENGINE_BADGES: Record<EngineStatus, PlayerBadge> = {
  disconnected: { label: 'Not connected', tone: 'muted' },
  connected: { label: 'Connected', tone: 'ok' },
  thinking: { label: 'Thinking', tone: 'busy' },
}

export default function App({ engineClient = DEFAULT_ENGINE_CLIENT }: AppProps) {
  const connection = useEngineConnection(engineClient)
  const game = useChessGame({ engineEnabled: connection.state === 'connected' })
  const { snapshot } = game

  const [display, setDisplay] = useLocalStorageState(
    'nfamily-chess-lab.display',
    DEFAULT_DISPLAY_SETTINGS,
    isDisplaySettings,
  )
  const [limits, setLimits] = useLocalStorageState(
    'nfamily-chess-lab.search-limits',
    DEFAULT_SEARCH_LIMITS,
    isSearchLimits,
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmNewGame, setConfirmNewGame] = useState(false)
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(null)

  const uciMoves = useMemo(() => snapshot.history.map(moveToUci), [snapshot.history])
  const engineSide = opposite(game.playerColor)

  const engine = useEngine({
    client: engineClient,
    connection,
    engineColor: engineSide,
    fen: snapshot.fen,
    turn: snapshot.turn,
    uciMoves,
    gameOver: snapshot.result !== null,
    limits,
    onBestMove: game.applyUciMove,
  })

  const material = useMemo(
    () => summariseMaterial(snapshot.board, snapshot.history),
    [snapshot.board, snapshot.history],
  )

  const status = describeGameStatus({
    snapshot,
    engineStatus: engine.status,
    engineColor: game.engineColor,
  })

  const engineLine =
    engine.status === 'disconnected'
      ? 'Engine disconnected. Local play: you control both sides.'
      : engine.status === 'thinking'
        ? `${connection.engineName ?? 'Engine'} is searching.`
        : `${connection.engineName ?? 'Engine'} connected, playing ${COLOR_NAMES[engineSide]}.`

  const bannerKey = `${game.gameId}:${snapshot.history.length}`
  const showBanner = snapshot.result !== null && dismissedBanner !== bannerKey

  const resetEngineView = engine.reset
  const startNewGame = useCallback(() => {
    game.newGame()
    resetEngineView()
    setConfirmNewGame(false)
  }, [game, resetEngineView])

  const requestNewGame = () => {
    // Only ask before discarding a game that is still in progress.
    if (snapshot.history.length > 0 && snapshot.result === null) setConfirmNewGame(true)
    else startNewGame()
  }

  const restart = () => {
    game.restart()
    resetEngineView()
  }

  const undo = () => {
    // With a live engine, take back its reply as well so it is the person's turn again.
    const plies = game.engineColor !== null && snapshot.turn !== game.engineColor ? 2 : 1
    game.undo(Math.min(plies, snapshot.history.length))
  }

  const changePlayerColor = (color: Color) => {
    game.setPlayerColor(color)
  }

  const bottomColor = game.orientation
  const topColor = opposite(bottomColor)

  const renderPlayer = (color: Color) => {
    const isEngine = color === engineSide
    const captured = color === 'w' ? material.capturedByWhite : material.capturedByBlack
    const advantage = color === 'w' ? Math.max(0, material.balance) : Math.max(0, -material.balance)
    return (
      <PlayerCard
        name={isEngine ? 'NFamily Engine' : 'You'}
        kind={isEngine ? 'engine' : 'human'}
        color={color}
        active={snapshot.turn === color}
        gameOver={snapshot.result !== null}
        rating="Unrated"
        captured={captured}
        advantage={advantage}
        {...(isEngine ? { badge: ENGINE_BADGES[engine.status] } : {})}
      />
    )
  }

  return (
    <div className="app">
      <PieceDefs />
      <Navbar
        engineStatus={engine.status}
        onNewGame={requestNewGame}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="app__main">
        <Hero />

        <div className="layout">
          <section className="stage enter" style={{ '--i': 1 } as React.CSSProperties} aria-label="Chess game">
            {renderPlayer(topColor)}
            <ChessBoard
              board={snapshot.board}
              orientation={game.orientation}
              turn={snapshot.turn}
              selected={game.selected}
              legalTargets={game.legalTargets}
              lastMove={snapshot.lastMove}
              checkSquare={snapshot.checkSquare}
              animation={game.animation}
              interactive={game.humanCanMove}
              showCoordinates={display.showCoordinates}
              showLegalMoves={display.showLegalMoves}
              animatePieces={display.animatePieces}
              modalOpen={game.pendingPromotion !== null}
              onSelectSquare={game.selectSquare}
              onEscape={game.clearSelection}
            >
              {game.pendingPromotion ? (
                <PromotionPicker
                  color={game.pendingPromotion.color}
                  onSelect={game.choosePromotion}
                  onCancel={game.cancelPromotion}
                />
              ) : null}
              {showBanner ? (
                <GameOverBanner
                  message={status}
                  onNewGame={startNewGame}
                  onDismiss={() => setDismissedBanner(bannerKey)}
                />
              ) : null}
            </ChessBoard>
            {renderPlayer(bottomColor)}
            <GameControls
              canUndo={snapshot.history.length > 0}
              canRestart={snapshot.history.length > 0}
              onUndo={undo}
              onRestart={restart}
              onFlip={game.flip}
              onNewGame={requestNewGame}
            />
          </section>

          <div className="rail rail--left">
            <div className="slot slot--status enter" style={{ '--i': 2 } as React.CSSProperties}>
              <GameStatus message={status} engineLine={engineLine} />
            </div>
            <div className="slot slot--setup enter" style={{ '--i': 4 } as React.CSSProperties}>
              <MatchSetup
                playerColor={game.playerColor}
                limits={limits}
                engineConnected={connection.state === 'connected'}
                onPlayerColorChange={changePlayerColor}
                onLimitsChange={setLimits}
              />
            </div>
          </div>

          <div className="rail rail--right">
            <div className="slot slot--history enter" style={{ '--i': 3 } as React.CSSProperties}>
              <MoveHistory history={snapshot.history} pgn={snapshot.pgn} balance={material.balance} />
            </div>
            <div className="slot slot--engine enter" style={{ '--i': 4 } as React.CSSProperties}>
              <EnginePanel
                status={engine.status}
                connection={connection}
                lastSearch={engine.lastSearch}
                error={engine.error}
                limits={limits}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <SettingsDialog
        open={settingsOpen}
        settings={display}
        onChange={setDisplay}
        onClose={() => setSettingsOpen(false)}
      />
      <ConfirmDialog
        open={confirmNewGame}
        title="Start a new game?"
        message="The game in progress will be discarded. This can't be undone."
        confirmLabel="Start new game"
        onConfirm={startNewGame}
        onCancel={() => setConfirmNewGame(false)}
      />
    </div>
  )
}
