import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Color } from '../game/types'
import type { EngineStatus } from '../game/status'
import type {
  EngineClient,
  EngineConnection,
  EngineSearchInfo,
  EngineSearchResult,
  SearchLimits,
} from './engineClient'

export interface UseEngineOptions {
  readonly client: EngineClient
  /** Current connection snapshot from `useEngineConnection(client)`. */
  readonly connection: EngineConnection
  /** Colour the engine plays. */
  readonly engineColor: Color
  readonly fen: string
  readonly turn: Color
  readonly uciMoves: readonly string[]
  readonly gameOver: boolean
  readonly limits: SearchLimits
  /** Applies the engine's move; must return false if it was rejected (stale or illegal). */
  readonly onBestMove: (uci: string, searchedFen: string) => boolean
}

export interface LastSearch {
  readonly bestMove: string
  readonly info: EngineSearchInfo
  /** Number of plies played when the search was requested. */
  readonly atPly: number
}

export interface EngineState {
  readonly connection: EngineConnection
  /** Derived from the client's real connection state and the in-flight request, never assumed. */
  readonly status: EngineStatus
  readonly lastSearch: LastSearch | null
  readonly error: string | null
  readonly engineColor: Color | null
  /** Clears results and errors, e.g. when a new game starts. */
  reset(): void
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'The engine request failed.'
}

/** Subscribes to the client's real connection state. */
export function useEngineConnection(client: EngineClient): EngineConnection {
  return useSyncExternalStore(client.subscribe, client.getConnection)
}

export function useEngine(options: UseEngineOptions): EngineState {
  const { client, connection, engineColor, fen, turn, gameOver } = options
  const [searching, setSearching] = useState(false)
  const [lastSearch, setLastSearch] = useState<LastSearch | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Latest non-identity-stable inputs, read inside the effect without retriggering it.
  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })

  const connected = connection.state === 'connected'
  const shouldSearch = connected && !gameOver && turn === engineColor

  useEffect(() => {
    if (!shouldSearch) return undefined

    const controller = new AbortController()
    const { uciMoves, limits } = latest.current
    const atPly = uciMoves.length
    setSearching(true)
    setError(null)

    client
      .requestBestMove({ fen, moves: uciMoves, limits }, controller.signal)
      .then((result: EngineSearchResult) => {
        // The position may have changed (undo, new game, flip of sides) while the engine was busy.
        if (controller.signal.aborted) return
        setLastSearch({ bestMove: result.bestMove, info: result.info, atPly })
        const applied = latest.current.onBestMove(result.bestMove, fen)
        if (!applied) {
          setError(`The engine returned a move that is not legal in this position: ${result.bestMove}`)
        }
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(describeError(reason))
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false)
      })

    return () => {
      controller.abort()
      setSearching(false)
    }
  }, [client, fen, shouldSearch])

  const reset = useCallback(() => {
    setLastSearch(null)
    setError(null)
  }, [])

  const status: EngineStatus = !connected ? 'disconnected' : searching ? 'thinking' : 'connected'

  return { connection, status, lastSearch, error, engineColor: connected ? engineColor : null, reset }
}
