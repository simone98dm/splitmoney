<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    <div
      v-for="participant in sortedParticipants"
      :key="participant"
      class="p-3 bg-gray-50 rounded shadow-sm"
    >
      <!-- Modalità visualizzazione -->
      <div v-if="editingParticipant?.original !== participant">
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ participant }}</span>
          <div class="flex gap-2">
            <button
              @click="participantStore.startEditing(participant)"
              class="text-blue-500 hover:text-blue-600"
              title="Modifica nome"
            >
              ✎
            </button>
            <button
              v-if="isSettled(participant)"
              @click="participantStore.confirmRemove(participant)"
              class="text-red-500 hover:text-red-600"
              title="Rimuovi partecipante"
            >
              ✕
            </button>
            <span
              v-else
              class="text-gray-400 text-sm"
              title="Non rimuovibile: ha ancora un saldo aperto"
            >
              €
            </span>
          </div>
        </div>

        <!-- Statistiche partecipante -->
        <ParticipantStats :participant="participant" />
      </div>

      <!-- Modalità modifica -->
      <div v-else class="flex gap-2">
        <input
          v-model="editingParticipant.new"
          class="p-1 border rounded flex-grow"
          @keyup.enter="applyRename"
          @keyup.esc="participantStore.cancelEditing"
        />
        <button
          @click="applyRename"
          class="text-green-500 hover:text-green-600"
          title="Salva"
        >
          ✓
        </button>
        <button
          @click="participantStore.cancelEditing"
          class="text-gray-500 hover:text-gray-600"
          title="Annulla"
        >
          ✕
        </button>
      </div>

      <!-- Conferma rimozione -->
      <div
        v-if="showRemoveConfirm === participant"
        class="mt-2 p-2 bg-red-50 rounded text-sm"
      >
        <p class="text-red-600 mb-2">Confermi la rimozione?</p>
        <div class="flex justify-end gap-2">
          <button
            @click="participantStore.removeParticipant(participant)"
            class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Conferma
          </button>
          <button
            @click="participantStore.cancelRemove"
            class="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ParticipantStats from "~/components/participant/ParticipantStats.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

const splitterStore = useExpenseSplitterStore();
const { balances } = storeToRefs(splitterStore);
const participantStore = useParticipantsStore();
const { sortedParticipants, editingParticipant, showRemoveConfirm } =
  storeToRefs(participantStore);

/** Removing someone who is still owed (or still owes) money would hide a debt. */
const isSettled = (participant: string) => !balances.value[participant];

/** Applies the rename to the roster and the expense snapshots in one step. */
const applyRename = () => splitterStore.commitRename();
</script>
