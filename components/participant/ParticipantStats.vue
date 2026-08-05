<template>
  <div class="mt-2 text-sm text-gray-600">
    <div class="grid grid-cols-2 gap-1">
      <div>Spese pagate:</div>
      <div class="text-right">{{ stats.numberOfExpenses }}</div>

      <div>Totale pagato:</div>
      <div class="text-right">{{ stats.totalPaid.toFixed(2) }}€</div>

      <div>Quota dovuta:</div>
      <div class="text-right">{{ stats.totalOwed.toFixed(2) }}€</div>

      <div>Da ricevere:</div>
      <div
        class="text-right"
        :class="{
          'text-green-600': stats.netBalance > 0,
          'text-red-600': stats.netBalance < 0,
        }"
      >
        {{ stats.netBalance.toFixed(2) }}€
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";
import { storeToRefs } from "pinia";

const props = defineProps<{ participant: string }>();

const { expenses } = storeToRefs(useExpenseSplitterStore());
const participantStore = useParticipantsStore();

const stats = computed(() =>
  participantStore.calculateParticipantStats(props.participant, expenses.value)
);
</script>
