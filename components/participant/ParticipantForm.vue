<template>
  <div class="flex gap-2 mb-4">
    <div class="flex-grow">
      <input
        v-model="newParticipant"
        placeholder="Nome nuovo partecipante"
        class="p-2 border rounded w-full"
        @keyup.enter="participantStore.addParticipant"
      />
      <p v-if="participantError" class="text-red-500 text-sm mt-1">
        {{ participantError }}
      </p>
    </div>
    <button
      @click="participantStore.addParticipant"
      class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

const participantStore = useParticipantsStore();
const { newParticipant, participantError } = storeToRefs(participantStore);
</script>
