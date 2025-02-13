<template>
  <span v-if="participants.length <= 0">
    <h3 class="text-gray-500 font-semibold mb-4">
      Inserisci almeno un partecipante
    </h3>
  </span>
  <div
    v-else
    class="grid grid-cols-1 sm:flex gap-2 mb-6 border border-gray-200 rounded-lg shadow-sm p-4"
  >
    <select v-model="newExpense.payer" class="p-2 border rounded">
      <option
        v-for="participant in participants"
        :key="participant"
        :value="participant"
      >
        {{ participant }}
      </option>
    </select>

    <input
      v-model="newExpense.amount"
      type="number"
      min="0"
      step="0.01"
      placeholder="Importo €"
      class="p-2 border rounded sm:w-32"
      @keyup.enter="splitterStore.addExpense"
    />

    <input
      v-model="newExpense.description"
      placeholder="Descrizione"
      class="p-2 border rounded sm:flex-grow"
      @keyup.enter="splitterStore.addExpense"
    />

    <button
      @click="splitterStore.addExpense"
      :disabled="!newExpense.amount"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

const { participants } = storeToRefs(useParticipantsStore());
const splitterStore = useExpenseSplitterStore();
const { newExpense } = storeToRefs(splitterStore);
</script>
