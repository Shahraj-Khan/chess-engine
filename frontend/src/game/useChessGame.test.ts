import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Square } from './types'
import { useChessGame } from './useChessGame'

function setup(engineEnabled = false) {
  return renderHook(() => useChessGame({ engineEnabled }))
}

function play(result: ReturnType<typeof setup>['result'], from: Square, to: Square) {
  act(() => result.current.selectSquare(from))
  act(() => result.current.selectSquare(to))
}

describe('useChessGame', () => {
  it('shows legal targets for a selected piece', () => {
    const { result } = setup()
    act(() => result.current.selectSquare('e2'))
    expect([...result.current.legalTargets.keys()].sort()).toEqual(['e3', 'e4'])
  })

  it('plays legal moves and rejects illegal ones', () => {
    const { result } = setup()
    play(result, 'e2', 'e4')
    play(result, 'e7', 'e5')
    expect(result.current.snapshot.history).toHaveLength(2)
    play(result, 'g1', 'g5') // not a knight move
    expect(result.current.snapshot.history).toHaveLength(2)
  })

  it('supports undo and restart', () => {
    const { result } = setup()
    play(result, 'e2', 'e4')
    play(result, 'e7', 'e5')
    act(() => void result.current.undo())
    expect(result.current.snapshot.history).toHaveLength(1)
    act(() => result.current.restart())
    expect(result.current.snapshot.history).toHaveLength(0)
  })

  it('detects checkmate', () => {
    const { result } = setup()
    for (const [a, b] of [['f2', 'f3'], ['e7', 'e5'], ['g2', 'g4'], ['d8', 'h4']] as const) play(result, a, b)
    expect(result.current.snapshot.result).not.toBeNull()
    expect(result.current.humanCanMove).toBe(false)
  })

  it('asks for a promotion piece and applies the choice', () => {
    const { result } = setup()
    const moves: ReadonlyArray<readonly [Square, Square]> = [
      ['a2', 'a4'], ['b7', 'b5'], ['a4', 'b5'], ['a7', 'a6'], ['b5', 'a6'], ['c8', 'b7'], ['a6', 'a7'], ['h7', 'h6'],
    ]
    for (const [a, b] of moves) play(result, a, b)
    play(result, 'a7', 'b8')
    expect(result.current.pendingPromotion).not.toBeNull()
    act(() => result.current.choosePromotion('n'))
    expect(result.current.pendingPromotion).toBeNull()
    expect(result.current.snapshot.history.at(-1)?.promotion).toBe('n')
  })

  it('rejects an engine move computed for a different position', () => {
    const { result } = setup(true)
    const staleFen = result.current.snapshot.fen
    play(result, 'e2', 'e4')
    let applied = true
    act(() => {
      applied = result.current.applyUciMove('e7e5', staleFen)
    })
    expect(applied).toBe(false)
    expect(result.current.snapshot.history).toHaveLength(1)
  })

  it('blocks human input on the engine turn only when an engine is connected', () => {
    const local = setup(false)
    play(local.result, 'e2', 'e4')
    expect(local.result.current.humanCanMove).toBe(true)
    const connected = setup(true)
    play(connected.result, 'e2', 'e4')
    expect(connected.result.current.humanCanMove).toBe(false)
  })
})
