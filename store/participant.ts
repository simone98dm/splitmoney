import type { Expense, ParticipantStats } from "~/types";
import { ref, computed, toRef } from "vue";
import { defineStore } from "pinia";

export const useParticipantsStore = defineStore("participants", () => {
  const participants = toRef<string[]>(
    JSON.parse(localStorage.getItem("participants") || '["A", "B", "C"]')
  );
  const newParticipant = ref("");
  const participantError = ref("");
  const editingParticipant = ref<{ original: string; new: string } | null>(
    null
  );
  const showRemoveConfirm = ref<string | null>(null);

  const sortedParticipants = computed(() => [...participants.value].sort());

  const validateParticipantName = (
    name: string,
    excludeCurrent = ""
  ): string => {
    if (!name.trim()) {
      return "Il nome non può essere vuoto";
    }

    if (name.length > 20) {
      return "Il nome non può superare i 20 caratteri";
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

  const addParticipant = () => {
    const name = newParticipant.value.trim();
    const error = validateParticipantName(name);

    if (error) {
      participantError.value = error;
      return false;
    }

    participants.value.push(name);
    newParticipant.value = "";
    participantError.value = "";
    _saveIntoMemory();
    return true;
  };

  const _saveIntoMemory = () => {
    localStorage.setItem("participants", JSON.stringify(participants.value));
  };

  const startEditing = (name: string) => {
    editingParticipant.value = { original: name, new: name };
  };

  const cancelEditing = () => {
    editingParticipant.value = null;
  };

  const saveEditing = (expenses: Expense[]) => {
    if (!editingParticipant.value) return false;

    const error = validateParticipantName(
      editingParticipant.value.new,
      editingParticipant.value.original
    );

    if (error) {
      participantError.value = error;
      return false;
    }

    expenses.forEach((expense) => {
      if (expense.payer === editingParticipant.value?.original) {
        expense.payer = editingParticipant.value.new;
      }
    });

    const index = participants.value.indexOf(editingParticipant.value.original);
    if (index !== -1) {
      participants.value[index] = editingParticipant.value.new;
    }

    editingParticipant.value = null;
    participantError.value = "";
    _saveIntoMemory();
    return true;
  };

  const confirmRemove = (name: string) => {
    showRemoveConfirm.value = name;
  };

  const cancelRemove = () => {
    showRemoveConfirm.value = null;
  };

  const removeParticipant = (name: string) => {
    participants.value = participants.value.filter((p) => p !== name);
    showRemoveConfirm.value = null;
    _saveIntoMemory();
  };

  const canRemoveParticipant = (name: string, expenses: Expense[]) => {
    return !expenses.some((expense) => expense.payer === name);
  };

  const calculateParticipantStats = (
    participant: string,
    expenses: Expense[],
    totalParticipants: number
  ): ParticipantStats => {
    const participantExpenses = expenses.filter((e) => e.payer === participant);
    const totalPaid = participantExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalOwed = expenses.reduce((sum, e) => {
      if (e.payer !== participant) {
        return sum + e.amount / totalParticipants;
      }
      return sum;
    }, 0);

    return {
      totalPaid,
      totalOwed,
      netBalance: totalPaid - totalOwed,
      numberOfExpenses: participantExpenses.length,
      averageExpense: participantExpenses.length
        ? totalPaid / participantExpenses.length
        : 0,
    };
  };

  return {
    participants,
    sortedParticipants,
    newParticipant,
    participantError,
    editingParticipant,
    showRemoveConfirm,
    addParticipant,
    startEditing,
    cancelEditing,
    saveEditing,
    confirmRemove,
    cancelRemove,
    removeParticipant,
    canRemoveParticipant,
    calculateParticipantStats,
  };
});
