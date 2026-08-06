<template>
  <section aria-labelledby="settlement-heading">
    <div class="flex items-baseline justify-between gap-3">
      <h2 id="settlement-heading" class="text-xl font-semibold">Per chiudere</h2>
      <p v-if="settlements.length" class="tnum text-sm text-ink-muted">
        {{ settlements.length }}
        {{ settlements.length === 1 ? "pagamento" : "pagamenti" }}
      </p>
    </div>

    <!-- The ledger could not be computed: never render a plan we do not trust -->
    <p
      v-if="settlementError"
      role="alert"
      class="mt-3 rounded-panel border border-danger px-4 py-3 text-sm text-danger"
    >
      Non riesco a calcolare i pagamenti: {{ settlementError }}
    </p>

    <!-- These are instructions to carry out, so they are numbered -->
    <ol v-else-if="settlements.length" class="mt-3">
      <li
        v-for="(transfer, index) in settlements"
        :key="`${transfer.from}-${transfer.to}`"
        class="flex items-center gap-3 border-b border-line py-3 last:border-b-0"
      >
        <span
          class="tnum flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sm text-ink-muted"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>

        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2">
          <span class="truncate font-medium">{{ transfer.from }}</span>
          <IconArrow class="shrink-0 text-ink-muted" />
          <span class="truncate font-medium">{{ transfer.to }}</span>
        </span>

        <MoneyFigure :amount="transfer.amount" :signed="false" />
      </li>
    </ol>

    <!-- The event is over. This is the moment the whole app exists for. -->
    <div
      v-else-if="hasExpenses"
      class="mt-3 rounded-panel border border-line bg-surface px-4 py-6 text-center"
    >
      <p class="text-figure font-semibold">Nessun pagamento da fare</p>
      <p class="mt-1 text-sm text-ink-muted">
        I conti tornano: ognuno ha pagato esattamente la sua parte.
      </p>
    </div>

    <p v-else class="mt-3 text-sm text-ink-muted">
      Quando aggiungi delle spese, qui compaiono i pagamenti da fare per
      pareggiare i conti.
    </p>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import MoneyFigure from "~/components/ui/MoneyFigure.vue";
import IconArrow from "~/components/ui/IconArrow.vue";
import { useExpenseSplitterStore } from "~/store/expense";

const { settlements, settlementError, hasExpenses } = storeToRefs(
  useExpenseSplitterStore()
);
</script>
