import type { ReactNode } from 'react'
import type { PieceSymbol } from '../../game/types'

/**
 * Original piece silhouettes drawn on a 100×100 grid.
 * `body` is drawn twice (as a thick outline, then as the fill) so overlapping sub-shapes merge
 * into one clean silhouette. `detail` holds inner linework drawn on top.
 */
interface PieceShape {
  readonly body: ReactNode
  readonly detail: ReactNode
}

const BASE = <rect x="23" y="77" width="54" height="10" rx="5" />

const pawn: PieceShape = {
  body: (
    <>
      <circle cx="50" cy="31" r="12" />
      <rect x="36" y="41" width="28" height="7" rx="3.500" />
      <path d="M42 46h16c0 11 6 20 9 31H33c3-11 9-20 9-31z" />
      {BASE}
    </>
  ),
  detail: <path className="piece__line" d="M41 60c5 2 13 2 18 0" />,
}

const rook: PieceShape = {
  body: (
    <>
      <path d="M28 20h10v8h6v-8h12v8h6v-8h10v20l-6 6H34l-6-6z" />
      <path d="M35 44h30l3 26H32z" />
      <rect x="27" y="67" width="46" height="10" rx="4" />
      {BASE}
    </>
  ),
  detail: <path className="piece__line" d="M33 40h34M35 58h30" />,
}

const knight: PieceShape = {
  body: (
    <>
      <path d="M26 77c0-11 5-18 13-24-4 0-8 2-12 5-3 2-7 1-9-2-2-3-1-6 1-9l12-16c3-4 5-6 5-11l7 6c3-3 8-5 12-5l3-9 6 10c11 5 18 17 17 33-.4 7-.5 14 0 22z" />
      {BASE}
    </>
  ),
  detail: (
    <>
      <circle className="piece__dot" cx="40" cy="31" r="3" />
      <circle className="piece__dot" cx="19" cy="48" r="1.800" />
      <path className="piece__line" d="M52 31c8 3 13 11 14 22" />
    </>
  ),
}

const bishop: PieceShape = {
  body: (
    <>
      <circle cx="50" cy="13" r="5.500" />
      <path d="M50 19c14 9 19 21 13 31-2 3-5 5-7 6H44c-2-1-5-3-7-6-6-10-1-22 13-31z" />
      <rect x="35" y="54" width="30" height="8" rx="4" />
      <path d="M41 60h18l5 17H36z" />
      {BASE}
    </>
  ),
  detail: <path className="piece__line" d="M44 40l11-11" />,
}

const queen: PieceShape = {
  body: (
    <>
      <circle cx="25" cy="24" r="5" />
      <circle cx="37.500" cy="17" r="5" />
      <circle cx="50" cy="14" r="5" />
      <circle cx="62.500" cy="17" r="5" />
      <circle cx="75" cy="24" r="5" />
      <path d="M29 72 24 28l12 18 3-23 7 24 4-27 4 27 7-24 3 23 12-18-5 44z" />
      <rect x="27" y="67" width="46" height="10" rx="4" />
      {BASE}
    </>
  ),
  detail: <path className="piece__line" d="M33 62h34" />,
}

const king: PieceShape = {
  body: (
    <>
      <rect x="46.500" y="5" width="7" height="22" rx="2" />
      <rect x="39" y="11" width="22" height="7" rx="2" />
      <path d="M50 26c9-5 22-1 23 11 1 8-5 13-9 16l5 19H31l5-19c-4-3-10-8-9-16 1-12 14-16 23-11z" />
      <rect x="27" y="67" width="46" height="10" rx="4" />
      {BASE}
    </>
  ),
  detail: <path className="piece__line" d="M38 52h24M33 62h34" />,
}

export const PIECE_SHAPES: Record<PieceSymbol, PieceShape> = {
  p: pawn,
  n: knight,
  b: bishop,
  r: rook,
  q: queen,
  k: king,
}
