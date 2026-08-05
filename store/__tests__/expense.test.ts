import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExpenseSplitterStore } from "../expense";
import { useParticipantsStore } from "../participant";

const setup = (participants = ["Alice", "Bob"]) => {
  const participantStore = useParticipantsStore();
  participantStore.participants = participants;
  return { participantStore, store: useExpenseSplitterStore() };
};

const addExpense = (
  store: ReturnType<typeof useExpenseSplitterStore>,
  payer: string,
  amount: string,
  description = ""
) => {
  store.newExpense = { payer, amount, description };
  return store.addExpense();
};

describe("ExpenseSplitter Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("Initial State", () => {
    it("should have empty initial state", () => {
      const { store } = setup();
      expect(store.expenses).toEqual([]);
      expect(store.settlements).toEqual([]);
      expect(store.settlementError).toBe("");
      expect(store.hasExpenses).toBe(false);
      expect(store.totalExpenses).toBe(0);
    });

    it("should initialize newExpense with first participant", () => {
      const { store } = setup();
      expect(store.newExpense).toEqual({
        payer: "Alice",
        amount: "",
        description: "",
      });
    });
  });

  describe("Expense Management", () => {
    it("should add a new expense with a snapshot of the participants", () => {
      const { store } = setup();

      expect(addExpense(store, "Alice", "50", "Groceries")).toBe(true);

      expect(store.expenses).toHaveLength(1);
      expect(store.expenses[0]).toMatchObject({
        payer: "Alice",
        amount: 50,
        description: "Groceries",
        participants: ["Alice", "Bob"],
      });
      expect(store.hasExpenses).toBe(true);
      expect(store.totalExpenses).toBe(50);
    });

    it("should give every expense a unique id", () => {
      const { store } = setup();
      addExpense(store, "Alice", "10");
      addExpense(store, "Alice", "20");

      expect(store.expenses[0].id).not.toBe(store.expenses[1].id);
    });

    it("should reject a missing amount", () => {
      const { store } = setup();
      expect(addExpense(store, "Alice", "")).toBe(false);
      expect(store.expenses).toHaveLength(0);
      expect(store.expenseError).not.toBe("");
    });

    it("should reject a non-numeric amount instead of poisoning the balances", () => {
      const { store } = setup();
      expect(addExpense(store, "Alice", "abc")).toBe(false);
      expect(store.expenses).toHaveLength(0);
      expect(Object.values(store.balances).every(Number.isFinite)).toBe(true);
    });

    it("should reject zero and negative amounts", () => {
      const { store } = setup();
      expect(addExpense(store, "Alice", "0")).toBe(false);
      expect(addExpense(store, "Alice", "-10")).toBe(false);
      expect(store.expenses).toHaveLength(0);
    });

    it("should reject a payer who is not a participant", () => {
      const { store } = setup();
      expect(addExpense(store, "Zoe", "50")).toBe(false);
      expect(store.expenses).toHaveLength(0);
    });

    it("should remove an expense", () => {
      const { store } = setup();
      addExpense(store, "Alice", "50");

      store.removeExpense(store.expenses[0].id);

      expect(store.expenses).toHaveLength(0);
      expect(store.settlements).toHaveLength(0);
    });
  });

  describe("Balance Calculations", () => {
    it("should calculate correct balances", () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");

      expect(store.balances).toEqual({ Alice: 50, Bob: -50 });
    });

    it("should net multiple expenses out", () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");
      addExpense(store, "Bob", "60");

      expect(store.balances).toEqual({ Alice: 20, Bob: -20 });
    });
  });

  describe("Settlement Calculations", () => {
    it("should derive settlements without an explicit calculate step", () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");

      expect(store.settlements).toEqual([
        { from: "Bob", to: "Alice", amount: 50 },
      ]);
    });

    it("should recompute when an expense is added", () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");
      addExpense(store, "Bob", "60");

      expect(store.settlements).toEqual([
        { from: "Bob", to: "Alice", amount: 20 },
      ]);
    });

    it("should recompute when an expense is removed", () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");
      addExpense(store, "Bob", "60");

      store.removeExpense(store.expenses[1].id);

      expect(store.settlements).toEqual([
        { from: "Bob", to: "Alice", amount: 50 },
      ]);
    });

    it("should not lose a cent on an amount that does not divide evenly", () => {
      const { store } = setup(["A", "B", "C"]);
      addExpense(store, "A", "10");

      const received = store.settlements
        .filter((t) => t.to === "A")
        .reduce((sum, t) => sum + Math.round(t.amount * 100), 0);

      // A is owed 1000 minus their own share, and gets every cent of it back
      expect(received).toBe(Math.round(store.balances["A"] * 100));
      expect([666, 667]).toContain(received);
    });

    it("should keep the whole balance sheet at exactly zero", () => {
      const { store } = setup(["A", "B", "C"]);
      addExpense(store, "A", "10");
      addExpense(store, "B", "7.77");
      addExpense(store, "C", "0.05");

      const total = Object.values(store.balances).reduce(
        (sum, euro) => sum + Math.round(euro * 100),
        0
      );

      expect(total).toBe(0);
      expect(store.settlementError).toBe("");
    });

    it("should keep a removed participant's debt visible", () => {
      const { store, participantStore } = setup(["A", "B", "C"]);
      addExpense(store, "A", "30");

      participantStore.removeParticipant("C");

      expect(store.balances["C"]).toBe(-10);
      expect(store.settlements).toContainEqual({
        from: "C",
        to: "A",
        amount: 10,
      });
    });
  });

  describe("commitRename", () => {
    it("renames the roster and the snapshots in one call", () => {
      const { store, participantStore } = setup();
      addExpense(store, "Alice", "100");
      participantStore.editingParticipant = {
        original: "Alice",
        new: "Alicia",
      };

      expect(store.commitRename()).toEqual({ from: "Alice", to: "Alicia" });

      expect(participantStore.participants).toEqual(["Alicia", "Bob"]);
      expect(store.expenses[0].payer).toBe("Alicia");
      expect(store.balances).toEqual({ Alicia: 50, Bob: -50 });
    });

    it("changes nothing when the new name is rejected", () => {
      const { store, participantStore } = setup();
      addExpense(store, "Alice", "100");
      participantStore.editingParticipant = { original: "Alice", new: "Bob" };

      expect(store.commitRename()).toBeNull();

      expect(participantStore.participants).toEqual(["Alice", "Bob"]);
      expect(store.expenses[0].payer).toBe("Alice");
    });

    it("does nothing when no rename is pending", () => {
      const { store } = setup();
      expect(store.commitRename()).toBeNull();
    });
  });

  describe("Participant Renaming", () => {
    const rename = (
      store: ReturnType<typeof useExpenseSplitterStore>,
      participantStore: ReturnType<typeof useParticipantsStore>,
      from: string,
      to: string
    ) => {
      participantStore.editingParticipant = { original: from, new: to };
      return store.commitRename();
    };

    it("should follow the rename through payer and snapshots", () => {
      const { store, participantStore } = setup();
      addExpense(store, "Alice", "100");

      rename(store, participantStore, "Alice", "Alicia");

      expect(store.expenses[0].payer).toBe("Alicia");
      expect(store.expenses[0].participants).toEqual(["Alicia", "Bob"]);
    });

    it("should not create a phantom debtor after a rename", () => {
      const { store, participantStore } = setup();
      addExpense(store, "Alice", "100");

      rename(store, participantStore, "Alice", "Alicia");

      expect(store.balances).toEqual({ Alicia: 50, Bob: -50 });
      expect(store.settlements).toEqual([
        { from: "Bob", to: "Alicia", amount: 50 },
      ]);
    });

    it("should survive a rename round trip back to the original name", () => {
      const { store, participantStore } = setup();
      addExpense(store, "Alice", "100");

      rename(store, participantStore, "Alice", "Alicia");
      rename(store, participantStore, "Alicia", "Alice");

      expect(store.balances).toEqual({ Alice: 50, Bob: -50 });
    });
  });

  describe("Default Payer", () => {
    it("picks up the first participant added to an empty roster", async () => {
      const { store, participantStore } = setup([]);
      expect(store.newExpense.payer).toBe("");

      participantStore.participants = ["Alice"];
      await nextTick();

      expect(store.newExpense.payer).toBe("Alice");
    });

    it("moves off a payer who is no longer on the roster", async () => {
      const { store, participantStore } = setup(["Alice", "Bob"]);
      expect(store.newExpense.payer).toBe("Alice");

      participantStore.removeParticipant("Alice");
      await nextTick();

      expect(store.newExpense.payer).toBe("Bob");
    });

    it("keeps the payer through a rename", async () => {
      const { store, participantStore } = setup(["Alice", "Bob"]);
      participantStore.editingParticipant = {
        original: "Alice",
        new: "Alicia",
      };

      store.commitRename();
      await nextTick();

      expect(store.newExpense.payer).toBe("Alicia");
    });
  });

  describe("Persistence", () => {
    const stored = () => JSON.parse(localStorage.getItem("expenses") ?? "[]");

    it("saves expenses so a refresh does not lose them", async () => {
      const { store } = setup();
      addExpense(store, "Alice", "100", "Dinner");
      await nextTick();

      expect(stored()).toHaveLength(1);
      expect(stored()[0]).toMatchObject({
        payer: "Alice",
        amount: 100,
        participants: ["Alice", "Bob"],
      });
    });

    it("saves removals too", async () => {
      const { store } = setup();
      addExpense(store, "Alice", "100");
      await nextTick();

      store.removeExpense(store.expenses[0].id);
      await nextTick();

      expect(stored()).toEqual([]);
    });

    it("restores expenses on a fresh store", () => {
      localStorage.setItem(
        "expenses",
        JSON.stringify([
          {
            id: "e1",
            payer: "Alice",
            amount: 100,
            description: "Dinner",
            participants: ["Alice", "Bob"],
            timestamp: 0,
          },
        ])
      );

      const { store } = setup();

      expect(store.expenses).toHaveLength(1);
      expect(store.balances).toEqual({ Alice: 50, Bob: -50 });
    });

    it("drops malformed entries instead of poisoning the balances", () => {
      localStorage.setItem(
        "expenses",
        JSON.stringify([
          { id: "ok", payer: "Alice", amount: 100, description: "", participants: ["Alice", "Bob"], timestamp: 0 },
          { id: "no-amount", payer: "Alice", description: "", participants: ["Alice"], timestamp: 0 },
          { id: "nan", payer: "Alice", amount: "abc", description: "", participants: ["Alice"], timestamp: 0 },
          { id: "negative", payer: "Alice", amount: -5, description: "", participants: ["Alice"], timestamp: 0 },
          { id: "no-participants", payer: "Alice", amount: 10, description: "", participants: [], timestamp: 0 },
          { id: "dup-participants", payer: "Alice", amount: 10, description: "", participants: ["Alice", "Alice"], timestamp: 0 },
          { id: "ok", payer: "Bob", amount: 999, description: "", participants: ["Alice", "Bob"], timestamp: 0 },
          "not an object",
          null,
        ])
      );

      const { store } = setup();

      expect(store.expenses.map((e) => e.id)).toEqual(["ok"]);
      expect(store.expenses[0].payer).toBe("Alice");
      expect(Object.values(store.balances).every(Number.isFinite)).toBe(true);
      expect(store.settlementError).toBe("");
    });

    it("falls back to an empty list when storage holds garbage", () => {
      localStorage.setItem("expenses", "{not json");
      expect(setup().store.expenses).toEqual([]);
    });

    it("reports a failed write and clears the message once it works again", async () => {
      const { store } = setup();
      const setItem = vi
        .spyOn(localStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      addExpense(store, "Alice", "100");
      await nextTick();
      expect(store.expenseError).toBe("Impossibile salvare le spese");

      setItem.mockRestore();
      addExpense(store, "Bob", "50");
      await nextTick();
      expect(store.expenseError).toBe("");
    });

    it("gives restored and new expenses distinct ids", () => {
      localStorage.setItem(
        "expenses",
        JSON.stringify([
          { id: "e1", payer: "Alice", amount: 10, description: "", participants: ["Alice", "Bob"], timestamp: 0 },
        ])
      );

      const { store } = setup();
      addExpense(store, "Alice", "20");

      const ids = store.expenses.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("Retroactive Splits", () => {
    it("should not re-split past expenses when a participant joins later", () => {
      const { store, participantStore } = setup(["Alice", "Bob"]);
      addExpense(store, "Alice", "100");

      participantStore.participants = ["Alice", "Bob", "Carol"];

      expect(store.balances).toEqual({ Alice: 50, Bob: -50, Carol: 0 });
    });
  });
});
