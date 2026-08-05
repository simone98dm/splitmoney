# SplitMoney 💰

A modern, intuitive expense splitting application built with Nuxt 3 and Pinia. Designed to help groups of friends, roommates, or colleagues easily track shared expenses and calculate who owes whom.

[![Nuxt 3](https://img.shields.io/badge/Nuxt-3.15.4-00DC82?logo=nuxt.js)](https://nuxt.com/)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## ✨ Features

- **👥 Participant Management**: Add, edit, and remove participants with validation
- **💸 Expense Tracking**: Record expenses with payer, amount, and description
- **📊 Balance Calculation**: Automatic calculation of individual balances
- **🔄 Smart Settlement**: Generates optimal payment plans to settle debts with minimum transactions
- **📈 Statistics**: View detailed stats for each participant (total paid, owed, net balance)
- **💾 Local Storage**: Automatically saves participants between sessions
- **📱 Responsive Design**: Works seamlessly on mobile and desktop
- **🎨 Modern UI**: Clean interface built with TailwindCSS
- **🧪 Tested**: Comprehensive test coverage with Vitest

## 🚀 Tech Stack

- **[Nuxt 3](https://nuxt.com/)** - Vue.js meta-framework for production-ready apps
- **[Vue 3](https://vuejs.org/)** - Progressive JavaScript framework
- **[Pinia](https://pinia.vuejs.org/)** - Intuitive, type-safe state management
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Vitest](https://vitest.dev/)** - Fast unit testing framework

## 📋 Prerequisites

- **Node.js** v16 or later
- **Yarn** 1.22.22 or later (or npm)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/simone98dm/splitmoney.git

# Navigate to project directory
cd splitmoney

# Install dependencies
yarn install

# Start development server
yarn dev
```

The application will be available at `http://localhost:3000`

## 📦 Available Scripts

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Generate static site
yarn generate

# Run tests
yarn test

# Run tests with UI
yarn test:ui

# Run tests with coverage
yarn test:coverage
```

## 🎯 Core Concepts

### State Management

The application uses two main Pinia stores:

#### Participant Store (`store/participant.ts`)

- Manages participant list with localStorage persistence
- Provides validation for participant names (unique, max 20 chars)
- Supports CRUD operations: add, edit, remove participants
- Calculates individual statistics per participant
- Prevents removal of participants with existing expenses

#### Expense Store (`store/expense.ts`)

- Manages expense list and calculations
- Calculates total expenses and individual balances
- Generates settlement plans with a two-pass heuristic (exact pairing, then greedy)
- Minimizes the number of transactions needed to settle debts
- Works entirely in integer cents, so the balance sheet always sums to zero
- Persists expenses and participants to `localStorage`, validated on the way back in

### Type Definitions

```typescript
interface Expense {
  id: string;
  payer: string;
  amount: number;
  description: string;
  participants: string[]; // frozen snapshot: later roster changes never re-split it
  timestamp: number;
}

interface Transfer {
  from: string;
  to: string;
  amount: number;
}

interface ParticipantStats {
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
  numberOfExpenses: number;
  averageExpense: number;
}
```

## 🔧 How It Works

### Balance Calculation Algorithm

1. **Calculate Individual Balances**: For each expense, the amount is divided equally among all participants
2. **Identify Debtors and Creditors**: Participants with negative balance owe money; positive balance means they should receive money
3. **Optimize Settlements**: Uses a greedy algorithm to minimize the number of transactions:
   - Sort debtors and creditors by amount
   - Match the largest debtor with the largest creditor
   - Create transactions until all balances are settled

### Example

If three friends (Alice, Bob, Charlie) share expenses:

- Alice pays €60
- Bob pays €30
- Total: €90 → Each person's share: €30

**Balances:**

- Alice: +€30 (paid €60, owes €30)
- Bob: €0 (paid €30, owes €30)
- Charlie: -€30 (paid €0, owes €30)

**Settlement:** Charlie pays €30 to Alice

## 📱 Usage Guide

### Adding Participants

1. Enter a participant name in the input field (max 20 characters)
2. Click "Aggiungi" button
3. Participants are automatically saved to localStorage

### Recording Expenses

1. Select who paid from the dropdown
2. Enter the amount
3. Optionally add a description
4. Click "Aggiungi Spesa"

### Viewing Results

1. Individual balances are displayed for each participant
2. Click "Calcola Divisione" to generate the settlement plan
3. The app shows the minimum number of transfers needed to settle all debts

### Managing Data

- **Edit Participant**: Click edit icon next to participant name
- **Remove Participant**: Only possible if they have no recorded expenses
- **Remove Expense**: Click delete icon next to any expense

## 🧪 Testing

The project includes comprehensive unit tests for the expense store:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage report
yarn test --coverage

# Run tests with UI interface
yarn test:ui
```

Tests cover:

- Expense addition and removal
- Balance calculation logic
- Settlement algorithm accuracy
- Edge cases and rounding

### TypeScript

Strict type checking enabled for better code quality and developer experience.

## 🚧 Development

### Code Structure

- **Composition API**: Uses Vue 3 Composition API with `<script setup>`
- **TypeScript**: Fully typed with interfaces for all data structures
- **Reactive State**: Uses `ref` and `computed` for reactive data
- **Store Composition**: Uses `storeToRefs` for reactive store properties

### Best Practices

- Components are small and focused on single responsibilities
- Business logic is separated into stores
- Validation logic is centralized in stores
- Type safety throughout the application

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style and conventions
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Simone Dal Mas**

- Website: [simone98dm.dev](https://simone98dm.dev)
- GitHub: [@simone98dm](https://github.com/simone98dm)

## 🙏 Acknowledgments

- Built with [Nuxt 3](https://nuxt.com/)
- State management by [Pinia](https://pinia.vuejs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Tested with [Vitest](https://vitest.dev/)

---

Made with ❤️ by [simone98dm](https://simone98dm.dev)
