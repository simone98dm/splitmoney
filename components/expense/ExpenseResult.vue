<template>
  <div v-if="settlementError" class="mt-6 p-3 bg-red-50 rounded text-red-600">
    Impossibile calcolare le transazioni: {{ settlementError }}
  </div>

  <div v-else-if="settlements.length" class="mt-6">
    <h3 class="font-semibold mb-3">
      Transazioni da effettuare ({{ settlements.length }}):
    </h3>
    <div
      v-for="transfer in settlements"
      :key="`${transfer.from}->${transfer.to}:${transfer.amount}`"
      class="p-3 bg-blue-50 rounded mb-2"
    >
      {{ transfer.from }} deve dare {{ transfer.amount.toFixed(2) }}€ a
      {{ transfer.to }}
    </div>
  </div>

  <p v-else-if="hasExpenses" class="mt-6 text-gray-600">
    Tutti i conti sono già in pari.
  </p>
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { storeToRefs } from "pinia";

const { settlements, settlementError, hasExpenses } = storeToRefs(
  useExpenseSplitterStore()
);
</script>
