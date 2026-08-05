import { setActivePinia, createPinia } from "pinia";
import { beforeEach, describe, expect, it } from "vitest";
import type { Expense } from "~/types";
import { useParticipantsStore } from "../participant";

const expense = (payer: string, amount: number, participants: string[]): Expense => ({
  id: `e-${payer}-${amount}`,
  payer,
  amount,
  description: "",
  participants,
  timestamp: 0,
});

describe("Participants Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  describe("Loading", () => {
    it("falls back to the defaults when storage holds garbage", () => {
      localStorage.setItem("participants", "{not json");
      expect(useParticipantsStore().participants).toEqual(["A", "B", "C"]);
    });

    it("drops non-string entries from storage", () => {
      localStorage.setItem("participants", '["Alice", 42, null, "Bob"]');
      expect(useParticipantsStore().participants).toEqual(["Alice", "Bob"]);
    });
  });

  describe("addParticipant", () => {
    it("adds a trimmed name", () => {
      const store = useParticipantsStore();
      store.participants = [];
      store.newParticipant = "  Alice  ";

      expect(store.addParticipant()).toBe(true);
      expect(store.participants).toEqual(["Alice"]);
    });

    it("rejects duplicates regardless of case", () => {
      const store = useParticipantsStore();
      store.participants = ["Alice"];
      store.newParticipant = "alice";

      expect(store.addParticipant()).toBe(false);
      expect(store.participantError).toBe("Questo nome è già in uso");
    });

    it("rejects an empty name", () => {
      const store = useParticipantsStore();
      store.newParticipant = "   ";
      expect(store.addParticipant()).toBe(false);
    });
  });

  describe("saveEditing", () => {
    it("reports the rename so the caller can update the expenses", () => {
      const store = useParticipantsStore();
      store.participants = ["Alice", "Bob"];
      store.startEditing("Alice");
      store.editingParticipant = { original: "Alice", new: "Alicia" };

      expect(store.saveEditing()).toEqual({ from: "Alice", to: "Alicia" });
      expect(store.participants).toEqual(["Alicia", "Bob"]);
    });

    it("returns null and keeps the roster when the new name collides", () => {
      const store = useParticipantsStore();
      store.participants = ["Alice", "Bob"];
      store.editingParticipant = { original: "Alice", new: "Bob" };

      expect(store.saveEditing()).toBeNull();
      expect(store.participants).toEqual(["Alice", "Bob"]);
    });
  });

  describe("calculateParticipantStats", () => {
    it("charges the payer their own share too", () => {
      const store = useParticipantsStore();
      const expenses = [expense("Alice", 100, ["Alice", "Bob"])];

      const stats = store.calculateParticipantStats("Alice", expenses);

      expect(stats.totalPaid).toBe(100);
      expect(stats.totalOwed).toBe(50);
      expect(stats.netBalance).toBe(50);
      expect(stats.numberOfExpenses).toBe(1);
    });

    it("ignores expenses the participant was not part of", () => {
      const store = useParticipantsStore();
      const expenses = [expense("Alice", 100, ["Alice", "Bob"])];

      expect(store.calculateParticipantStats("Carol", expenses)).toMatchObject({
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      });
    });

    it("net balances sum to zero across everyone involved", () => {
      const store = useParticipantsStore();
      const roster = ["A", "B", "C"];
      const expenses = [expense("A", 10, roster), expense("B", 7.77, roster)];

      const total = roster.reduce(
        (sum, person) =>
          sum +
          Math.round(
            store.calculateParticipantStats(person, expenses).netBalance * 100
          ),
        0
      );

      expect(total).toBe(0);
    });
  });
});
