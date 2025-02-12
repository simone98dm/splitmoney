<template>
  <div class="container mx-auto p-6">
    <h2 class="text-2xl font-bold mb-6">Divisione Spese</h2>

    <!-- Gestione Partecipanti -->
    <div class="mb-8 border-b pb-6">
      <h3 class="text-xl font-semibold mb-4">Partecipanti</h3>

      <!-- Form aggiunta partecipante -->
      <div class="flex gap-2 mb-4">
        <div class="flex-grow">
          <input
            v-model="newParticipant"
            placeholder="Nome nuovo partecipante"
            class="p-2 border rounded w-full"
            @keyup.enter="addParticipant"
          />
          <p v-if="participantError" class="text-red-500 text-sm mt-1">
            {{ participantError }}
          </p>
        </div>
        <button
          @click="addParticipant"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Aggiungi
        </button>
      </div>

      <!-- Lista partecipanti -->
      <div class="flex flex-wrap gap-2">
        <div
          v-for="participant in participants"
          :key="participant"
          class="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded"
        >
          <span>{{ participant }}</span>
          <button
            v-if="canRemoveParticipant(participant, expenses)"
            @click="removeParticipant(participant)"
            class="text-red-500 hover:text-red-600"
            title="Rimuovi partecipante"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Form per aggiungere spese -->
    <div class="flex gap-2 mb-6">
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
        class="p-2 border rounded w-16 sm:w-32"
        @keyup.enter="addExpense"
      />

      <input
        v-model="newExpense.description"
        placeholder="Descrizione"
        class="p-2 border rounded sm:flex-grow w-24"
        @keyup.enter="addExpense"
      />

      <button
        @click="addExpense"
        :disabled="!newExpense.amount"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        +
      </button>
    </div>

    <!-- Lista delle spese -->
    <div v-if="hasExpenses" class="mb-6">
      <div class="text-right mb-2 text-sm text-gray-600">
        Totale spese: {{ totalExpenses }}€
      </div>

      <div
        v-for="expense in expenses"
        :key="expense.id"
        class="flex items-center justify-between p-3 border rounded mb-2 hover:bg-gray-50"
      >
        <span class="font-medium">
          {{ expense.payer }} ha pagato {{ expense.amount }}€
        </span>
        <div class="flex items-center gap-4">
          <span v-if="expense.description" class="text-gray-600">
            {{ expense.description }}
          </span>
          <button
            @click="removeExpense(expense.id)"
            class="text-red-500 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      </div>

      <button
        @click="calculateSettlements"
        class="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mt-4"
      >
        Calcola Transazioni Ottimali
      </button>
    </div>

    <!-- Risultati -->
    <div v-if="settlements.length" class="mt-6">
      <h3 class="font-semibold mb-3">Transazioni da effettuare:</h3>
      <div
        v-for="(transfer, idx) in settlements"
        :key="idx"
        class="p-3 bg-blue-50 rounded mb-2"
      >
        {{ transfer.from }} deve dare {{ transfer.amount }}€ a {{ transfer.to }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExpenseSplitter } from "~/composable/useExpenseSplitter";

const {
  participants,
  expenses,
  settlements,
  newExpense,
  hasExpenses,
  totalExpenses,
  addExpense,
  removeExpense,
  calculateSettlements,
  newParticipant,
  participantError,
  addParticipant,
  removeParticipant,
  canRemoveParticipant,
} = useExpenseSplitter();
</script>
