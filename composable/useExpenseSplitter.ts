import { ref, computed } from "vue";
import type { Ref } from "vue";
import type { Expense, Transfer, Balance } from "~/types";
import { useParticipants } from "./useParticipants";

export function useExpenseSplitter() {
  const {
    participants,
    newParticipant,
    participantError,
    addParticipant,
    removeParticipant,
    canRemoveParticipant,
  } = useParticipants();

  const expenses = ref<Expense[]>([]);
  const settlements = ref<Transfer[]>([]);

  const newExpense = ref({
    payer: participants.value[0],
    amount: "",
    description: "",
  });

  const hasExpenses = computed(() => expenses.value.length > 0);
  const totalExpenses = computed(() =>
    expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  );

  const addExpense = () => {
    if (!newExpense.value.amount || !newExpense.value.payer) return;

    expenses.value.push({
      id: Date.now(),
      payer: newExpense.value.payer,
      amount: parseFloat(newExpense.value.amount as string),
      description: newExpense.value.description,
    });

    newExpense.value = {
      payer: participants.value[0],
      amount: "",
      description: "",
    };
  };

  const removeExpense = (id: number) => {
    expenses.value = expenses.value.filter((expense) => expense.id !== id);
    if (expenses.value.length === 0) {
      settlements.value = [];
    }
  };

  const calculateBalances = (
    expenses: Expense[],
    participants: string[]
  ): Record<string, number> => {
    const balances: Record<string, number> = {};
    participants.forEach((p) => (balances[p] = 0));

    expenses.forEach((expense) => {
      const perPerson = expense.amount / participants.length;
      balances[expense.payer] += expense.amount;
      participants.forEach((p) => {
        if (p !== expense.payer) {
          balances[p] -= perPerson;
        }
      });
    });

    return balances;
  };

  const roundAmount = (amount: number): number => {
    return Math.round(amount * 100) / 100;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances(expenses.value, participants.value);

    // Separa debitori e creditori
    const debtors: Balance[] = [];
    const creditors: Balance[] = [];

    Object.entries(balances).forEach(([person, balance]) => {
      const roundedBalance = roundAmount(balance);
      if (roundedBalance < 0) {
        debtors.push({ person, amount: -roundedBalance });
      } else if (roundedBalance > 0) {
        creditors.push({ person, amount: roundedBalance });
      }
    });

    // Ordina per importo decrescente
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // Calcola i trasferimenti ottimali
    const transfers: Transfer[] = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debt = roundAmount(debtors[i].amount);
      const credit = roundAmount(creditors[j].amount);

      const amount = Math.min(debt, credit);
      if (amount > 0) {
        transfers.push({
          from: debtors[i].person,
          to: creditors[j].person,
          amount: roundAmount(amount),
        });
      }

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    settlements.value = transfers;
  };

  return {
    participants,
    newParticipant,
    participantError,
    addParticipant,
    removeParticipant,
    canRemoveParticipant,
    expenses,
    settlements,
    newExpense,
    hasExpenses,
    totalExpenses,
    addExpense,
    removeExpense,
    calculateSettlements,
  };
}
