/**
 * Side colors. The numeric values double as array indices for per-color
 * tables (e.g. `kingSquare[color]`), so they must stay 0 and 1.
 */
export const Color = { White: 0, Black: 1 } as const;
export type Color = (typeof Color)[keyof typeof Color];

export function oppositeColor(color: Color): Color {
  return (color ^ 1) as Color;
}
