<template>
  <div class="p-4">
    <ParticipantPanel />
    <ExpensePanel />
  </div>
</template>

<script setup lang="ts">
import ExpensePanel from "~/components/expense/ExpensePanel.vue";
import ParticipantPanel from "~/components/participant/ParticipantPanel.vue";
</script>
