export type EngineConnectionState = 'disconnected' | 'connected'

export interface EngineConnection {
  readonly state: EngineConnectionState
  readonly engineName: string | null
  readonly detail: string | null
}

export interface SearchLimits {
  readonly depth: number
  readonly moveTimeMs: number | null
}

export interface EngineSearchRequest {
  readonly fen: string
  readonly moves: readonly string[]
  readonly limits: SearchLimits
}

export type EngineScore =
  | { readonly kind: 'cp'; readonly value: number }
  | { readonly kind: 'mate'; readonly value: number }

export interface EngineSearchInfo {
  readonly depth?: number
  readonly timeMs?: number
  readonly nodes?: number
  readonly nps?: number
  readonly score?: EngineScore
  readonly pv?: readonly string[]
}

export interface EngineSearchResult {
  readonly bestMove: string
  readonly info: EngineSearchInfo
}

export interface EngineClient {
  getConnection(): EngineConnection
  subscribe(listener: () => void): () => void
  requestBestMove(
    request: EngineSearchRequest,
    signal: AbortSignal,
  ): Promise<EngineSearchResult>
}

export class EngineUnavailableError extends Error {
  constructor(message = 'Chess engine is unavailable.') {
    super(message)
    this.name = 'EngineUnavailableError'
  }
}

const API_BASE = '/api/engine'

export function createHttpEngineClient(): EngineClient {
  let connection: EngineConnection = {
    state: 'disconnected',
    engineName: null,
    detail: 'Connecting to NFamily Chess Engine...',
  }

  const listeners = new Set<() => void>()

  function notify() {
    listeners.forEach((listener) => listener())
  }

  function updateConnection(next: EngineConnection) {
    connection = next
    notify()
  }

  async function checkConnection(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/status`)

      if (!response.ok) {
        throw new Error(`Engine status returned HTTP ${response.status}`)
      }

      const data = (await response.json()) as {
        state?: string
        engineName?: string
      }

      if (data.state !== 'connected') {
        throw new Error('The chess engine is not connected.')
      }

      updateConnection({
        state: 'connected',
        engineName: data.engineName ?? 'NFamily Chess Engine',
        detail: null,
      })
    } catch (error) {
      updateConnection({
        state: 'disconnected',
        engineName: null,
        detail:
          error instanceof Error
            ? error.message
            : 'Could not connect to the chess engine.',
      })
    }
  }

  void checkConnection()

  return {
    getConnection: () => connection,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    async requestBestMove(request, signal) {
      if (connection.state !== 'connected') {
        throw new EngineUnavailableError(
          connection.detail ?? 'Chess engine is disconnected.',
        )
      }

      const response = await fetch(`${API_BASE}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fen: request.fen,
          moves: request.moves,
          limits: request.limits,
        }),
        signal,
      })

      const data = (await response.json()) as {
        bestMove?: string
        info?: EngineSearchInfo
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            data.message ??
            `Engine search failed with HTTP ${response.status}`,
        )
      }

      if (
        typeof data.bestMove !== 'string' ||
        !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(data.bestMove)
      ) {
        throw new Error(
          `Engine returned an invalid move: ${data.bestMove ?? 'unknown'}`,
        )
      }

      return {
        bestMove: data.bestMove,
        info: data.info ?? {},
      }
    },
  }
}