# SplitMoney

A simple expense splitting application built with Nuxt 3 and Pinia to help groups track and settle shared expenses.

## Features

- Add and manage participants
- Track group expenses
- Calculate individual balances
- Generate optimal settlement plans
- Responsive design for mobile and desktop

## Tech Stack

- [Nuxt 3](https://nuxt.com/) - Vue.js Framework
- [Pinia](https://pinia.vuejs.org/) - State Management
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [Vitest](https://vitest.dev/) - Testing Framework

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/splitmoney.git

# Navigate to project directory
cd splitmoney

# Install dependencies
yarn install

# Start development server
yarn dev
```

## Project Structure

```
splitmoney/
├── components/          # Vue components
│   └── participant/     # Participant-related components
├── store/              # Pinia stores
│   ├── expense.ts      # Expense management
│   └── participant.ts  # Participant management
├── types/              # TypeScript type definitions
├── __tests__/         # Test files
└── ...
```

## Usage

1. Add participants to your group
2. Record expenses, specifying who paid and the amount
3. View the calculated balances
4. Use the generated settlement plan to settle debts

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
