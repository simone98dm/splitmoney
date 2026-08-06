<template>
  <div class="min-h-dvh">
    <BalanceHeader />

    <!--
      Rhythm, not uniform stacking: the zones are separated generously while
      rows inside them stay tight. The old layout used the same mb-6
      everywhere, so nothing read as more important than anything else.
    -->
    <main
      class="mx-auto max-w-2xl space-y-10 px-4 pb-16 pt-8 sm:space-y-14 sm:px-6"
    >
      <ParticipantPanel />
      <ExpensePanel />
      <SettlementPlan />
    </main>
  </div>
</template>

<script setup lang="ts">
import BalanceHeader from "~/components/balance/BalanceHeader.vue";
import ParticipantPanel from "~/components/participant/ParticipantPanel.vue";
import ExpensePanel from "~/components/expense/ExpensePanel.vue";
import SettlementPlan from "~/components/settlement/SettlementPlan.vue";
</script>
