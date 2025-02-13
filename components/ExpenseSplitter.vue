<template>
  <div class="p-4">
    <h2 class="text-2xl text-center font-bold mb-6">Divisione Spese</h2>
    <ParticipantPanel />
    <ExpensePanel />
  </div>
</template>

<script setup lang="ts">
import ExpensePanel from "~/components/expense/ExpensePanel.vue";
import ParticipantPanel from "~/components/participant/ParticipantPanel.vue";
</script>
