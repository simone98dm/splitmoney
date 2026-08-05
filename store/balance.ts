import type { Expense } from "~/types";
import { splitEvenly, toCents, toEuro } from "~/store/money";

/**
 * The per-person share of one expense, in cents, aligned with
 * `expense.participants`.
 *
 * Single source of truth: balances, the settlement and the per-person stats
 * must all use the same split, or the numbers on screen stop agreeing.
 * The timestamp rotates who absorbs the leftover cents so the same person is
 * not charged the extra cent on every expense.
 */
export const sharesForExpense = (expense: Expense): number[] => {
  if (expense.participants.length === 0) {
    throw new Error(
      `La spesa "${expense.description || expense.id}" non ha partecipanti`
    );
  }

  return splitEvenly(
    toCents(expense.amount),
    expense.participants.length,
    expense.timestamp
  );
};

/**
 * Net position of every person involved, in integer cents.
 * Positive = must receive, negative = must pay. The result always sums to
 * exactly zero.
 *
 * `roster` only seeds the people to show with a zero balance. Anyone who paid
 * for or took part in an expense is included even if they have since been
 * removed from the roster — dropping them would make their money vanish.
 */
export const calculateBalancesInCents = (
  expenses: Expense[],
  roster: string[]
): Record<string, number> => {
  const balances: Record<string, number> = {};
  for (const person of roster) {
    balances[person] = 0;
  }

  const credit = (person: string, cents: number) => {
    balances[person] = (balances[person] ?? 0) + cents;
  };

  for (const expense of expenses) {
    const shares = sharesForExpense(expense);

    expense.participants.forEach((person, index) =>
      credit(person, -shares[index])
    );
    credit(expense.payer, toCents(expense.amount));
  }

  return balances;
};

/** Same thing in euros, for display and for the public store API. */
export const calculateBalances = (
  expenses: Expense[],
  roster: string[]
): Record<string, number> =>
  Object.fromEntries(
    Object.entries(calculateBalancesInCents(expenses, roster)).map(
      ([person, cents]) => [person, toEuro(cents)]
    )
  );
