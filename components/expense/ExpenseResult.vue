<template>
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
</template>

<script setup lang="ts">
import { useExpenseSplitterStore } from "~/store/expense";
import { storeToRefs } from "pinia";

const { settlements } = storeToRefs(useExpenseSplitterStore());
</script>
