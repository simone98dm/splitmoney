# Architecture Documentation

## Overview

SplitMoney is built as a Single Page Application (SPA) using Nuxt 3 with client-side rendering. The architecture follows Vue 3's Composition API patterns and uses Pinia for centralized state management.

## Application Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌───────────────────────────────────────────┐  │
│  │          Nuxt 3 Application               │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │       App.vue (Root)                │  │  │
│  │  │  ┌───────────────────────────────┐  │  │  │
│  │  │  │   ExpenseSplitter.vue         │  │  │  │
│  │  │  │  ┌─────────────────────────┐  │  │  │  │
│  │  │  │  │  ParticipantPanel.vue   │  │  │  │  │
│  │  │  │  │  ExpensePanel.vue       │  │  │  │  │
│  │  │  │  └─────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │      Pinia Store Layer              │  │  │
│  │  │  ┌────────────┐  ┌──────────────┐  │  │  │
│  │  │  │Participant │  │   Expense    │  │  │  │
│  │  │  │   Store    │◄─┤    Store     │  │  │  │
│  │  │  └────────────┘  └──────────────┘  │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  │                                             │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │       Browser Storage               │  │  │
│  │  │         localStorage                │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## Directory Structure

### `/components`

Vue components organized by feature:

- **`/expense`**: Expense management components

  - `ExpenseForm.vue`: Input form for adding expenses
  - `ExpenseList.vue`: Display and manage expense list
  - `ExpensePanel.vue`: Container component
  - `ExpenseResult.vue`: Settlement calculation display

- **`/participant`**: Participant management components
  - `ParticipantForm.vue`: Input form for adding participants
  - `ParticipantList.vue`: Display and manage participant list
  - `ParticipantPanel.vue`: Container component
  - `ParticipantStats.vue`: Individual statistics display

### `/store`

Pinia stores for state management:

- **`participant.ts`**: Participant management logic

  - CRUD operations for participants
  - Name validation
  - Statistics calculation
  - localStorage persistence

- **`expense.ts`**: Expense and settlement logic
  - Expense tracking
  - Balance calculation algorithm
  - Settlement optimization
  - Cross-references participant store

### `/types`

TypeScript type definitions:

- Core interfaces and types
- Ensures type safety across the application

### `/public`

Static assets:

- Favicons and app icons
- PWA manifest
- robots.txt

## State Management

### Store Architecture

```
┌──────────────────────────────────────────┐
│        useParticipantsStore()            │
│  ┌────────────────────────────────────┐  │
│  │  State                             │  │
│  │  - participants: string[]          │  │
│  │  - newParticipant: string          │  │
│  │  - participantError: string        │  │
│  │  - editingParticipant: object      │  │
│  │  - showRemoveConfirm: string       │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Actions                           │  │
│  │  - addParticipant()                │  │
│  │  - removeParticipant()             │  │
│  │  - editParticipant()               │  │
│  │  - calculateStats()                │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Persistence                       │  │
│  │  - localStorage sync               │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                    ▲
                    │ References
                    │
┌──────────────────────────────────────────┐
│      useExpenseSplitterStore()           │
│  ┌────────────────────────────────────┐  │
│  │  State                             │  │
│  │  - expenses: Expense[]             │  │
│  │  - newExpense: object              │  │
│  │  - expenseError: string            │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Computed (derived, never stored)  │  │
│  │  - balances                        │  │
│  │  - settlements                     │  │
│  │  - settlementError                 │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │  Actions                           │  │
│  │  - addExpense()                    │  │
│  │  - removeExpense()                 │  │
│  │  - commitRename()                  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                    │ uses
                    ▼
┌──────────────────────────────────────────┐
│  Pure modules (no Vue, no Pinia)         │
│  - store/money.ts       integer cents    │
│  - store/balance.ts     balance sheet    │
│  - store/settlement.ts  payment plan     │
│  - store/storage.ts     vetted I/O       │
└──────────────────────────────────────────┘
```

Both stores persist to `localStorage` through `store/storage.ts`, which treats
everything read back as untrusted. Expenses and participants live under
separate keys, so one being cleared or corrupted never takes the other down —
an expense whose payer is no longer on the roster still keeps their money.

The money logic is deliberately outside the stores: it is pure, unit-tested on
its own, and cannot be broken by a reactivity mistake.

### Data Flow

1. **User Input** → Component
2. Component → **Store Action**
3. Store Action → **State Mutation**
4. State Mutation → **Computed Properties Update**
5. Computed Properties → **Component Re-render**

### Reactivity

- Uses Vue 3's `ref` and `computed` for reactive state
- `storeToRefs` ensures reactivity when extracting store values
- Automatic localStorage synchronization for participants

## Component Communication

### Pattern: Props Down, Events Up (Modified)

Since we're using Pinia stores, the pattern is simplified:

1. **No Props**: Components access store state directly
2. **No Custom Events**: Components call store actions directly
3. **Centralized State**: All shared state lives in stores

### Example Flow

```typescript
// Component reads from store
const { participants } = storeToRefs(useParticipantsStore());

// Component calls store action
const { addParticipant } = useParticipantsStore();
addParticipant();

// Store updates state
// All components observing that state automatically update
```

## Algorithm Design

