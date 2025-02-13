<template>
  <div v-if="hasExpenses" class="mb-6">
    <div class="text-right mb-2 text-sm text-gray-600">
      Totale spese: {{ totalExpenses }}€
    </div>

    <div
      v-for="expense in expenses"
      :key="expense.id"
      class="flex items-center justify-between p-3 border rounded mb-2 hover:bg-gray-50"
    >
      <span>
        <strong>{{ expense.payer }}</strong> ha pagato {{ expense.amount }}€
      </span>
      <div class="flex items-center gap-4">
        <span v-if="expense.description" class="text-gray-600">
          {{ expense.description }}
        </span>
        <button
          @click="splitterStore.removeExpense(expense.id)"
          class="text-red-500 hover:text-red-600"
        >
          ✕
        </button>
      </div>
    </div>

    <button
      @click="splitterStore.calculateSettlements"
      class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mt-4"
    >
      Calcola Transazioni Ottimali
    </button>
  </div>
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { storeToRefs } from "pinia";

const splitterStore = useExpenseSplitterStore();
const { expenses, hasExpenses, totalExpenses } = storeToRefs(splitterStore);
</script>
