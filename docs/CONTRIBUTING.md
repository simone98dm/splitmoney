# Contributing to SplitMoney

First off, thank you for considering contributing to SplitMoney! It's people like you that make SplitMoney such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by common sense and respect. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**

- Browser [e.g. Chrome, Safari]
- Version [e.g. 22]
- OS [e.g. iOS, Windows]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include examples of how the feature would work**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards below
3. **Add tests** if you've added code that should be tested
4. **Ensure tests pass** by running `yarn test`
5. **Update documentation** if needed
6. **Commit your changes** using clear commit messages
7. **Push to your fork** and submit a pull request

## Development Process

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/splitmoney.git
cd splitmoney

# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test
```

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

**Examples:**

- `feature/add-currency-support`
- `fix/balance-calculation-rounding`
- `docs/update-api-reference`

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(expense): add currency conversion support

Add ability to handle multiple currencies with automatic conversion
using exchange rates API.

Closes #123
```

```
fix(balance): correct rounding in settlement calculation

Previous implementation could result in balances not summing to zero
due to floating point precision issues.
```

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define types** for all data structures
- **Avoid `any`** type unless absolutely necessary
- **Use interfaces** for object shapes

```typescript
// Good
interface Expense {
  id: string;
  amount: number;
}

// Avoid
const expense: any = { id: 1, amount: 50 };
```

### Vue Components

- **Use Composition API** with `<script setup>`
- **Extract complex logic** to composables or stores
- **Keep components small** and focused
- **Use TypeScript** in script sections

```vue
<!-- Good -->
<script setup lang="ts">
import { computed } from "vue";
import { useExpenseSplitterStore } from "~/store/expense";

const store = useExpenseSplitterStore();
const total = computed(() => store.totalExpenses);
</script>
```

### Pinia Stores

- **Use Composition API** style stores
- **Export typed composables** from stores
- **Keep actions pure** when possible
- **Document complex logic**

```typescript
export const useMyStore = defineStore("myStore", () => {
  // State
  const count = ref(0);

  // Getters
  const doubleCount = computed(() => count.value * 2);

  // Actions
  const increment = () => {
    count.value++;
  };

  return { count, doubleCount, increment };
});
```

### CSS/Styling

- **Use TailwindCSS** utility classes
- **Follow mobile-first** approach
- **Maintain consistency** with existing styles
- **Avoid custom CSS** unless necessary

```vue
<!-- Good -->
<button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
  Click Me
</button>

<!-- Avoid -->
<button class="custom-button">Click Me</button>
<style scoped>
.custom-button {
  /* custom styles */
}
</style>
```

### Testing

- **Write tests** for all new features
- **Test edge cases** and error conditions
- **Use descriptive test names**
- **Follow AAA pattern**: Arrange, Act, Assert

```typescript
it("should calculate correct balance when single expense exists", () => {
  // Arrange
  const store = useExpenseSplitterStore();
  const participants = ["Alice", "Bob"];

  // Act
  store.addExpense({ payer: "Alice", amount: 100 });
  const balances = store.calculateBalances(store.expenses, participants);

  // Assert
  expect(balances.Alice).toBe(50);
  expect(balances.Bob).toBe(-50);
});
```

## Testing Guidelines

### Running Tests

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test --watch

# Run tests with coverage
yarn test --coverage

# Run tests with UI
yarn test:ui
```

### Test Coverage

Aim for:

- **80%+ coverage** for store logic
- **100% coverage** for calculation algorithms
- **Critical paths** must be tested

### What to Test

**Do test:**

- Store actions and mutations
- Computed properties
- Algorithm correctness
- Edge cases and error handling
- Validation logic

**Don't test:**

- Third-party libraries
- Vue/Nuxt internal behavior
- Simple getters/setters

## Documentation

### Code Documentation

- **Add JSDoc comments** for public methods
- **Document complex algorithms**
- **Explain "why" not "what"**

```typescript
/**
 * Turns a balance sheet into the payment plan that clears it.
 *
 * The exact minimum number of transfers is NP-hard, so this runs two passes:
 * exact pairing first (a debtor and creditor owing the same amount clear each
 * other in one transfer), then greedy largest-against-largest on the rest.
 *
 * @param balancesInCents - Net position per person, must sum to zero
 * @returns Transfers that settle every cent
 */
const settleDebts = (
  balancesInCents: Record<string, number>
): Transfer[] => {
  // Implementation
};
```

### README Updates

Update README.md if you:

- Add new features
- Change installation process
- Modify project structure
- Update dependencies

## Pull Request Process

1. **Ensure all tests pass**: `yarn test`
1. **Ensure types check**: `yarn typecheck`
2. **Update documentation** as needed
3. **Fill out PR template** completely
4. **Link related issues** using keywords (Closes #123)
5. **Request review** from maintainers
6. **Address review comments** promptly

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

## Code Review Guidelines

### For Reviewers

- **Be constructive** and respectful
- **Explain reasoning** for requested changes
- **Approve promptly** if changes are good
- **Test locally** when possible

### For Authors

- **Respond to all comments**
- **Don't take criticism personally**
- **Ask questions** if unclear
- **Update based on feedback**

## Release Process

_(For maintainers)_

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Build and deploy

## Questions?

Feel free to:

- Open an issue for discussion
- Contact the maintainer: [@simone98dm](https://github.com/simone98dm)
- Check existing documentation in `/docs`

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to SplitMoney! 🎉
