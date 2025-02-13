<template>
  <!-- Gestione Partecipanti -->
  <div class="mb-8 pb-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-semibold">Partecipanti</h3>
      <span class="text-sm text-gray-600">
        {{ participants.length }} partecipanti
      </span>
    </div>

    <!-- Form aggiunta partecipante -->
    <ParticipantForm />

    <!-- Lista partecipanti -->
    <ParticipantList />
  </div>
</template>

<script setup lang="ts">
import ParticipantForm from "~/components/participant/ParticipantForm.vue";
import ParticipantList from "~/components/participant/ParticipantList.vue";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

const { participants } = storeToRefs(useParticipantsStore());
</script>
