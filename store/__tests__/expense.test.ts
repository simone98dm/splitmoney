import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import { useExpenseSplitterStore } from "../expense";
import { useParticipantsStore } from "../participant";

describe("ExpenseSplitter Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const participantStore = useParticipantsStore();
    // Setup initial participants
    participantStore.participants = ["Alice", "Bob"];
  });

  describe("Initial State", () => {
    it("should have empty initial state", () => {
      const store = useExpenseSplitterStore();
      expect(store.expenses).toEqual([]);
      expect(store.settlements).toEqual([]);
      expect(store.hasExpenses).toBe(false);
      expect(store.totalExpenses).toBe(0);
    });

    it("should initialize newExpense with first participant", () => {
      const store = useExpenseSplitterStore();
      expect(store.newExpense).toEqual({
        payer: "Alice",
        amount: "",
        description: "",
      });
    });
  });

  describe("Expense Management", () => {
    it("should add a new expense", () => {
      const store = useExpenseSplitterStore();
      store.newExpense = {
        payer: "Alice",
        amount: "50",
        description: "Groceries",
      };

      store.addExpense();

      expect(store.expenses).toHaveLength(1);
      expect(store.expenses[0]).toMatchObject({
        payer: "Alice",
        amount: 50,
        description: "Groceries",
      });
      expect(store.hasExpenses).toBe(true);
      expect(store.totalExpenses).toBe(50);
    });

    it("should not add expense with missing amount", () => {
      const store = useExpenseSplitterStore();
      store.newExpense = {
        payer: "Alice",
        amount: "",
        description: "Groceries",
      };

      store.addExpense();

      expect(store.expenses).toHaveLength(0);
    });

    it("should remove an expense", () => {
      const store = useExpenseSplitterStore();
      store.newExpense = {
        payer: "Alice",
        amount: "50",
        description: "Groceries",
      };
      store.addExpense();
      const expenseId = store.expenses[0].id;

      store.removeExpense(expenseId);

      expect(store.expenses).toHaveLength(0);
      expect(store.settlements).toHaveLength(0);
    });
  });

  describe("Balance Calculations", () => {
    it("should calculate correct balances", () => {
      const store = useExpenseSplitterStore();
      const expenses = [
        {
          id: 1,
          payer: "Alice",
          amount: 100,
          description: "Test",
          timestamp: Date.now(),
        },
      ];
      const participants = ["Alice", "Bob"];

      const balances = store.calculateBalances(expenses, participants);

      expect(balances["Alice"]).toBe(50);
      expect(balances["Bob"]).toBe(-50);
    });

    it("should round amounts correctly", () => {
      const store = useExpenseSplitterStore();
      expect(store.roundAmount(10.125)).toBe(10.13);
      expect(store.roundAmount(10.124)).toBe(10.12);
    });
  });

  describe("Settlement Calculations", () => {
    it("should calculate correct settlements", () => {
      const store = useExpenseSplitterStore();
      store.newExpense = {
        payer: "Alice",
        amount: "100",
        description: "Test",
      };
      store.addExpense();

      store.calculateSettlements();

      expect(store.settlements).toHaveLength(1);
      expect(store.settlements[0]).toEqual({
        from: "Bob",
        to: "Alice",
        amount: 50,
      });
    });

    it("should calculate correct balances for multiple expenses", () => {
      const store = useExpenseSplitterStore();
      const participantStore = useParticipantsStore();

      participantStore.participants = ["Alice", "Bob"];

      const expenses = [
        {
          id: 1,
          payer: "Alice",
          amount: 100,
          description: "First",
          timestamp: Date.now(),
        },
        {
          id: 2,
          payer: "Bob",
          amount: 60,
          description: "Second",
          timestamp: Date.now(),
        },
      ];

      const balances = store.calculateBalances(expenses, ["Alice", "Bob"]);

      expect(balances["Alice"]).toBe(20);
      expect(balances["Bob"]).toBe(-20);
    });

    it("should handle two-person expense split correctly", () => {
      const store = useExpenseSplitterStore();
      const participantStore = useParticipantsStore();

      // Setup participants
      participantStore.participants = ["Alice", "Bob"];

      // Add Alice's expense
      store.newExpense = {
        payer: "Alice",
        amount: "100",
        description: "First payment",
      };
      store.addExpense();

      // Add Bob's expense
      store.newExpense = {
        payer: "Bob",
        amount: "60",
        description: "Second payment",
      };
      store.addExpense();

      // Calculate settlements
      store.calculateSettlements();

      // Verify results
      expect(store.settlements).toHaveLength(1);
      expect(store.settlements[0]).toEqual({
        from: "Bob",
        to: "Alice",
        amount: 20,
      });
    });
  });
});
