import type { Expense, ParticipantStats } from "~/types";
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { toCents, toEuro } from "~/store/money";
import { sharesForExpense } from "~/store/balance";
import { parseNameList, readStored, writeStored } from "~/store/storage";

const STORAGE_KEY = "participants";
const ME_STORAGE_KEY = "me";
const DEFAULT_PARTICIPANTS = ["A", "B", "C"];
const MAX_NAME_LENGTH = 20;

export interface ParticipantRename {
  from: string;
  to: string;
}

export const useParticipantsStore = defineStore("participants", () => {
  const participants = ref<string[]>(
    readStored(STORAGE_KEY, parseNameList, [...DEFAULT_PARTICIPANTS])
  );
  /**
   * Who is holding the phone. The top of the screen answers "what do *I*
   * owe", and there is no login to answer that, so the user names themselves
   * once and we remember it.
   *
   *   null  -> never answered, show the prompt
   *   ""    -> deliberately skipped, fall back to group totals
   *   name  -> show that person's balance
   *
   * Nothing is ever blocked on answering.
   */
  const me = ref<string | null>(
    readStored(
      ME_STORAGE_KEY,
      (raw) => (typeof raw === "string" ? raw : null),
      null
    )
  );

  const isMeAnswered = computed(() => me.value !== null);
  const isMeSelected = computed(
    () => me.value !== null && me.value !== "" && participants.value.includes(me.value)
  );

  const setMe = (name: string) => {
    me.value = name;
    writeStored(ME_STORAGE_KEY, name);
  };

  const skipMe = () => setMe("");

  /** Puts the "chi sei?" question back, and keeps it back after a reload. */
  const clearMe = () => {
    me.value = null;
    writeStored(ME_STORAGE_KEY, null);
  };

  const newParticipant = ref("");
  const participantError = ref("");
  const editingParticipant = ref<{ original: string; new: string } | null>(
    null
  );
  const showRemoveConfirm = ref<string | null>(null);

  const sortedParticipants = computed(() =>
    [...participants.value].sort((a, b) => a.localeCompare(b))
  );

  const validateParticipantName = (
    name: string,
    excludeCurrent = ""
  ): string => {
    if (!name.trim()) {
      return "Il nome non può essere vuoto";
    }

    if (name.length > MAX_NAME_LENGTH) {
      return `Il nome non può superare i ${MAX_NAME_LENGTH} caratteri`;
    }

    if (
      participants.value.some(
        (p) => p !== excludeCurrent && p.toLowerCase() === name.toLowerCase()
      )
    ) {
      return "Questo nome è già in uso";
    }

    return "";
  };

  const persist = () => {
    if (!writeStored(STORAGE_KEY, participants.value)) {
      // storage full or disabled: the app still works for this session
      participantError.value = "Impossibile salvare i partecipanti";
    }
  };

  const addParticipant = (): boolean => {
    const name = newParticipant.value.trim();
    const error = validateParticipantName(name);

    if (error) {
      participantError.value = error;
      return false;
    }

    participants.value = [...participants.value, name];
    newParticipant.value = "";
    participantError.value = "";
    persist();
    return true;
  };

  const startEditing = (name: string) => {
    editingParticipant.value = { original: name, new: name };
  };

  const cancelEditing = () => {
    editingParticipant.value = null;
  };

  /**
   * Renames the participant and reports the rename so the caller can apply it
   * to the expenses too. Returns null when the edit was rejected.
   */
  const saveEditing = (): ParticipantRename | null => {
    if (!editingParticipant.value) return null;

    const { original } = editingParticipant.value;
    const name = editingParticipant.value.new.trim();
    const error = validateParticipantName(name, original);

    if (error) {
      participantError.value = error;
      return null;
    }

    participants.value = participants.value.map((p) =>
      p === original ? name : p
    );

    // "me" points at a name, so it has to follow the rename or the header
    // silently stops recognising the user
    if (me.value === original) setMe(name);

    editingParticipant.value = null;
    participantError.value = "";
    persist();
    return { from: original, to: name };
  };

  const confirmRemove = (name: string) => {
    showRemoveConfirm.value = name;
  };

  const cancelRemove = () => {
    showRemoveConfirm.value = null;
  };

  const removeParticipant = (name: string) => {
    participants.value = participants.value.filter((p) => p !== name);

    // removing yourself puts the question back on the table
    if (me.value === name) clearMe();

    showRemoveConfirm.value = null;
    persist();
  };

  /**
   * Uses each expense's own participant snapshot and the same cent split as
   * the settlement, so netBalance always matches the settlement plan.
   */
  const calculateParticipantStats = (
    participant: string,
    expenses: Expense[]
  ): ParticipantStats => {
    const paidExpenses = expenses.filter((e) => e.payer === participant);
    const paidCents = paidExpenses.reduce(
      (sum, e) => sum + toCents(e.amount),
      0
    );

    // the payer owes their own share too — leaving it out overstates their credit
    const owedCents = expenses.reduce((sum, expense) => {
      const index = expense.participants.indexOf(participant);
      if (index === -1) return sum;
      return sum + sharesForExpense(expense)[index];
    }, 0);

    return {
      totalPaid: toEuro(paidCents),
      totalOwed: toEuro(owedCents),
      netBalance: toEuro(paidCents - owedCents),
      numberOfExpenses: paidExpenses.length,
      averageExpense: paidExpenses.length
        ? toEuro(Math.round(paidCents / paidExpenses.length))
        : 0,
    };
  };

  return {
    participants,
    sortedParticipants,
    me,
    isMeAnswered,
    isMeSelected,
    setMe,
    skipMe,
    clearMe,
    newParticipant,
    participantError,
    editingParticipant,
    showRemoveConfirm,
    validateParticipantName,
    addParticipant,
    startEditing,
    cancelEditing,
    saveEditing,
    confirmRemove,
    cancelRemove,
    removeParticipant,
    calculateParticipantStats,
  };
});
