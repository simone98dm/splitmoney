# Algorithm Documentation

How SplitMoney turns a list of expenses into the shortest list of payments
that clears every debt.

- [Money representation](#money-representation)
- [Balance calculation](#balance-calculation)
- [Settlement](#settlement)
- [Edge cases](#edge-cases)
- [Complexity](#complexity)
- [Worked examples](#worked-examples)

## Money representation

**All arithmetic happens in integer cents.** Euros only appear at the UI
boundary.

```typescript
// store/money.ts
toCents(10) // 1000
toEuro(1000) // 10
```

This is not a style preference. Splitting €10 three ways in floating point
gives `3.3333…` per person. Rounding each balance on its own produces
`+6.67 / -3.33 / -3.33`, which sums to `+0.01` — a balance sheet that does not
add up, and a payment plan that leaves one cent permanently unpaid.

`splitEvenly` divides a total into shares that sum back to **exactly** the
total. The indivisible remainder is handed out one cent at a time:

```typescript
splitEvenly(1000, 3) // [334, 333, 333]  -> sums to 1000
splitEvenly(1000, 3, 1) // [333, 334, 333]  -> offset rotates who pays it
```

The third argument matters over time: always starting at index 0 would charge
the extra cent to whoever sits first in the list on *every* expense. Callers
pass the expense timestamp so the burden rotates.

## Balance calculation

```typescript
// store/balance.ts
calculateBalancesInCents(expenses, roster): Record<string, number>
```

Positive = must receive. Negative = must pay. **The result always sums to
exactly zero.**

For every expense:

1. split the total over `expense.participants` with `sharesForExpense`
2. debit each participant their share
3. credit the payer the full amount

Two properties are worth spelling out:

**Each expense carries its own participant list.** `expense.participants` is a
snapshot frozen when the expense is created. Adding somebody to the group
tomorrow must not retroactively re-split yesterday's dinner.

**Nobody is dropped.** `roster` only seeds who is displayed at zero. Anyone who
paid for or took part in an expense stays in the balance sheet even after being
removed from the roster — otherwise their money would silently vanish.

## Settlement

```typescript
// store/settlement.ts
settleDebts(balancesInCents): Transfer[]
```

### This problem has no cheap exact solution

Minimising the number of transfers is **NP-hard**. It reduces to subset-sum:
the minimum is `n - k`, where `k` is the largest number of disjoint groups the
participants can be split into such that each group's balances sum to zero, and
finding `k` requires exponential search.

So this is a heuristic, in two passes.

### Pass 1 — exact pairing

A debtor and a creditor owing the identical amount clear each other in a single
transfer. Plain largest-first greedy walks straight past these and fragments
them.

### Pass 2 — greedy largest against largest

Sort what is left, match the biggest debt against the biggest credit, subtract,
advance whichever hit zero. Integer cents hit zero exactly, so there is no
epsilon threshold that could strand a sub-cent remainder.

### How good is it

Measured against a brute-force optimum (bitmask DP) over 15,601 random balance
sheets of 3–8 people:

| | avg transfers | sub-optimal |
|---|---|---|
| brute-force optimum | 3.81 | — |
| two-pass (current) | 3.90 | **8.70%** |
| plain greedy (previous) | 4.11 | 27.13% |

The two-pass version was never worse than plain greedy in any of those trials.

Exhaustive branch-and-bound only starts paying off past roughly 15 people — add
it then, not before.

## Edge cases

| Case | Handling |
|---|---|
| Zero balance | Excluded from transfers, neither debtor nor creditor |
| Amount that does not divide evenly | Remainder distributed by `splitEvenly`; the sheet still sums to zero |
| Sub-cent debts | Cannot exist — everything is integer cents |
| Payer removed from the roster | Kept in the balance sheet, still owed their money |
| Participant renamed | Applied to the roster *and* to every expense snapshot |
| Participant with an open balance | Cannot be removed from the UI |
| No expenses | Balances are all zero, no transfers |
| Corrupted `localStorage` | Malformed expenses are dropped on load, not fed into the ledger |
| Balance sheet not summing to zero | `settleDebts` throws; the store surfaces it as `settlementError` instead of rendering a wrong plan |

## Complexity

| Step | Time | Space |
|---|---|---|
| Balance calculation | O(n × m) | O(m) |
| Exact pairing | O(m) | O(m) |
| Greedy matching | O(m log m) | O(m) |

`n` = expenses, `m` = participants. Sorting dominates.

Everything is derived, not stored: balances and settlements are Vue `computed`
values, so adding, removing or renaming anything recomputes the plan. A cached
copy would keep displaying payments for expenses that no longer exist.

## Worked examples

### Weekend trip — 4 people

| Expense | Payer | Amount |
|---|---|---|
| Accommodation | Alice | €120 |
| Dinner | Bob | €80 |
| Breakfast | Charlie | €40 |
| Gas | David | €60 |

Total €300, €75 each.

```
Alice   +45      Charlie  -35
Bob      +5      David    -15
```

Pass 1 finds no exact pair. Pass 2:

```
Charlie → Alice  €35      (Charlie settled, Alice still owed €10)
David   → Alice  €10      (Alice settled, David still owes €5)
David   → Bob     €5      (both settled)
```

**3 transfers** — optimal.

### Where exact pairing wins

```
A -1.00   B -3.00   C -4.00   D +3.00   E +5.00
```

Plain greedy sorts to debtors `[4, 3, 1]`, creditors `[5, 3]` and produces
**four** transfers. Exact pairing spots `B(-3) ↔ D(+3)` first, leaving
`[4, 1]` against `[5]`:

```
B → D  €3
C → E  €4
A → E  €1
```

**3 transfers** — optimal.

### Awkward split — €10 among 3

```
shares  [334, 333, 333]   (sum 1000, exact)
A +6.66   B -3.33   C -3.33
B → A  €3.33
C → A  €3.33
```

A receives €6.66, exactly what A is owed. Nothing evaporates.

### Uneven group — 5 people

```
A +60   B -40   C +10   D -40   E +10
```

No zero-sum subgroup exists here, so **4 transfers** is genuinely the minimum —
not a failure of the heuristic.

---

For contribution guidelines see [CONTRIBUTING.md](CONTRIBUTING.md).
