import { describe, expect, it } from "vitest";
import { settleDebts } from "../settlement";
import { toCents } from "../money";

/** Replays the plan and returns what each person ends up net of transfers. */
const applyTransfers = (transfers: { from: string; to: string; amount: number }[]) => {
  const net: Record<string, number> = {};
  for (const transfer of transfers) {
    net[transfer.from] = (net[transfer.from] ?? 0) - toCents(transfer.amount);
    net[transfer.to] = (net[transfer.to] ?? 0) + toCents(transfer.amount);
  }
  return net;
};

const expectPlanClearsBalances = (balances: Record<string, number>) => {
  const transfers = settleDebts(balances);
  const net = applyTransfers(transfers);
  for (const [person, cents] of Object.entries(balances)) {
    expect([person, net[person] ?? 0]).toEqual([person, cents]);
  }
  return transfers;
};

describe("settleDebts", () => {
  it("returns nothing when everybody is already even", () => {
    expect(settleDebts({ Alice: 0, Bob: 0 })).toEqual([]);
  });

  it("settles a single debtor against a single creditor", () => {
    expect(settleDebts({ Alice: 5000, Bob: -5000 })).toEqual([
      { from: "Bob", to: "Alice", amount: 50 },
    ]);
  });

  it("pairs exact matches instead of fragmenting them", () => {
    // debtors 4,3,1 / creditors 5,3 — plain greedy needs 4 transfers here
    const transfers = expectPlanClearsBalances({
      A: -100,
      B: -300,
      C: -400,
      D: 300,
      E: 500,
    });

    expect(transfers).toHaveLength(3);
  });

  it("never needs more than n-1 transfers", () => {
    const balances = { A: 1000, B: 500, C: -400, D: -700, E: -400 };
    expect(expectPlanClearsBalances(balances).length).toBeLessThanOrEqual(4);
  });

  it("settles every cent of an awkward three-way split", () => {
    // 10.00 paid by A for 3 people: shares 334 / 333 / 333
    expectPlanClearsBalances({ A: 666, B: -333, C: -333 });
  });

  it("does not strand sub-cent leftovers", () => {
    // the old epsilon threshold silently dropped these one-cent debts
    const transfers = expectPlanClearsBalances({ A: 2, B: -1, C: -1, D: 0 });
    expect(transfers).toHaveLength(2);
  });

  it("rejects a balance sheet that does not sum to zero", () => {
    expect(() => settleDebts({ A: 100, B: -99 })).toThrow(/non quadrati/);
  });

  it("rejects fractional cents", () => {
    expect(() => settleDebts({ A: 10.5, B: -10.5 })).toThrow(/non valido/);
  });

  it("clears randomised balance sheets exactly", () => {
    for (let trial = 0; trial < 500; trial++) {
      const people = 2 + Math.floor(Math.random() * 8);
      const balances: Record<string, number> = {};
      let running = 0;
      for (let i = 0; i < people - 1; i++) {
        const cents = Math.floor(Math.random() * 20001) - 10000;
        balances[`P${i}`] = cents;
        running += cents;
      }
      balances[`P${people - 1}`] = -running;

      const transfers = settleDebts(balances);
      const net = applyTransfers(transfers);
      for (const [person, cents] of Object.entries(balances)) {
        expect(net[person] ?? 0).toBe(cents);
      }
      expect(transfers.length).toBeLessThanOrEqual(people - 1);
    }
  });
});
