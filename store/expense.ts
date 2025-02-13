import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Expense, Transfer, Balance } from "~/types";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

export const useExpenseSplitterStore = defineStore("expenseSplitter", () => {
  const { participants } = storeToRefs(useParticipantsStore());

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
      timestamp: Date.now(),
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
      // First subtract the per-person share from everyone (including payer)
      participants.forEach((p) => {
        balances[p] -= perPerson;
      });
      // Then add the full amount to the payer
      balances[expense.payer] += expense.amount;
    });

    return balances;
  };

  const roundAmount = (amount: number): number => {
    return Math.round(amount * 100) / 100;
  };

  const calculateSettlements = () => {
    const balances = calculateBalances(expenses.value, participants.value);

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

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

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
      console.debug(
        `Transfer: ${debtors[i].person} -> ${creditors[j].person} = ${amount}`
      );

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      console.debug(
        `Debt[${i}] = ${debtors[i].amount}, Credit[${j}] = ${creditors[j].amount}`
      );
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    console.debug(`i = ${i}, j = ${j}`);
    settlements.value = transfers;
  };

  return {
    expenses,
    settlements,
    newExpense,
    hasExpenses,
    totalExpenses,
    addExpense,
    removeExpense,
    calculateSettlements,
    roundAmount,
    calculateBalances,
  };
});
