import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import type {
  EngineClient,
  EngineConnection,
  EngineSearchRequest,
  EngineSearchResult,
} from './engine/engineClient'

const CONNECTED: EngineConnection = { state: 'connected', engineName: 'Test Engine', detail: null }

function fakeClient() {
  const pending: Array<{
    request: EngineSearchRequest
    signal: AbortSignal
    resolve: (r: EngineSearchResult) => void
  }> = []
  const client: EngineClient = {
    getConnection: () => CONNECTED,
    subscribe: () => () => undefined,
    requestBestMove: (request, signal) =>
      new Promise((resolve) => pending.push({ request, signal, resolve })),
  }
  return { client, pending }
}

const square = (s: string) => document.querySelector<HTMLElement>(`[data-square="${s}"]`)!

describe('App', () => {
  it('reports the engine as disconnected by default and invents no statistics', () => {
    render(<App />)
    expect(screen.getAllByText(/not connected|disconnected/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/nodes\/s|nps/i)).toBeNull()
  })

  it('lets a person play both sides locally and lists the moves', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(square('e2'))
    await user.click(square('e4'))
    await user.click(square('e7'))
    await user.click(square('e5'))
    expect(document.querySelector('.history')?.textContent).toContain('e4')
    expect(document.querySelector('.history')?.textContent).toContain('e5')
  })

  it('applies the engine reply and aborts a stale search on undo', async () => {
    const user = userEvent.setup()
    const { client, pending } = fakeClient()
    render(<App engineClient={client} />)
    await user.click(square('e2'))
    await user.click(square('e4'))
    await waitFor(() => expect(pending).toHaveLength(1))
    expect(pending[0]!.request.moves).toEqual(['e2e4'])

    await act(async () => {
      pending[0]!.resolve({ bestMove: 'e7e5', info: { depth: 3 } })
    })
    await waitFor(() => expect(document.querySelector('.history')?.textContent).toContain('e5'))

    // Engine now searches nothing (human's turn); play, then undo while it is thinking.
    await user.click(square('g1'))
    await user.click(square('f3'))
    await waitFor(() => expect(pending).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: /undo/i }))
    expect(pending[1]!.signal.aborted).toBe(true)
  })
})
