<template>
  <!--
    Opaque, not translucent: at 95% + blur the expense list smeared through
    the figure. Glass here bought nothing and cost legibility.
  -->
  <header class="sticky top-0 z-20 border-b border-line bg-bg">
    <div
      class="mx-auto max-w-2xl px-4 transition-[padding] duration-200 ease-out sm:px-6"
      :class="isCondensed ? 'pb-3 pt-3' : 'pb-4 pt-5'"
    >
      <!--
        The page's visual anchor is a number, which cannot be a heading.
        Without this the document outline starts at h2 and has no root.
      -->
      <h1 class="sr-only">SplitMoney — riepilogo delle spese di gruppo</h1>

      <!-- First run: the app cannot answer "what do I owe" until it knows who you are -->
      <div v-if="needsIdentity">
        <p class="text-lg font-semibold">Chi sei?</p>
        <p class="mt-1 text-sm text-ink-muted">
          Serve solo per mostrarti il tuo saldo in cima.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="person in sortedParticipants"
            :key="person"
            class="btn-ghost"
            @click="participantsStore.setMe(person)"
          >
            {{ person }}
          </button>
          <button class="btn text-sm text-ink-muted hover:text-ink" @click="participantsStore.skipMe()">
            Salta
          </button>
        </div>
      </div>

      <!-- Everyone is square: the event is over and the app says so -->
      <div v-else-if="isAllSettled && hasExpenses">
        <p class="eyebrow">Fatto</p>
        <p class="mt-1 text-figure font-semibold">Siete in pari</p>
        <p class="mt-1 text-sm text-ink-muted">
          Nessun pagamento da fare. {{ expenseCountLabel }} per
          <span class="tnum">{{ totalLabel }}</span
          >.
        </p>
      </div>

      <!-- The number the person opened the app for -->
      <div v-else>
        <div class="flex items-baseline justify-between gap-3">
          <p class="eyebrow">{{ isMeSelected ? "Il tuo saldo" : "Totale speso" }}</p>
          <button
            v-if="isMeSelected"
            class="-mr-2 inline-flex min-h-[44px] items-center rounded px-2 text-xs text-ink-muted hover:text-ink"
            @click="participantsStore.clearMe()"
          >
            Sono {{ me }} · cambia
          </button>
          <!--
            Already answered "skip": offer the way back in, but never repeat
            the question verbatim or it reads as still unanswered.
          -->
          <button
            v-else-if="sortedParticipants.length"
            class="-mr-2 inline-flex min-h-[44px] items-center rounded px-2 text-xs text-ink-muted hover:text-ink"
            @click="participantsStore.clearMe()"
          >
            Mostra il mio saldo
          </button>
        </div>

        <!--
          Condensed: figure and label sit on one line so the header gives the
          list back its screen. The number never disappears.
        -->
        <div
          class="mt-1 flex items-baseline gap-3"
          :class="isCondensed ? 'flex-row' : 'flex-col items-start gap-0'"
        >
          <p>
            <MoneyFigure
              v-if="isMeSelected"
              :amount="myBalance"
              :size="isCondensed ? 'row' : 'display'"
            />
            <MoneyFigure
              v-else
              :amount="totalExpenses"
              :size="isCondensed ? 'row' : 'display'"
              :signed="false"
            />
          </p>

          <p
            class="text-base"
            :class="[statusTone, isCondensed ? '' : 'mt-1']"
          >
            {{ statusLabel }}
          </p>
        </div>

        <dl
          v-if="!isCondensed"
          class="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-line pt-3 text-sm"
        >
          <div class="flex items-baseline gap-1.5">
            <dt class="text-ink-muted">Spese</dt>
            <dd class="tnum font-medium">{{ expenses.length }}</dd>
          </div>
          <div v-if="isMeSelected" class="flex items-baseline gap-1.5">
            <dt class="text-ink-muted">Totale</dt>
            <dd class="tnum font-medium">{{ totalLabel }}</dd>
          </div>
          <div class="flex items-baseline gap-1.5">
            <dt class="text-ink-muted">Da saldare</dt>
            <dd class="tnum font-medium">{{ settlements.length }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import MoneyFigure from "~/components/ui/MoneyFigure.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";
import { formatEuro } from "~/store/money";
import { useScrolledPast } from "~/composables/useScrolledPast";

const isCondensed = useScrolledPast(120);

const participantsStore = useParticipantsStore();
const { sortedParticipants, me, isMeAnswered, isMeSelected } =
  storeToRefs(participantsStore);
const { expenses, balances, settlements, totalExpenses, hasExpenses } =
  storeToRefs(useExpenseSplitterStore());

const needsIdentity = computed(
  () => !isMeAnswered.value && sortedParticipants.value.length > 0
);

const myBalance = computed(() =>
  isMeSelected.value ? (balances.value[me.value as string] ?? 0) : 0
);

const isAllSettled = computed(() => settlements.value.length === 0);

const statusLabel = computed(() => {
  if (!isMeSelected.value) {
    return hasExpenses.value
      ? `divisi tra ${sortedParticipants.value.length} persone`
      : "nessuna spesa ancora";
  }
  if (myBalance.value > 0) return "ti spettano";
  if (myBalance.value < 0) return "devi dare";
  return "sei in pari";
});

const statusTone = computed(() => {
  if (!isMeSelected.value) return "text-ink-muted";
  return myBalance.value < 0 ? "text-owe" : "text-ink-muted";
});

const totalLabel = computed(() => formatEuro(totalExpenses.value));
const expenseCountLabel = computed(
  () => `${expenses.value.length} ${expenses.value.length === 1 ? "spesa" : "spese"}`
);
</script>
