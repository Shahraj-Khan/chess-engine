export function square(file: string, rank: number): number {
  const fileIndex = file.charCodeAt(0) - "a".charCodeAt(0);
  const rankIndex = rank - 1;

  return rankIndex * 8 + fileIndex;
}

export function squareName(index: number): string {
  const file = String.fromCharCode("a".charCodeAt(0) + (index % 8));
  const rank = Math.floor(index / 8) + 1;

  return `${file}${rank}`;
}