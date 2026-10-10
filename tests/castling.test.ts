import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CastlingRights, castlingToString, parseCastling } from "../src/index.js";

describe("castling rights", () => {
  it("formats rights in canonical KQkq order", () => {
    assert.equal(castlingToString(CastlingRights.None), "-");
    assert.equal(castlingToString(CastlingRights.All), "KQkq");
    assert.equal(castlingToString(CastlingRights.WhiteKingSide), "K");
    assert.equal(
      castlingToString(CastlingRights.WhiteQueenSide | CastlingRights.BlackKingSide),
      "Qk",
    );
  });

  it("parses valid castling fields", () => {
    assert.equal(parseCastling("-"), CastlingRights.None);
    assert.equal(parseCastling("KQkq"), CastlingRights.All);
    assert.equal(parseCastling("Kq"), CastlingRights.WhiteKingSide | CastlingRights.BlackQueenSide);
    assert.equal(parseCastling("qkQK"), CastlingRights.All); // order is tolerated
  });

  it("rejects invalid castling fields", () => {
    for (const text of ["", "KQkqq", "KK", "X", "-K", "K-", "KQkqK", "kqKQ1"]) {
      assert.equal(parseCastling(text), undefined, JSON.stringify(text));
    }
  });

  it("round-trips all 16 masks", () => {
    for (let rights = 0; rights < 16; rights++) {
      assert.equal(parseCastling(castlingToString(rights)), rights);
    }
  });

  it("uses distinct single-bit flags", () => {
    const flags = [
      CastlingRights.WhiteKingSide,
      CastlingRights.WhiteQueenSide,
      CastlingRights.BlackKingSide,
      CastlingRights.BlackQueenSide,
    ];
    assert.equal(
      flags.reduce((mask, flag) => mask | flag, 0),
      CastlingRights.All,
    );
    for (const flag of flags) {
      assert.equal(flag & (flag - 1), 0, "each flag is a single bit");
    }
  });
});
