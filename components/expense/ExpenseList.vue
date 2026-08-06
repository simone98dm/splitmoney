<template>
  <ul v-if="hasExpenses" class="mt-3">
    <li
      v-for="expense in orderedExpenses"
      :key="expense.id"
      class="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0"
    >
      <span class="min-w-0 flex-1">
        <span class="block truncate">
          {{ expense.description || "Spesa" }}
        </span>
        <span class="block text-sm text-ink-muted">
          {{ expense.payer }} · diviso tra {{ expense.participants.length }}
        </span>
      </span>

      <span class="tnum shrink-0 font-medium">
        {{ formatEuro(expense.amount) }}
      </span>

      <button
        class="btn-icon -mr-2 hover:text-danger"
        :aria-label="`Elimina ${expense.description || 'spesa'} di ${formatEuro(expense.amount)}`"
        @click="splitterStore.removeExpense(expense.id)"
      >
        <IconTrash />
      </button>
    </li>
  </ul>

  <p v-else class="mt-3 text-sm text-ink-muted">
    Nessuna spesa. Aggiungi la prima qui sopra.
  </p>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import IconTrash from "~/components/ui/IconTrash.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { formatEuro } from "~/store/money";

const splitterStore = useExpenseSplitterStore();
const { expenses, hasExpenses } = storeToRefs(splitterStore);

// newest first: the one you just typed is the one you check
const orderedExpenses = computed(() =>
  [...expenses.value].sort((a, b) => b.timestamp - a.timestamp)
);
</script>
