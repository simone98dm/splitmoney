<template>
  <div class="mt-2 text-sm text-gray-600">
    <div class="grid grid-cols-2 gap-1">
      <div>Spese pagate:</div>
      <div class="text-right">
        {{
          participantStore.calculateParticipantStats(
            participant,
            expenses,
            participants.length
          ).numberOfExpenses
        }}
      </div>
      <div>Totale pagato:</div>
      <div class="text-right">
        {{
          participantStore
            .calculateParticipantStats(
              participant,
              expenses,
              participants.length
            )
            .totalPaid.toFixed(2)
        }}€
      </div>
      <div>Da ricevere:</div>
      <div
        class="text-right"
        :class="{
          'text-green-600':
            participantStore.calculateParticipantStats(
              participant,
              expenses,
              participants.length
            ).netBalance > 0,
          'text-red-600':
            participantStore.calculateParticipantStats(
              participant,
              expenses,
              participants.length
            ).netBalance < 0,
        }"
      >
        {{
          participantStore
            .calculateParticipantStats(
              participant,
              expenses,
              participants.length
            )
            .netBalance.toFixed(2)
        }}€
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

defineProps<{ participant: string }>();

const { expenses } = storeToRefs(useExpenseSplitterStore());
const participantStore = useParticipantsStore();
const { participants } = storeToRefs(participantStore);
</script>
