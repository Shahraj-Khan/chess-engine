import { Chess } from 'chess.js'
import { useCallback, useMemo, useRef, useState } from 'react'
import { opposite, parseUci, pieceAt } from './chessUtils'
import { animationFor, groupMovesByTarget, readSnapshot } from './gameModel'
import type {
  Color,
  GameSnapshot,
  Move,
  MoveAnimation,
  PendingPromotion,
  PromotionPiece,
  Square,
} from './types'

export interface UseChessGameOptions {
  /**
   * True only while a real engine connection exists. The engine then plays the side opposite
   * the player, and human input is blocked on its turn. Otherwise both sides are local.
   */
  readonly engineEnabled: boolean
}

export interface ChessGame {
  readonly snapshot: GameSnapshot
  readonly selected: Square | null
  readonly legalTargets: ReadonlyMap<Square, readonly Move[]>
  readonly pendingPromotion: PendingPromotion | null
  readonly animation: MoveAnimation | null
  readonly orientation: Color
  readonly playerColor: Color
  /** Colour the engine controls right now, or null when playing locally. */
  readonly engineColor: Color | null
  /** Changes whenever a new game starts; useful for resetting dependent UI. */
  readonly gameId: number
  /** True when the side to move may be controlled by the person at the board. */
  readonly humanCanMove: boolean
  selectSquare(square: Square): void
  clearSelection(): void
  choosePromotion(piece: PromotionPiece): void
  cancelPromotion(): void
  undo(plies?: number): boolean
  restart(): void
  newGame(color?: Color): void
  flip(): void
  setPlayerColor(color: Color): void
  /** Applies a move received from an engine, but only if the position is still the one it searched. */
  applyUciMove(uci: string, expectedFen: string): boolean
}

const NO_TARGETS: ReadonlyMap<Square, readonly Move[]> = new Map()

export function useChessGame({ engineEnabled }: UseChessGameOptions): ChessGame {
  const [chess] = useState(() => new Chess())
  const [snapshot, setSnapshot] = useState<GameSnapshot>(() => readSnapshot(chess))
  const [selected, setSelected] = useState<Square | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null)
  const [animation, setAnimation] = useState<MoveAnimation | null>(null)
  const [playerColor, setPlayerColorState] = useState<Color>('w')
  const [orientation, setOrientation] = useState<Color>('w')
  const [gameId, setGameId] = useState(0)
  const animationCounter = useRef(0)

  const engineColor: Color | null = engineEnabled ? opposite(playerColor) : null

  const sync = useCallback(() => setSnapshot(readSnapshot(chess)), [chess])

  const humanCanMove = !snapshot.result && (engineColor === null || snapshot.turn !== engineColor)

  const legalTargets = useMemo(() => {
    if (!selected) return NO_TARGETS
    return groupMovesByTarget(chess.moves({ square: selected, verbose: true }))
    // `snapshot.fen` changes whenever the position does; `chess` is mutated in place.
  }, [chess, selected, snapshot.fen])

  const commitMove = useCallback(
    (input: { from: Square; to: Square; promotion?: PromotionPiece }): boolean => {
      let move: Move
      try {
        move = chess.move(input)
      } catch {
        return false
      }
      animationCounter.current += 1
      setAnimation(animationFor(move, animationCounter.current))
      setSelected(null)
      setPendingPromotion(null)
      sync()
      return true
    },
    [chess, sync],
  )

  const selectSquare = useCallback(
    (square: Square) => {
      if (snapshot.result || pendingPromotion) return
      if (engineColor !== null && snapshot.turn === engineColor) return

      const moves = selected ? legalTargets.get(square) : undefined
      if (selected && moves && moves.length > 0) {
        if (moves.some((move) => move.promotion)) {
          setPendingPromotion({ from: selected, to: square, color: snapshot.turn })
        } else {
          commitMove({ from: selected, to: square })
        }
        return
      }

      const piece = pieceAt(snapshot.board, square)
      if (piece && piece.color === snapshot.turn) {
        setSelected(square === selected ? null : square)
      } else {
        setSelected(null)
      }
    },
    [commitMove, engineColor, legalTargets, pendingPromotion, selected, snapshot],
  )

  const clearSelection = useCallback(() => {
    setSelected(null)
    setPendingPromotion(null)
  }, [])

  const choosePromotion = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return
      commitMove({ from: pendingPromotion.from, to: pendingPromotion.to, promotion: piece })
    },
    [commitMove, pendingPromotion],
  )

  const cancelPromotion = useCallback(() => setPendingPromotion(null), [])

  const resetTransient = useCallback(() => {
    setSelected(null)
    setPendingPromotion(null)
    setAnimation(null)
  }, [])

  const undo = useCallback(
    (plies = 1): boolean => {
      let undone = 0
      for (let i = 0; i < plies; i += 1) {
        if (chess.undo()) undone += 1
        else break
      }
      if (undone === 0) return false
      resetTransient()
      sync()
      return true
    },
    [chess, resetTransient, sync],
  )

  const restart = useCallback(() => {
    chess.reset()
    resetTransient()
    setGameId((id) => id + 1)
    sync()
  }, [chess, resetTransient, sync])

  const setPlayerColor = useCallback((color: Color) => {
    setPlayerColorState(color)
    setOrientation(color)
    setAnimation(null)
  }, [])

  const newGame = useCallback(
    (color?: Color) => {
      chess.reset()
      resetTransient()
      if (color) {
        setPlayerColorState(color)
        setOrientation(color)
      } else {
        setOrientation(playerColor)
      }
      setGameId((id) => id + 1)
      sync()
    },
    [chess, playerColor, resetTransient, sync],
  )

  const flip = useCallback(() => {
    setOrientation((current) => opposite(current))
    // Squares remount when the board turns around; don't replay the last slide.
    setAnimation(null)
  }, [])

  const applyUciMove = useCallback(
    (uci: string, expectedFen: string): boolean => {
      // Stale-response protection: the position must be exactly what the engine searched.
      if (chess.fen() !== expectedFen) return false
      const parsed = parseUci(uci)
      if (!parsed) return false
      return commitMove({
        from: parsed.from,
        to: parsed.to,
        ...(parsed.promotion ? { promotion: parsed.promotion } : {}),
      })
    },
    [chess, commitMove],
  )

  return {
    snapshot,
    selected,
    legalTargets,
    pendingPromotion,
    animation,
    orientation,
    playerColor,
    engineColor,
    gameId,
    humanCanMove,
    selectSquare,
    clearSelection,
    choosePromotion,
    cancelPromotion,
    undo,
    restart,
    newGame,
    flip,
    setPlayerColor,
    applyUciMove,
  }
}
