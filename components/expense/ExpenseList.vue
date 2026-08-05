<template>
  <div v-if="hasExpenses" class="mb-6">
    <div class="text-right mb-2 text-sm text-gray-600">
      Totale spese: {{ totalExpenses.toFixed(2) }}€
    </div>

    <div
      v-for="expense in expenses"
      :key="expense.id"
      class="flex items-center justify-between p-3 border rounded mb-2 hover:bg-gray-50"
    >
      <span>
        <strong>{{ expense.payer }}</strong> ha pagato
        {{ expense.amount.toFixed(2) }}€
        <span class="text-gray-500 text-sm">
          (diviso tra {{ expense.participants.length }})
        </span>
      </span>
      <div class="flex items-center gap-4">
        <span v-if="expense.description" class="text-gray-600">
          {{ expense.description }}
        </span>
        <button
          @click="splitterStore.removeExpense(expense.id)"
          class="text-red-500 hover:text-red-600"
          :title="`Rimuovi ${expense.description || 'spesa'}`"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { storeToRefs } from "pinia";

const splitterStore = useExpenseSplitterStore();
const { expenses, hasExpenses, totalExpenses } = storeToRefs(splitterStore);
</script>