### Balance Calculation

**Complexity:** O(n × m) where n = expenses, m = participants

```
For each expense:
  1. Calculate per-person share: amount / totalParticipants
  2. Subtract share from each participant's balance
  3. Add full amount to payer's balance

Result: Each participant's net balance
```

**Example:**

```
Participants: Alice, Bob, Charlie
Expense: Alice pays €90

Step 1: Per-person share = €90 / 3 = €30
Step 2:
  - Alice: 0 - 30 = -30
  - Bob: 0 - 30 = -30
  - Charlie: 0 - 30 = -30
Step 3:
  - Alice: -30 + 90 = +60
  - Bob: -30
  - Charlie: -30

Net balances:
  - Alice: +€60 (should receive)
  - Bob: -€30 (owes)
  - Charlie: -€30 (owes)
```

### Settlement Optimization (Greedy Algorithm)

**Complexity:** O(n log n) where n = participants

```
1. Separate participants into:
   - Debtors (negative balance)
   - Creditors (positive balance)

2. Sort both arrays by absolute amount (descending)

3. While debtors and creditors exist:
   a. Match largest debtor with largest creditor
   b. Transfer amount = min(debtor_amount, creditor_amount)
   c. Create transfer record
   d. Update balances
   e. Remove settled participants

Result: Minimum number of transactions to settle all debts
```

**Why it's optimal:**

- Matches largest amounts first
- Reduces number of transactions
- Settles accounts completely when possible

**Example:**

```
Before:
Debtors: Bob (-€30), Charlie (-€30)
Creditors: Alice (+€60)

Step 1: Bob → Alice: €30
  Bob: 0 (settled)
  Alice: €30

Step 2: Charlie → Alice: €30
  Charlie: 0 (settled)
  Alice: 0 (settled)

Result: 2 transactions instead of potential 3+
```

## Data Persistence

### LocalStorage Strategy

**Stored Data:**

- Participants list (automatically saved on changes)

**Not Stored:**

- Expenses (session-based)
- Settlements (calculated on demand)

**Rationale:**

- Participants are likely reused across sessions
- Expenses are typically session-specific
- Reduces storage footprint
- Avoids stale data issues

### Implementation

```typescript
// Save to localStorage
const _saveIntoMemory = () => {
  localStorage.setItem("participants", JSON.stringify(participants.value));
};

// Load from localStorage (on store initialization)
const participants = toRef<string[]>(
  JSON.parse(localStorage.getItem("participants") || '["A", "B", "C"]')
);
```

## Performance Considerations

### Optimizations

1. **Computed Properties**: Only recalculate when dependencies change
2. **Minimal Re-renders**: Precise reactivity reduces unnecessary updates
3. **Client-Side Only**: No server round-trips (SSR disabled)
4. **Lazy Calculations**: Settlements calculated only when requested

### Scalability Limits

**Current Design Suitable For:**

- Up to ~20 participants
- Up to ~100 expenses
- Browser localStorage limits

**Beyond These Limits:**

- Consider backend storage
- Implement pagination
- Add data archiving

## Testing Strategy

### Unit Tests (Vitest)

**Coverage:**

- Store actions and getters
- Balance calculation algorithm
- Settlement optimization
- Edge cases (rounding, zero amounts)

**Test Environment:**

- `happy-dom` for lightweight DOM simulation
- Isolated store instances per test
- Mock localStorage

### Test Structure

```typescript
describe('ExpenseSplitterStore', () => {
  beforeEach(() => {
    // Create fresh store instance
    setActivePinia(createPinia())
  })

  it('calculates balances correctly', () => {
    // Arrange
    const store = useExpenseSplitterStore()

    // Act
    // ... add expenses ...

    // Assert
    expect(store.calculateBalances(...)).toEqual(...)
  })
})
```

## Security Considerations

### Client-Side Security

- **No Sensitive Data**: Application doesn't handle payment information
- **Input Validation**: Participant names validated (length, uniqueness)
- **Amount Validation**: Numbers only, proper parsing
- **localStorage**: Only stores non-sensitive participant names

### Future Enhancements

If adding backend/auth:

- HTTPS only
- Authentication tokens
- Rate limiting
- Input sanitization
- CSRF protection

## Build & Deployment

### Build Process

```bash
# Development
yarn dev        # Nuxt dev server with HMR

# Production
yarn build      # Creates optimized .output/ directory
yarn preview    # Preview production build locally

# Static Generation
yarn generate   # Creates static site in .output/public/
```

### Deployment Options

**Static Hosting (Recommended):**

- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages

**Requirements:**

- Node.js 16+ for build process
- Static hosting (no server needed)
- HTTPS recommended for PWA features

### Environment Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false, // Client-side only
  // ... other config
});
```

## Future Architecture Considerations

### Potential Enhancements

1. **Backend Integration**

   - User accounts
   - Expense history
   - Group sharing
   - Real-time sync

2. **Mobile App**

   - Capacitor/Ionic wrapper
   - Native mobile features
   - Offline-first design

3. **Advanced Features**

   - Currency conversion
   - Receipt scanning
   - Export to CSV/PDF
   - Analytics dashboard

4. **Scalability**
   - Database storage
   - API layer
   - Caching strategy
   - CDN integration
