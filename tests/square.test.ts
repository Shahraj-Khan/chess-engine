import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NO_SQUARE,
  Square,
  fileOf,
  isValidSquare,
  makeSquare,
  parseSquare,
  rankOf,
  squareToString,
} from "../src/index.js";

describe("square helpers", () => {
  it("uses a1 = 0 and h8 = 63 with rank * 8 + file layout", () => {
    assert.equal(Square.A1, 0);
    assert.equal(Square.H1, 7);
    assert.equal(Square.A8, 56);
    assert.equal(Square.H8, 63);
    assert.equal(Square.E4, 28);
  });

  it("round-trips file/rank for all 64 squares", () => {
    for (let square = 0; square < 64; square++) {
      assert.equal(makeSquare(fileOf(square), rankOf(square)), square);
    }
  });

  it("round-trips algebraic names for all 64 squares", () => {
    for (let square = 0; square < 64; square++) {
      assert.equal(parseSquare(squareToString(square)), square);
    }
    assert.equal(squareToString(Square.E4), "e4");
    assert.equal(parseSquare("h8"), Square.H8);
  });

  it("rejects malformed square names", () => {
    for (const text of ["", "e", "e44", "a9", "a0", "i1", "E4", "4e"]) {
      assert.equal(parseSquare(text), NO_SQUARE, text);
    }
  });

  it("validates square indices", () => {
    assert.equal(isValidSquare(0), true);
    assert.equal(isValidSquare(63), true);
    assert.equal(isValidSquare(-1), false);
    assert.equal(isValidSquare(64), false);
    assert.equal(isValidSquare(1.5), false);
    assert.equal(isValidSquare(Number.NaN), false);
  });
});
