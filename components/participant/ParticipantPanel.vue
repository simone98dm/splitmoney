<template>
  <section aria-labelledby="people-heading">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="people-heading" class="text-xl font-semibold">Le persone</h2>
      <p class="tnum text-sm text-ink-muted">
        {{ participants.length }}
      </p>
    </div>

    <ul v-if="sortedParticipants.length" class="mt-2">
      <ParticipantRow
        v-for="person in sortedParticipants"
        :key="person"
        :participant="person"
      />
    </ul>

    <p v-else class="mt-2 text-sm text-ink-muted">
      Aggiungi chi ha partecipato alla spesa. Servono almeno due persone.
    </p>

    <form class="mt-4 flex gap-2" @submit.prevent="add">
      <div class="min-w-0 flex-1">
        <label for="new-participant" class="sr-only">Nome partecipante</label>
        <input
          id="new-participant"
          v-model="newParticipant"
          class="field"
          placeholder="Aggiungi una persona"
          maxlength="20"
          :aria-invalid="Boolean(participantError)"
          :aria-describedby="participantError ? 'participant-error' : undefined"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="!newParticipant.trim()">
        <IconPlus />
        <span>Aggiungi</span>
      </button>
    </form>

    <p
      v-if="participantError"
      id="participant-error"
      role="alert"
      class="mt-2 text-sm text-danger"
    >
      {{ participantError }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import ParticipantRow from "~/components/participant/ParticipantRow.vue";
import IconPlus from "~/components/ui/IconPlus.vue";
import { useParticipantsStore } from "~/store/participant";

const participantsStore = useParticipantsStore();
const { participants, sortedParticipants, newParticipant, participantError } =
  storeToRefs(participantsStore);

const add = () => participantsStore.addParticipant();
</script>
