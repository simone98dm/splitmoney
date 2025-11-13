# API Documentation

## Pinia Stores

### Participant Store

**Import:**

```typescript
import { useParticipantsStore } from "~/store/participant";
```

#### State

| Property             | Type                                        | Description                      |
| -------------------- | ------------------------------------------- | -------------------------------- |
| `participants`       | `string[]`                                  | Array of participant names       |
| `newParticipant`     | `string`                                    | Input value for new participant  |
| `participantError`   | `string`                                    | Error message for validation     |
| `editingParticipant` | `{ original: string; new: string } \| null` | Currently editing participant    |
| `showRemoveConfirm`  | `string \| null`                            | Participant name pending removal |

#### Computed Properties

| Property             | Type       | Description                        |
| -------------------- | ---------- | ---------------------------------- |
| `sortedParticipants` | `string[]` | Alphabetically sorted participants |

#### Methods

##### `addParticipant(): boolean`

Adds a new participant to the list.

**Returns:** `true` if successful, `false` if validation fails

**Validation:**

- Name cannot be empty
- Name must be ≤ 20 characters
- Name must be unique (case-insensitive)

**Example:**

```typescript
const store = useParticipantsStore();
store.newParticipant = "Alice";
const success = store.addParticipant();
```

##### `validateParticipantName(name: string, excludeCurrent?: string): string`

Validates a participant name.

**Parameters:**

- `name`: The name to validate
- `excludeCurrent`: Optional name to exclude from uniqueness check (for editing)

**Returns:** Error message string, or empty string if valid

##### `startEditing(name: string): void`

Initiates editing mode for a participant.

##### `cancelEditing(): void`

Cancels the current edit operation.

##### `saveEditing(expenses: Expense[]): boolean`

Saves the edited participant name and updates related expenses.

**Parameters:**

- `expenses`: Array of expenses to update payer references

**Returns:** `true` if successful, `false` if validation fails

##### `confirmRemove(name: string): void`

Shows confirmation dialog for removing a participant.

##### `cancelRemove(): void`

Cancels the removal confirmation.

##### `removeParticipant(name: string): void`

Removes a participant from the list.

##### `canRemoveParticipant(name: string, expenses: Expense[]): boolean`

Checks if a participant can be removed (no expenses associated).

##### `calculateParticipantStats(participant: string, expenses: Expense[], totalParticipants: number): ParticipantStats`

Calculates detailed statistics for a participant.

**Returns:**

```typescript
{
  totalPaid: number,        // Total amount paid by participant
  totalOwed: number,        // Total amount owed to others
  netBalance: number,       // Net balance (positive = owed, negative = owes)
  numberOfExpenses: number, // Number of expenses paid
  averageExpense: number    // Average expense amount
}
```

---

### Expense Store

**Import:**

```typescript
import { useExpenseSplitterStore } from "~/store/expense";
```

#### State

| Property      | Type                                                     | Description                     |
| ------------- | -------------------------------------------------------- | ------------------------------- |
| `expenses`    | `Expense[]`                                              | Array of all expenses           |
| `settlements` | `Transfer[]`                                             | Calculated settlement transfers |
| `newExpense`  | `{ payer: string; amount: string; description: string }` | Form data for new expense       |

#### Computed Properties

| Property        | Type      | Description                |
| --------------- | --------- | -------------------------- |
| `hasExpenses`   | `boolean` | Whether any expenses exist |
| `totalExpenses` | `number`  | Sum of all expense amounts |

#### Methods

##### `addExpense(): void`

Adds a new expense to the list.

**Requirements:**

- `newExpense.payer` must be set
- `newExpense.amount` must be a valid number

**Example:**

```typescript
const store = useExpenseSplitterStore();
store.newExpense = {
  payer: "Alice",
  amount: "50",
  description: "Dinner",
};
store.addExpense();
```

##### `removeExpense(id: number): void`

Removes an expense by ID.

**Parameters:**

- `id`: The unique identifier of the expense to remove

##### `calculateBalances(expenses: Expense[], participants: string[]): Record<string, number>`

Calculates net balance for each participant.

**Algorithm:**

1. Initialize all balances to 0
2. For each expense:
   - Divide amount equally among all participants
   - Subtract share from each participant's balance
   - Add full amount to payer's balance

**Returns:** Object mapping participant names to their net balance

**Example:**

```typescript
const balances = store.calculateBalances(expenses, ["Alice", "Bob", "Charlie"]);
// { Alice: 30, Bob: 0, Charlie: -30 }
```

##### `calculateSettlements(): void`

Generates optimal settlement plan using greedy algorithm.

**Algorithm:**

1. Calculate balances for all participants
2. Separate into debtors (negative balance) and creditors (positive balance)
3. Sort both arrays by amount (descending)
4. Match largest debtor with largest creditor
5. Create transfer for the minimum of the two amounts
6. Repeat until all balances are settled

**Updates:** `settlements` array with `Transfer` objects

**Example:**

```typescript
store.calculateSettlements();
// settlements = [{ from: 'Charlie', to: 'Alice', amount: 30 }]
```

##### `roundAmount(amount: number): number`

Rounds amount to 2 decimal places.

**Example:**

```typescript
store.roundAmount(10.666); // returns 10.67
```

---

## Type Definitions

### Expense

```typescript
interface Expense {
  id: number; // Unique identifier (timestamp)
  payer: string; // Name of person who paid
  amount: number; // Amount paid
  description: string; // Optional description
  timestamp: number; // Creation timestamp
}
```

### Transfer

```typescript
interface Transfer {
  from: string; // Person who owes money
  to: string; // Person who should receive money
  amount: number; // Amount to transfer
}
```

### Balance

```typescript
interface Balance {
  person: string; // Participant name
  amount: number; // Balance amount
}
```

### ParticipantStats

```typescript
interface ParticipantStats {
  totalPaid: number; // Total amount paid
  totalOwed: number; // Total amount owed to others
  netBalance: number; // Net balance
  numberOfExpenses: number; // Number of expenses paid
  averageExpense: number; // Average expense amount
}
```

### Participant

```typescript
interface Participant {
  id: number; // Unique identifier
  name: string; // Participant name
}
```

---

## Component Props

### ExpenseForm

No props - uses store state directly

### ExpenseList

No props - uses store state directly

### ExpenseResult

No props - uses store state directly

### ParticipantForm

No props - uses store state directly

### ParticipantList

No props - uses store state directly

### ParticipantStats

No props - uses store state directly

---

## Events

All state changes are handled through Pinia stores. Components don't emit custom events as they directly mutate store state through actions.
