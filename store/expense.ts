import { ref, computed, watch } from "vue";
import { defineStore, storeToRefs } from "pinia";
import type { Expense, Transfer } from "~/types";
import { useParticipantsStore } from "~/store/participant";
import type { ParticipantRename } from "~/store/participant";
import { calculateBalancesInCents } from "~/store/balance";
import { settleDebts } from "~/store/settlement";
import { toCents, toEuro } from "~/store/money";
import { readStored, writeStored } from "~/store/storage";

const STORAGE_KEY = "expenses";
const MAX_EXPENSE_AMOUNT = 1_000_000;

// Date.now() alone collides when two expenses land in the same millisecond;
// the counter disambiguates within a session, the timestamp across sessions.
let expenseSequence = 0;
const nextExpenseId = (): string => `${Date.now()}-${++expenseSequence}`;

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Errore di calcolo imprevisto";

/**
 * Anything restored from storage has to survive the same checks as fresh
 * input: one malformed entry would otherwise poison the whole balance sheet.
 */
const isValidExpense = (value: unknown): value is Expense => {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  const participants = candidate.participants;
  const hasValidParticipants =
    Array.isArray(participants) &&
    participants.length > 0 &&
    participants.every((p) => typeof p === "string" && p !== "") &&
    // a duplicate inside the snapshot would charge that person two shares
    new Set(participants).size === participants.length;

  return (
    typeof candidate.id === "string" &&
    candidate.id !== "" &&
    typeof candidate.payer === "string" &&
    candidate.payer !== "" &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    candidate.amount <= MAX_EXPENSE_AMOUNT &&
    typeof candidate.description === "string" &&
    typeof candidate.timestamp === "number" &&
    Number.isFinite(candidate.timestamp) &&
    hasValidParticipants
  );
};

const parseExpenses = (raw: unknown): Expense[] | null => {
  if (!Array.isArray(raw)) return null;

  const seen = new Set<string>();
  return raw.filter((candidate): candidate is Expense => {
    if (!isValidExpense(candidate) || seen.has(candidate.id)) return false;
    seen.add(candidate.id);
    return true;
  });
};

export const useExpenseSplitterStore = defineStore("expenseSplitter", () => {
  const participantsStore = useParticipantsStore();
  const { participants } = storeToRefs(participantsStore);

  const expenses = ref<Expense[]>(readStored(STORAGE_KEY, parseExpenses, []));
  const expenseError = ref("");

  // Participants were already persisted; losing the expenses on every refresh
  // while the roster survived left the app in a half-remembered state.
  watch(
    expenses,
    (list) => {
      // fires only after a change already went through, so clearing on success
      // cannot swallow a validation message
      expenseError.value = writeStored(STORAGE_KEY, list)
        ? ""
        : "Impossibile salvare le spese";
    },
    { deep: true }
  );

  const buildEmptyExpense = () => ({
    payer: participants.value[0] ?? "",
    amount: "",
    description: "",
  });

  const newExpense = ref(buildEmptyExpense());

  /**
   * The roster can be empty at startup, or the selected payer can be removed.
   * Either way the form would keep an unselectable payer and every submit
   * would be rejected, so re-point it at a name that actually exists.
   */
  watch(
    participants,
    (roster) => {
      if (!roster.includes(newExpense.value.payer)) {
        newExpense.value = { ...newExpense.value, payer: roster[0] ?? "" };
      }
    },
    // deep: also catch an in-place push from a future caller, not just a reassign
    { deep: true }
  );

  const hasExpenses = computed(() => expenses.value.length > 0);
  const totalExpenses = computed(() =>
    toEuro(
      expenses.value.reduce((sum, expense) => sum + toCents(expense.amount), 0)
    )
  );

  /**
   * Derived, never stored: adding, removing or renaming anything recomputes
   * the plan. A cached copy would keep showing a payment plan for expenses
   * that no longer exist.
   *
   * Balances and transfers share one guarded computation so a bad ledger
   * surfaces as an error message instead of throwing during render.
   */
  const ledger = computed<{
    balances: Record<string, number>;
    transfers: Transfer[];
    error: string;
  }>(() => {
    try {
      const cents = calculateBalancesInCents(expenses.value, participants.value);
      return {
        balances: Object.fromEntries(
          Object.entries(cents).map(([person, value]) => [person, toEuro(value)])
        ),
        transfers: settleDebts(cents),
        error: "",
      };
    } catch (error: unknown) {
      return { balances: {}, transfers: [], error: getErrorMessage(error) };
    }
  });

  const balances = computed(() => ledger.value.balances);
  const settlements = computed(() => ledger.value.transfers);
  const settlementError = computed(() => ledger.value.error);

  const parseAmount = (raw: string): number | null => {
    // Number() rather than parseFloat(): "50abc" must be rejected, not read as 50
    const amount = Number(raw);
    if (!Number.isFinite(amount)) return null;
    if (amount <= 0 || amount > MAX_EXPENSE_AMOUNT) return null;
    return amount;
  };

  const addExpense = (): boolean => {
    const amount = parseAmount(String(newExpense.value.amount));
    if (amount === null) {
      expenseError.value = `Inserisci un importo tra 0,01 e ${MAX_EXPENSE_AMOUNT.toLocaleString(
        "it-IT"
      )}€`;
      return false;
    }

    const payer = newExpense.value.payer;
    const splitAmong = [...participants.value];
    if (!payer || !splitAmong.includes(payer)) {
      expenseError.value = "Seleziona chi ha pagato";
      return false;
    }

    expenses.value = [
      ...expenses.value,
      {
        id: nextExpenseId(),
        payer,
        amount,
        description: newExpense.value.description.trim(),
        participants: splitAmong,
        timestamp: Date.now(),
      },
    ];

    newExpense.value = buildEmptyExpense();
    expenseError.value = "";
    return true;
  };

  const removeExpense = (id: string) => {
    expenses.value = expenses.value.filter((expense) => expense.id !== id);
  };

  /**
   * Commits a pending rename across BOTH the roster and the expenses.
   *
   * Renaming only the roster leaves the old name sitting in the expense
   * snapshots as a phantom debtor, so the two halves must not be separate
   * calls a caller can forget to pair.
   */
  const commitRename = (): ParticipantRename | null => {
    const rename = participantsStore.saveEditing();
    if (rename) renameParticipant(rename.from, rename.to);
    return rename;
  };

  // private on purpose: renaming the snapshots without the roster (or the
  // other way round) is exactly the half-applied state commitRename prevents
  const renameParticipant = (from: string, to: string) => {
    if (from === to) return;

    expenses.value = expenses.value.map((expense) => ({
      ...expense,
      payer: expense.payer === from ? to : expense.payer,
      participants: expense.participants.map((p) => (p === from ? to : p)),
    }));

    if (newExpense.value.payer === from) {
      newExpense.value = { ...newExpense.value, payer: to };
    }
  };

  return {
    expenses,
    expenseError,
    newExpense,
    hasExpenses,
    totalExpenses,
    balances,
    settlements,
    settlementError,
    addExpense,
    removeExpense,
    commitRename,
  };
});
