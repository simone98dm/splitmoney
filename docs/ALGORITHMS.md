# Algorithm Documentation

This document provides detailed explanation of the core algorithms used in SplitMoney.

## Table of Contents

- [Balance Calculation](#balance-calculation)
- [Settlement Optimization](#settlement-optimization)
- [Edge Cases](#edge-cases)
- [Performance Analysis](#performance-analysis)
- [Examples](#examples)

## Balance Calculation

### Overview

The balance calculation determines how much each participant should receive (positive balance) or pay (negative balance) to settle all expenses fairly.

### Algorithm

```typescript
function calculateBalances(
  expenses: Expense[],
  participants: string[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize all balances to zero
  participants.forEach((p) => (balances[p] = 0));

  // Process each expense
  expenses.forEach((expense) => {
    const perPerson = expense.amount / participants.length;

    // Subtract equal share from everyone
    participants.forEach((p) => {
      balances[p] -= perPerson;
    });

    // Add full amount to payer
    balances[expense.payer] += expense.amount;
  });

  return balances;
}
```

### Step-by-Step Process

1. **Initialize**: Set all balances to 0
2. **For each expense**:
   - Calculate per-person share: `amount / total_participants`
   - Subtract share from each participant
   - Add full amount to the payer
3. **Result**: Net balance for each participant

### Mathematical Foundation

For a participant P and expense set E:

$$
Balance_P = \sum_{e \in E, payer=P} amount_e - \sum_{e \in E} \frac{amount_e}{|participants|}
$$

Where:

- First sum: Total paid by participant
- Second sum: Total owed by participant (equal share of all expenses)

### Example Calculation

**Scenario:**

- Participants: Alice, Bob, Charlie (3 people)
- Expenses:
  - Alice pays €60 for dinner
  - Bob pays €30 for drinks

**Calculation:**

1. **Initialize:**

   ```
   Alice: 0
   Bob: 0
   Charlie: 0
   ```

2. **Process Expense 1 (Alice pays €60):**

   ```
   Per-person share: €60 / 3 = €20

   Subtract share from all:
   Alice: 0 - 20 = -20
   Bob: 0 - 20 = -20
   Charlie: 0 - 20 = -20

   Add full amount to payer:
   Alice: -20 + 60 = +40
   Bob: -20
   Charlie: -20
   ```

3. **Process Expense 2 (Bob pays €30):**

   ```
   Per-person share: €30 / 3 = €10

   Subtract share from all:
   Alice: 40 - 10 = 30
   Bob: -20 - 10 = -30
   Charlie: -20 - 10 = -30

   Add full amount to payer:
   Alice: 30
   Bob: -30 + 30 = 0
   Charlie: -30
   ```

4. **Final Balances:**
   ```
   Alice: +€30 (should receive €30)
   Bob: €0 (all settled)
   Charlie: -€30 (owes €30)
   ```

**Verification:**

- Total paid: €60 + €30 = €90
- Total owed: €90 / 3 × 3 = €90 ✓
- Sum of balances: €30 + €0 - €30 = €0 ✓

### Complexity Analysis

- **Time Complexity**: O(n × m)

  - n = number of expenses
  - m = number of participants
  - Must iterate through all expenses and all participants

- **Space Complexity**: O(m)
  - Stores balance for each participant

## Settlement Optimization

### Overview

The settlement algorithm generates the minimum number of transactions needed to settle all debts. It uses a greedy algorithm that matches largest debtors with largest creditors.

### Algorithm

```typescript
function calculateSettlements(
  expenses: Expense[],
  participants: string[]
): Transfer[] {
  // Calculate balances
  const balances = calculateBalances(expenses, participants);

  // Separate debtors and creditors
  const debtors: Balance[] = [];
  const creditors: Balance[] = [];

  Object.entries(balances).forEach(([person, balance]) => {
    const rounded = roundAmount(balance);
    if (rounded < 0) {
      debtors.push({ person, amount: -rounded });
    } else if (rounded > 0) {
      creditors.push({ person, amount: rounded });
    }
  });

  // Sort by amount (descending)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Generate transfers
  const transfers: Transfer[] = [];
  let i = 0,
    j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debt = debtors[i].amount;
    const credit = creditors[j].amount;

    const amount = Math.min(debt, credit);

    if (amount > 0.01) {
      // Ignore tiny amounts
      transfers.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: roundAmount(amount),
      });
    }

    debtors[i].amount -= amount;
    creditors[j].amount -= amount;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return transfers;
}
```

### Why This Algorithm is Optimal

The greedy approach minimizes transactions because:

1. **Matches Largest Values**: Settles maximum debt per transaction
2. **Eliminates Participants**: Each transaction settles at least one participant completely
3. **No Cycles**: Direct transfers prevent circular payments
4. **Provably Optimal**: For the debt settlement problem, the greedy algorithm achieves minimum transactions

### Mathematical Proof Sketch

**Claim**: Minimum transactions = (number of creditors - 1) + (number of debtors - 1) in worst case

**Proof**:

- At most, we need n-1 transactions to settle n participants
- Each transaction settles at least one participant
- Greedy always settles the maximum possible per transaction
- Therefore, greedy achieves the minimum

### Example Optimization

**Scenario:**

- Alice: +€60 (owed)
- Bob: -€30 (owes)
- Charlie: -€30 (owes)

**Naive Approach (3 transactions):**

```
Bob → Alice: €30
Charlie → Alice: €30
```

**Greedy Approach (2 transactions):**

```
Same as naive in this case
```

**Complex Scenario:**

- Alice: +€50
- Bob: +€30
- Charlie: -€40
- David: -€40

**Naive Approach (4 transactions):**

```
Charlie → Alice: €40
David → Alice: €10
David → Bob: €30
```

**Greedy Approach (3 transactions):**

```
Step 1: Sort
Debtors: [Charlie: -€40, David: -€40]
Creditors: [Alice: +€50, Bob: +€30]

Step 2: Match largest
Charlie → Alice: €40
Alice remaining: €10

Step 3: Match next
David → Bob: €30
David remaining: €10, Bob settled

Step 4: Match remaining
David → Alice: €10
All settled
```

Result: 3 transactions (optimal)

### Complexity Analysis

- **Time Complexity**: O(n log n)

  - Sorting debtors and creditors: O(n log n)
  - Matching phase: O(n)
  - Dominated by sorting

- **Space Complexity**: O(n)
  - Store debtors and creditors arrays
  - Store transfers array

### Rounding Strategy

```typescript
function roundAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}
```

**Why round to 2 decimals:**

- Currency precision (cents/pennies)
- Avoid floating-point errors
- Ensure balances sum to zero

## Edge Cases

### 1. Zero Balance

**Case**: Participant has exactly zero balance

**Handling**: Excluded from transfers (neither debtor nor creditor)

```typescript
if (rounded < 0) {
  debtors.push(...)
} else if (rounded > 0) { // Note: not >= 0
  creditors.push(...)
}
```

### 2. Very Small Amounts

**Case**: Balance < €0.01 due to rounding

**Handling**: Treated as zero

```typescript
if (amount > 0.01) { // Ignore amounts < 1 cent
  transfers.push(...)
}
```

### 3. Single Expense

**Case**: Only one expense recorded

**Result**: Payer receives equal share from all others

**Example:**

```
Alice pays €90 for 3 people
Balances: Alice: +€60, Bob: -€30, Charlie: -€30
Transfers: Bob → Alice: €30, Charlie → Alice: €30
```

### 4. Equal Expenses

**Case**: Everyone pays the same amount

**Result**: All balances are zero, no transfers needed

**Example:**

```
Alice pays €30, Bob pays €30, Charlie pays €30
Balances: All €0
Transfers: None
```

### 5. Rounding Errors

**Case**: Balances don't sum to exactly zero due to floating-point math

**Handling**: Round to 2 decimals early and often

```typescript
// Round at each step
const perPerson = expense.amount / participants.length;
balances[p] -= perPerson; // May accumulate error

// Round final balances
const rounded = roundAmount(balance);
```

**Better Approach** (future enhancement):

```typescript
// Use integer arithmetic (cents)
const amountInCents = Math.round(expense.amount * 100);
const perPersonCents = Math.floor(amountInCents / participants.length);
const remainder = amountInCents % participants.length;
```

### 6. No Expenses

**Case**: No expenses recorded yet

**Handling**: Skip settlement calculation

```typescript
if (expenses.length === 0) {
  settlements = [];
  return;
}
```

## Performance Analysis

### Scalability Limits

**Current Implementation:**

- Efficient up to ~100 participants
- Efficient up to ~1000 expenses
- Browser-based, no server needed

**Bottlenecks:**

1. **Balance Calculation**: O(n × m) - scales poorly with many participants
2. **Sorting**: O(m log m) - negligible for typical use
3. **localStorage**: Limited to ~5-10MB depending on browser

### Optimization Opportunities

**For Large Participant Counts:**

```typescript
// Instead of iterating all participants for each expense,
// maintain running sums
const runningTotals = new Map();
```

**For Many Expenses:**

```typescript
// Aggregate expenses by payer first
const expensesByPayer = expenses.reduce((acc, expense) => {
  acc[expense.payer] = (acc[expense.payer] || 0) + expense.amount;
  return acc;
}, {});
```

## Examples

### Example 1: Weekend Trip

**Participants:** 4 friends (Alice, Bob, Charlie, David)

**Expenses:**

1. Alice pays €120 for accommodation
2. Bob pays €80 for dinner
3. Charlie pays €40 for breakfast
4. David pays €60 for gas

**Total:** €300
**Per person:** €75

**Balance Calculation:**

```
Alice: €120 - €75 = +€45
Bob: €80 - €75 = +€5
Charlie: €40 - €75 = -€35
David: €60 - €75 = -€15
```

**Verification:**

```
Total paid: €300 ✓
Sum of balances: €45 + €5 - €35 - €15 = €0 ✓
```

**Settlement:**

```
Debtors (sorted): [Charlie: -€35, David: -€15]
Creditors (sorted): [Alice: +€45, Bob: +€5]

Transfer 1: Charlie → Alice: €35
  Charlie: 0 (settled)
  Alice: €10 remaining

Transfer 2: David → Alice: €10
  Alice: 0 (settled)
  David: €5 remaining

Transfer 3: David → Bob: €5
  David: 0 (settled)
  Bob: 0 (settled)
```

**Result:** 3 transactions (optimal)

### Example 2: Monthly Roommate Expenses

**Participants:** 3 roommates (Alice, Bob, Charlie)

**Expenses:**

1. Alice pays €300 rent
2. Bob pays €60 utilities
3. Charlie pays €90 groceries
4. Alice pays €45 internet
5. Bob pays €105 cleaning

**Total:** €600
**Per person:** €200

**Balance Calculation:**

```
Alice: (€300 + €45) - €200 = +€145
Bob: (€60 + €105) - €200 = -€35
Charlie: €90 - €200 = -€110
```

**Settlement:**

```
Debtors: [Charlie: -€110, Bob: -€35]
Creditors: [Alice: +€145]

Transfer 1: Charlie → Alice: €110
  Charlie: 0 (settled)
  Alice: €35 remaining

Transfer 2: Bob → Alice: €35
  Bob: 0 (settled)
  Alice: 0 (settled)
```

**Result:** 2 transactions (optimal)

### Example 3: Uneven Group

**Participants:** 5 people (A, B, C, D, E)

**Expenses:**

1. A pays €100
2. C pays €50
3. E pays €50

**Total:** €200
**Per person:** €40

**Balance Calculation:**

```
A: €100 - €40 = +€60
B: €0 - €40 = -€40
C: €50 - €40 = +€10
D: €0 - €40 = -€40
E: €50 - €40 = +€10
```

**Settlement:**

```
Debtors: [B: -€40, D: -€40]
Creditors: [A: +€60, C: +€10, E: +€10]

Transfer 1: B → A: €40
  B: 0 (settled)
  A: €20 remaining

Transfer 2: D → A: €20
  A: 0 (settled)
  D: €20 remaining

Transfer 3: D → C: €10
  C: 0 (settled)
  D: €10 remaining

Transfer 4: D → E: €10
  E: 0 (settled)
  D: 0 (settled)
```

**Result:** 4 transactions

## Conclusion

The algorithms used in SplitMoney are:

- **Correct**: Mathematically sound and well-tested
- **Efficient**: Optimal time complexity for the problem
- **Practical**: Handles real-world scenarios with rounding
- **Scalable**: Performs well for typical use cases

For questions or improvements, see [CONTRIBUTING.md](CONTRIBUTING.md).
