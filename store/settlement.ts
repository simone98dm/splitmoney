import type { Transfer } from "~/types";
import { toEuro } from "~/store/money";

interface DebtNode {
  person: string;
  cents: number;
}

/**
 * Turns a balance sheet into the payment plan that clears it.
 *
 * The exact minimum number of transfers is NP-hard (it is a subset-sum
 * partition), so this runs two passes:
 *
 *   1. exact pairing — a debtor and a creditor owing the identical amount
 *      clear each other in one transfer. Plain largest-first greedy misses
 *      these and fragments them into extra transfers.
 *   2. greedy largest-debtor against largest-creditor on whatever is left.
 *
 * The plan is always at most n-1 transfers and settles every cent exactly.
 *
 * ponytail: pass 1 recovers the common real-world cases; a branch-and-bound
 * search for the true optimum only pays off past ~15 people, add it then.
 */
export const settleDebts = (
  balancesInCents: Record<string, number>
): Transfer[] => {
  const debtors: DebtNode[] = [];
  const creditors: DebtNode[] = [];

  for (const [person, cents] of Object.entries(balancesInCents)) {
    if (!Number.isInteger(cents)) {
      throw new Error(`Bilancio non valido per ${person}: ${cents}`);
    }
    if (cents < 0) debtors.push({ person, cents: -cents });
    else if (cents > 0) creditors.push({ person, cents });
  }

  const totalOwed = sumCents(debtors);
  const totalDue = sumCents(creditors);
  if (totalOwed !== totalDue) {
    throw new Error(
      `Bilanci non quadrati: debiti ${totalOwed} centesimi, crediti ${totalDue} centesimi`
    );
  }

  const { transfers, remainingDebtors, remainingCreditors } =
    pairExactMatches(debtors, creditors);

  return [...transfers, ...greedyMatch(remainingDebtors, remainingCreditors)];
};

const sumCents = (nodes: DebtNode[]): number =>
  nodes.reduce((total, node) => total + node.cents, 0);

/** Pass 1: one transfer clears two people whenever the amounts line up. */
const pairExactMatches = (debtors: DebtNode[], creditors: DebtNode[]) => {
  const creditorsByAmount = new Map<number, DebtNode[]>();
  for (const creditor of creditors) {
    const bucket = creditorsByAmount.get(creditor.cents);
    if (bucket) bucket.push(creditor);
    else creditorsByAmount.set(creditor.cents, [creditor]);
  }

  const transfers: Transfer[] = [];
  const remainingDebtors: DebtNode[] = [];
  const matched = new Set<DebtNode>();

  for (const debtor of debtors) {
    const match = creditorsByAmount.get(debtor.cents)?.pop();
    if (!match) {
      remainingDebtors.push(debtor);
      continue;
    }
    matched.add(match);
    transfers.push({
      from: debtor.person,
      to: match.person,
      amount: toEuro(debtor.cents),
    });
  }

  return {
    transfers,
    remainingDebtors,
    remainingCreditors: creditors.filter((creditor) => !matched.has(creditor)),
  };
};

/** Pass 2: largest debt against largest credit until everything is zero. */
const greedyMatch = (debtors: DebtNode[], creditors: DebtNode[]): Transfer[] => {
  // local copies: the caller's nodes are never touched
  const debts = debtors.map((node) => ({ ...node })).sort(byCentsDesc);
  const credits = creditors.map((node) => ({ ...node })).sort(byCentsDesc);

  const transfers: Transfer[] = [];
  let debtIndex = 0;
  let creditIndex = 0;

  while (debtIndex < debts.length && creditIndex < credits.length) {
    const debt = debts[debtIndex];
    const credit = credits[creditIndex];
    const amount = Math.min(debt.cents, credit.cents);

    transfers.push({
      from: debt.person,
      to: credit.person,
      amount: toEuro(amount),
    });

    debt.cents -= amount;
    credit.cents -= amount;

    // integer cents: these hit zero exactly, no epsilon threshold that would
    // strand a sub-cent remainder
    if (debt.cents === 0) debtIndex++;
    if (credit.cents === 0) creditIndex++;
  }

  return transfers;
};

const byCentsDesc = (a: DebtNode, b: DebtNode) => b.cents - a.cents;
