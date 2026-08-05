import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseNameList, readStored, writeStored } from "../storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("readStored", () => {
    const identity = (raw: unknown) => raw as string[];

    it("returns the fallback when the key is missing", () => {
      expect(readStored("missing", identity, ["fallback"])).toEqual([
        "fallback",
      ]);
    });

    it("returns the fallback on invalid JSON", () => {
      localStorage.setItem("k", "{not json");
      expect(readStored("k", identity, ["fallback"])).toEqual(["fallback"]);
    });

    it("returns the fallback when the parser rejects the value", () => {
      localStorage.setItem("k", '"a string"');
      expect(readStored("k", parseNameList, ["fallback"])).toEqual(["fallback"]);
    });

    it("returns the fallback when storage itself throws", () => {
      localStorage.setItem("k", '["Alice"]');
      vi.spyOn(localStorage, "getItem").mockImplementation(() => {
        throw new Error("storage disabled");
      });
      expect(readStored("k", identity, ["fallback"])).toEqual(["fallback"]);
    });

    it("returns the parsed value when it is accepted", () => {
      localStorage.setItem("k", '["Alice","Bob"]');
      expect(readStored("k", parseNameList, [])).toEqual(["Alice", "Bob"]);
    });
  });

  describe("writeStored", () => {
    it("round-trips a value", () => {
      expect(writeStored("k", ["Alice"])).toBe(true);
      expect(localStorage.getItem("k")).toBe('["Alice"]');
    });

    it("reports failure instead of throwing when the quota is blown", () => {
      vi.spyOn(localStorage, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
      expect(writeStored("k", ["Alice"])).toBe(false);
    });
  });

  describe("parseNameList", () => {
    it("rejects anything that is not an array", () => {
      expect(parseNameList({ Alice: true })).toBeNull();
      expect(parseNameList("Alice")).toBeNull();
    });

    it("drops non-strings and blanks", () => {
      expect(parseNameList(["Alice", 42, null, "  ", "Bob"])).toEqual([
        "Alice",
        "Bob",
      ]);
    });

    it("drops duplicates, which would double-charge that person", () => {
      expect(parseNameList(["Alice", "Alice", "Bob"])).toEqual([
        "Alice",
        "Bob",
      ]);
    });
  });
});
