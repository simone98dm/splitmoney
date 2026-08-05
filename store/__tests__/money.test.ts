import { describe, expect, it } from "vitest";
import { splitEvenly, toCents, toEuro } from "../money";

describe("money", () => {
  describe("toCents", () => {
    it("converts euros to integer cents", () => {
      expect(toCents(10)).toBe(1000);
      expect(toCents(10.005)).toBe(1001);
      expect(toCents(0.1 + 0.2)).toBe(30);
    });
  });

  describe("splitEvenly", () => {
    it("splits an exactly divisible amount into equal shares", () => {
      expect(splitEvenly(900, 3)).toEqual([300, 300, 300]);
    });

    it("spreads the indivisible remainder one cent at a time", () => {
      // Arrange / Act
      const shares = splitEvenly(1000, 3);

      // Assert
      expect(shares).toEqual([334, 333, 333]);
      expect(shares.reduce((sum, s) => sum + s, 0)).toBe(1000);
    });

    it("never loses or creates a cent, whatever the split", () => {
      for (let total = 0; total <= 500; total++) {
        for (let people = 1; people <= 12; people++) {
          const shares = splitEvenly(total, people);
          expect(shares).toHaveLength(people);
          expect(shares.reduce((sum, s) => sum + s, 0)).toBe(total);
        }
      }
    });

    it("rotates who absorbs the extra cents with the offset", () => {
      expect(splitEvenly(1000, 3, 0)).toEqual([334, 333, 333]);
      expect(splitEvenly(1000, 3, 1)).toEqual([333, 334, 333]);
      expect(splitEvenly(1000, 3, 2)).toEqual([333, 333, 334]);
      expect(splitEvenly(1000, 3, 3)).toEqual([334, 333, 333]);
    });

    it("wraps the extra cents around the end of the list", () => {
      const shares = splitEvenly(1002, 4, 3);
      expect(shares.reduce((sum, s) => sum + s, 0)).toBe(1002);
      expect(shares).toEqual([251, 250, 250, 251]);
    });

    it("keeps the total exact for any offset", () => {
      for (let offset = -5; offset <= 20; offset++) {
        const shares = splitEvenly(1000, 7, offset);
        expect(shares.reduce((sum, s) => sum + s, 0)).toBe(1000);
      }
    });

    it("handles negative totals without losing a cent", () => {
      const shares = splitEvenly(-1000, 3);
      expect(shares.reduce((sum, s) => sum + s, 0)).toBe(-1000);
    });

    it("returns nothing when there is nobody to split among", () => {
      expect(splitEvenly(1000, 0)).toEqual([]);
    });

    it("rejects fractional cents", () => {
      expect(() => splitEvenly(10.5, 3)).toThrow();
    });
  });

  describe("toEuro", () => {
    it("is the exact inverse of toCents", () => {
      expect(toEuro(toCents(33.33))).toBe(33.33);
    });
  });
});
