# API Documentation

## Pure modules

The money maths lives outside the stores so it can be tested on its own.

### `store/money.ts`

##### `toCents(amount: number): number`

Euros to integer cents. `toCents(10.005)` → `1001`.

##### `toEuro(cents: number): number`

Integer cents back to euros.

##### `splitEvenly(totalCents: number, shareCount: number, offset?: number): number[]`

Splits a total into shares summing to **exactly** `totalCents`. The indivisible
remainder is handed out one cent at a time, starting at `offset` so the same
person is not charged the extra cent on every expense.

```typescript
splitEvenly(1000, 3); // [334, 333, 333]
splitEvenly(1000, 3, 1); // [333, 334, 333]
```

Throws if `totalCents` is not an integer.

### `store/balance.ts`

##### `sharesForExpense(expense: Expense): number[]`

Per-person share of one expense in cents, aligned with `expense.participants`.
Single source of truth — balances, settlement and stats all go through it.
Throws if the expense has no participants.

##### `calculateBalancesInCents(expenses: Expense[], roster: string[]): Record<string, number>`

Net position of everyone involved, in integer cents. Positive = must receive.
**Always sums to exactly zero.**

`roster` only seeds who is displayed at zero; anyone who paid for or took part
in an expense is included even if they were since removed from the roster.

##### `calculateBalances(expenses: Expense[], roster: string[]): Record<string, number>`

Same thing in euros.

```typescript
calculateBalances(expenses, ["Alice", "Bob", "Charlie"]);
// { Alice: 30, Bob: 0, Charlie: -30 }
```

### `store/storage.ts`

localStorage is a trust boundary — the user can edit it, another tab can
corrupt it, an old build can have written a different shape. Nothing comes back
out unvetted.

##### `readStored<T>(key, parse, fallback): T`

Reads and JSON-parses `key`, then hands the raw value to `parse`. Returns
`fallback` when the entry is missing, unreadable, not valid JSON, or rejected.

##### `writeStored(key, value): boolean`

Returns `false` instead of throwing when the write fails (quota exceeded,
storage disabled).

##### `parseNameList(raw): string[] | null`

Keeps only the non-empty strings, without duplicates — a duplicated name would
be charged two shares of every expense.

### `store/settlement.ts`

##### `settleDebts(balancesInCents: Record<string, number>): Transfer[]`

Turns a balance sheet into the payment plan that clears it. Two passes: exact
pairing, then greedy largest-against-largest. See
[ALGORITHMS.md](ALGORITHMS.md).

**Throws** if the sheet does not sum to zero or contains fractional cents —
a wrong plan is worse than no plan.

---

## Pinia Stores

### Participant Store

```typescript
import { useParticipantsStore } from "~/store/participant";
```

#### State

| Property | Type | Description |
| --- | --- | --- |
| `participants` | `string[]` | Roster of participant names |
| `newParticipant` | `string` | Input value for new participant |
| `participantError` | `string` | Validation error message |
| `editingParticipant` | `{ original: string; new: string } \| null` | Participant being renamed |
| `showRemoveConfirm` | `string \| null` | Participant pending removal |

#### Computed

| Property | Type | Description |
| --- | --- | --- |
| `sortedParticipants` | `string[]` | Alphabetically sorted roster |

#### Methods

##### `addParticipant(): boolean`

Adds `newParticipant` (trimmed) to the roster. Returns `false` and sets
`participantError` when the name is empty, over 20 characters, or a
case-insensitive duplicate.

##### `validateParticipantName(name, excludeCurrent?): string`

Returns an error message, or an empty string when valid.

##### `startEditing(name: string): void` / `cancelEditing(): void`

Enter and leave rename mode.

##### `saveEditing(): ParticipantRename | null`

Applies the rename to the **roster only** and returns `{ from, to }`, or `null`
when validation fails.

> Do not call this directly. Names are the identity here, so a rename that stops
> at the roster leaves the old name in the expense snapshots as a phantom
> debtor. Use `useExpenseSplitterStore().commitRename()`, which applies both
> halves.

##### `confirmRemove(name)` / `cancelRemove()` / `removeParticipant(name)`

Removal flow. The UI only offers removal to participants whose balance is
zero; removing anyone else would hide an open debt.

##### `calculateParticipantStats(participant: string, expenses: Expense[]): ParticipantStats`

Per-person figures, computed from each expense's own participant snapshot and
the same cent split as the settlement, so `netBalance` always agrees with the
payment plan. The payer is charged their own share.

---

### Expense Store

```typescript
import { useExpenseSplitterStore } from "~/store/expense";
```

#### State

| Property | Type | Description |
| --- | --- | --- |
| `expenses` | `Expense[]` | All recorded expenses |
| `expenseError` | `string` | Validation error message |
| `newExpense` | `{ payer: string; amount: string; description: string }` | New expense form |

#### Computed

| Property | Type | Description |
| --- | --- | --- |
| `hasExpenses` | `boolean` | Whether any expense exists |
| `totalExpenses` | `number` | Sum of all expense amounts |
| `balances` | `Record<string, number>` | Net position per person, in euros |
| `settlements` | `Transfer[]` | The payment plan |
| `settlementError` | `string` | Non-empty when the plan could not be computed |

`balances` and `settlements` are **derived, never stored**. Adding, removing or
renaming anything recomputes them; there is no "calculate" action to forget to
call.

#### Persistence

Expenses are written to `localStorage` on every change and restored on startup,
so a refresh no longer wipes them while the roster survives. Restored entries
go through the same validation as fresh input — a malformed one is dropped
rather than allowed to poison the balance sheet, and duplicate ids are
discarded.

#### Methods

##### `addExpense(): boolean`

Adds `newExpense` to the list and resets the form. Returns `false` and sets
`expenseError` when the amount is not a finite number in `(0, 1000000]`, or
when the payer is not on the current roster.

The new expense stores a **snapshot** of the current roster in
`expense.participants`, so later roster changes never re-split it.

##### `removeExpense(id: string): void`

Removes an expense by id.

##### `commitRename(): ParticipantRename | null`

Commits the pending rename across **both** the roster and every expense
snapshot, in one call. Returns `null` when there is nothing pending or the new
name is rejected.

```typescript
splitterStore.commitRename();
```

---

## Type Definitions

### Expense

```typescript
interface Expense {
  id: string; // Unique identifier
  payer: string; // Who paid
  amount: number; // Amount paid, in euros
  description: string; // Optional description
  participants: string[]; // Frozen snapshot of who it is split among
  timestamp: number; // Creation time; also rotates the leftover cents
}
```

### Transfer

```typescript
interface Transfer {
  from: string; // Person who owes money
  to: string; // Person who should receive money
  amount: number; // Amount to transfer, in euros
}
```

### ParticipantStats

```typescript
interface ParticipantStats {
  totalPaid: number; // Total this person paid out
  totalOwed: number; // Their share of every expense they were part of
  netBalance: number; // totalPaid - totalOwed
  numberOfExpenses: number; // Expenses they paid for
  averageExpense: number; // Average of those
}
```

### ParticipantRename

```typescript
interface ParticipantRename {
  from: string;
  to: string;
}
```

---

## Component Props

Only `ParticipantStats` takes a prop (`participant: string`). Every other
component reads store state directly. State changes go through Pinia actions,
so no component emits custom events.
