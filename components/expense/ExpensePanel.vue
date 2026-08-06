<template>
  <section aria-labelledby="expenses-heading">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="expenses-heading" class="text-xl font-semibold">Le spese</h2>
      <p v-if="hasExpenses" class="tnum text-sm text-ink-muted">
        {{ formatEuro(totalExpenses) }}
      </p>
    </div>

    <ExpenseForm />
    <ExpenseList />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import ExpenseForm from "~/components/expense/ExpenseForm.vue";
import ExpenseList from "~/components/expense/ExpenseList.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { formatEuro } from "~/store/money";

const { hasExpenses, totalExpenses } = storeToRefs(useExpenseSplitterStore());
</script>
