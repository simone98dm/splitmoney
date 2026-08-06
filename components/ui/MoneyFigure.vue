<template>
  <span
    :key="amount"
    class="tnum figure-settle inline-flex items-baseline"
    :class="[sizeClass, toneClass]"
  >
    {{ formatted }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatEuro, formatSignedEuro } from "~/store/money";

const props = withDefaults(
  defineProps<{
    amount: number;
    size?: "display" | "row" | "base" | "sm";
    /** Off for totals, which have no debtor/creditor meaning to carry. */
    signed?: boolean;
  }>(),
  { size: "base", signed: true }
);

/**
 * The sign is what makes this readable without color — greyscale, colorblind,
 * or a blown-out screen in the sun all still resolve it. Color is redundant
 * reinforcement, never the carrier (WCAG 1.4.1).
 */
const formatted = computed(() =>
  props.signed ? formatSignedEuro(props.amount) : formatEuro(props.amount)
);

const sizeClass = computed(
  () =>
    ({
      display: "text-display sm:text-display-lg font-semibold",
      // deliberately half the display size: the row figures must stay under
      // the header's number, which is the one the user came for
      row: "text-xl font-semibold",
      base: "text-base font-medium",
      sm: "text-sm font-medium",
    })[props.size]
);

const toneClass = computed(() => {
  if (!props.signed) return "text-ink";
  // a settled balance is not news — a page of bright zeros buries the two
  // rows that actually need paying
  if (props.amount === 0) return "text-ink-muted font-normal";
  return props.amount < 0 ? "text-owe" : "text-ink";
});
</script>
