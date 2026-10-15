import { useEffect, useRef, useState } from 'react'
import { splitSan } from '../game/chessUtils'
import { pairMoves } from '../game/gameModel'
import type { Move } from '../game/types'
import { cx } from '../lib/cx'
import { CheckIcon, CopyIcon } from './icons'
import { Piece } from './pieces/Piece'
import './MoveHistory.css'

interface MoveHistoryProps {
  readonly history: readonly Move[]
  readonly pgn: string
  /** Material balance in pawns; positive favours White. */
  readonly balance: number
}

type CopyState = 'idle' | 'copied' | 'failed'

function MoveCell({ move, latest }: { readonly move: Move | null; readonly latest: boolean }) {
  if (!move) return <span className="move move--empty" aria-hidden="true" />
  const { piece, rest } = splitSan(move.san)
  return (
    <span className={cx('move', latest && 'move--latest')} aria-current={latest ? 'true' : undefined}>
      {piece ? (
        <span className="move__piece" aria-hidden="true">
          <Piece type={piece} color={move.color} tone="ink" />
        </span>
      ) : null}
      {piece ? <span className="sr-only">{move.san.charAt(0)}</span> : null}
      <span>{piece ? rest : move.san}</span>
    </span>
  )
}

function describeBalance(balance: number): string {
  if (balance === 0) return 'Level'
  return `${balance > 0 ? 'White' : 'Black'} +${Math.abs(balance)}`
}

export function MoveHistory({ history, pgn, balance }: MoveHistoryProps) {
  const pairs = pairMoves(history)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const lastPly = history.length - 1

  useEffect(() => {
    const element = scrollRef.current
    if (element) element.scrollTop = element.scrollHeight
  }, [history.length])

  useEffect(() => {
    if (copyState === 'idle') return undefined
    const timer = window.setTimeout(() => setCopyState('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [copyState])

  const copyPgn = async () => {
    try {
      await navigator.clipboard.writeText(pgn)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section className="panel history" aria-labelledby="history-title">
      <div className="panel__header">
        <h2 className="panel__title" id="history-title">
          Moves
          {history.length > 0 ? <span className="history__count">{history.length}</span> : null}
        </h2>
        <button
          type="button"
          className="btn btn--ghost history__copy"
          onClick={copyPgn}
          disabled={history.length === 0}
          aria-label="Copy game as PGN"
        >
          {copyState === 'copied' ? <CheckIcon /> : <CopyIcon />}
          <span>{copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'PGN'}</span>
        </button>
      </div>

      <div className="history__scroll" ref={scrollRef} tabIndex={0} aria-label="Move list">
        {pairs.length === 0 ? (
          <div className="history__empty">
            <span className="history__empty-icon" aria-hidden="true">
              <Piece type="p" color="w" tone="ink" />
            </span>
            <p className="history__empty-title">No moves yet</p>
            <p className="history__empty-hint">White opens. Pick a piece to see its legal moves.</p>
          </div>
        ) : (
          <ol className="moves">
            {pairs.map((pair) => {
              const whitePly = (pair.number - 1) * 2
              return (
                <li className="moves__row" key={pair.number}>
                  <span className="moves__number">{pair.number}.</span>
                  <MoveCell move={pair.white} latest={whitePly === lastPly} />
                  <MoveCell move={pair.black} latest={whitePly + 1 === lastPly} />
                </li>
              )
            })}
          </ol>
        )}
      </div>

      <div className="history__footer">
        <span>Material</span>
        <span className={cx('history__balance', balance !== 0 && 'is-ahead')}>
          {describeBalance(balance)}
        </span>
      </div>
      <span className="sr-only" role="status">
        {copyState === 'copied' ? 'Game PGN copied to clipboard.' : copyState === 'failed' ? 'Could not copy the PGN.' : ''}
      </span>
    </section>
  )
}
