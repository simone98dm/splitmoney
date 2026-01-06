import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { Expense, Transfer, Balance, Room } from "~/types";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

export const useExpenseSplitterStore = defineStore("expenseSplitter", () => {
  const { participants } = storeToRefs(useParticipantsStore());

  const roomId = ref<string | null>(null);

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
      participants.forEach((p) => {
        balances[p] -= perPerson;
      });
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

  const init = async (room: string) => {
    try {
      const response = await $fetch<Room>(`/api/room/${room}`);

      if (!response) {
        navigateTo("/");
      }

      roomId.value = response.id as string;
      expenses.value = response.data.expenses;

      const participantStore = useParticipantsStore();
      participantStore.participants = response.data.participants.map(
        (x) => x.name
      );

      calculateSettlements();
    } catch (e) {
      console.error(e);
    }
  };

  const generateUrl = async () => {
    try {
      const response = await $fetch<{ id: string }>(`/api/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          participants: participants.value,
          expenses: expenses.value,
        },
      });

      if (response) {
        const router = useRouter();
        roomId.value = response.id;
        router.push({ query: { room: response.id } });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveRoom = async () => {
    try {
      const response = await $fetch(`/api/room/${roomId.value}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          participants: participants.value,
          expenses: expenses.value,
        },
      });

      if (response) {
        console.log("Room saved");
      }
    } catch (e) {
      console.error(e);
    }
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
    init,
    generateUrl,
    roomId,
    saveRoom,
  };
});
