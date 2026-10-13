import { Move } from "../move/move.js";


export enum TTBound {
  Exact,
  LowerBound,
  UpperBound,
}

export interface TTEntry {
  hash: bigint;
  depth: number;
  score: number;
  bound: TTBound;
  bestMove: Move | null;
}

export class TranspositionTable {
  private readonly entries = new Map<bigint, TTEntry>();

  store(entry: TTEntry): void {
    const existing = this.entries.get(entry.hash);

    // Keep a deeper entry when one is already available.
    if (existing && existing.depth > entry.depth) {
      return;
    }

    this.entries.set(entry.hash, entry);
  }

  probe(hash: bigint): TTEntry | null {
    return this.entries.get(hash) ?? null;
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
