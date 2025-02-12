import { ref, computed } from "vue";
import type { Expense } from "~/types";

export function useParticipants() {
  const participants = ref<string[]>(["A", "B", "C", "D"]);
  const newParticipant = ref("");
  const participantError = ref("");

  const addParticipant = () => {
    const name = newParticipant.value.trim();

    if (!name) {
      participantError.value = "Il nome non può essere vuoto";
      return false;
    }

    if (participants.value.includes(name)) {
      participantError.value = "Questo nome è già in uso";
      return false;
    }

    participants.value.push(name);
    newParticipant.value = "";
    participantError.value = "";
    return true;
  };

  const removeParticipant = (name: string) => {
    participants.value = participants.value.filter((p) => p !== name);
  };

  const canRemoveParticipant = (name: string, expenses: Expense[]) => {
    return !expenses.some((expense) => expense.payer === name);
  };

  return {
    participants,
    newParticipant,
    participantError,
    addParticipant,
    removeParticipant,
    canRemoveParticipant,
  };
}
