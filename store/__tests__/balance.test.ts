import { describe, expect, it } from "vitest";
import type { Expense } from "~/types";
import {
  calculateBalances,
  calculateBalancesInCents,
  sharesForExpense,
} from "../balance";

const expense = (partial: Partial<Expense> & Pick<Expense, "payer" | "amount">): Expense => ({
  id: "e1",
  description: "",
  participants: ["Alice", "Bob"],
  timestamp: 0,
  ...partial,
});

const sum = (balances: Record<string, number>) =>
  Object.values(balances).reduce((total, value) => total + value, 0);

describe("calculateBalancesInCents", () => {
  it("credits the payer and debits every participant their share", () => {
    const balances = calculateBalancesInCents(
      [expense({ payer: "Alice", amount: 100 })],
      ["Alice", "Bob"]
    );

    expect(balances).toEqual({ Alice: 5000, Bob: -5000 });
  });

  it("always sums to exactly zero on an indivisible amount", () => {
    const balances = calculateBalancesInCents(
      [expense({ payer: "A", amount: 10, participants: ["A", "B", "C"] })],
      ["A", "B", "C"]
    );

    expect(sum(balances)).toBe(0);
    expect(balances).toEqual({ A: 666, B: -333, C: -333 });
  });

  it("sums to zero for any amount and party size", () => {
    for (let cents = 1; cents <= 300; cents++) {
      for (let people = 1; people <= 9; people++) {
        const roster = Array.from({ length: people }, (_, i) => `P${i}`);
        const balances = calculateBalancesInCents(
          [expense({ payer: "P0", amount: cents / 100, participants: roster })],
          roster
        );
        expect(sum(balances)).toBe(0);
      }
    }
  });

  it("keeps each expense on the participants it was created with", () => {
    // Bob joined only for the second expense: the first must not be re-split
    const balances = calculateBalancesInCents(
      [
        expense({ payer: "Alice", amount: 100, participants: ["Alice"] }),
        expense({ payer: "Alice", amount: 100, participants: ["Alice", "Bob"] }),
      ],
      ["Alice", "Bob"]
    );

    expect(balances).toEqual({ Alice: 5000, Bob: -5000 });
  });

  it("keeps a payer who is no longer on the roster instead of producing NaN", () => {
    const balances = calculateBalancesInCents(
      [expense({ payer: "Zoe", amount: 30, participants: ["A", "B", "C"] })],
      ["A", "B", "C"]
    );

    expect(balances).toEqual({ A: -1000, B: -1000, C: -1000, Zoe: 3000 });
    expect(sum(balances)).toBe(0);
  });

  it("shows roster members with no expenses at zero", () => {
    expect(calculateBalancesInCents([], ["Alice", "Bob"])).toEqual({
      Alice: 0,
      Bob: 0,
    });
  });

  it("rejects an expense with no participants", () => {
    expect(() =>
      calculateBalancesInCents(
        [expense({ payer: "Alice", amount: 10, participants: [] })],
        ["Alice"]
      )
    ).toThrow(/partecipanti/);
  });
});

describe("sharesForExpense", () => {
  it("always adds back up to the expense total", () => {
    const shares = sharesForExpense(
      expense({ payer: "A", amount: 10, participants: ["A", "B", "C"] })
    );
    expect(shares.reduce((sum, s) => sum + s, 0)).toBe(1000);
  });

  it("does not always charge the extra cent to the same person", () => {
    const roster = ["A", "B", "C"];
    const chargedExtra = new Set<number>();

    for (let timestamp = 0; timestamp < 9; timestamp++) {
      const shares = sharesForExpense(
        expense({ payer: "A", amount: 10, participants: roster, timestamp })
      );
      chargedExtra.add(shares.indexOf(334));
    }

    expect(chargedExtra.size).toBe(roster.length);
  });
});

describe("calculateBalances", () => {
  it("reports euros", () => {
    expect(
      calculateBalances([expense({ payer: "Alice", amount: 100 })], [
        "Alice",
        "Bob",
      ])
    ).toEqual({ Alice: 50, Bob: -50 });
  });
});
