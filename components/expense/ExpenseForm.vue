<template>
  <div class="mt-3">
    <p v-if="!participants.length" class="text-sm text-ink-muted">
      Aggiungi prima almeno una persona.
    </p>

    <form
      v-else
      class="rounded-panel border border-line bg-surface p-3 sm:p-4"
      @submit.prevent="submit"
    >
      <div class="grid gap-2 sm:grid-cols-[minmax(0,7rem)_minmax(0,7rem)_1fr_auto]">
        <div>
          <label for="expense-payer" class="sr-only">Chi ha pagato</label>
          <select id="expense-payer" v-model="newExpense.payer" class="field">
            <option v-for="person in participants" :key="person" :value="person">
              {{ person }}
            </option>
          </select>
        </div>

        <div>
          <label for="expense-amount" class="sr-only">Importo in euro</label>
          <input
            id="expense-amount"
            v-model="newExpense.amount"
            class="field tnum"
            type="number"
            inputmode="decimal"
            min="0.01"
            step="0.01"
            placeholder="Quanto?"
            :aria-invalid="Boolean(expenseError)"
            :aria-describedby="expenseError ? 'expense-error' : undefined"
          />
        </div>

        <div>
          <label for="expense-description" class="sr-only">Per cosa</label>
          <input
            id="expense-description"
            v-model="newExpense.description"
            class="field"
            placeholder="Per cosa? (facoltativo)"
            maxlength="60"
          />
        </div>

        <!-- full width on mobile, so it always has room for its label -->
        <button type="submit" class="btn-primary" :disabled="!newExpense.amount">
          <IconPlus />
          <span>Aggiungi</span>
        </button>
      </div>

      <p class="mt-2 text-xs text-ink-muted">
        Divisa tra le {{ participants.length }} persone di adesso. Chi entra dopo
        non paga questa spesa.
      </p>
    </form>

    <p
      v-if="expenseError"
      id="expense-error"
      role="alert"
      class="mt-2 text-sm text-danger"
    >
      {{ expenseError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import IconPlus from "~/components/ui/IconPlus.vue";
import { useExpenseSplitterStore } from "~/store/expense";
import { useParticipantsStore } from "~/store/participant";

const { participants } = storeToRefs(useParticipantsStore());
const splitterStore = useExpenseSplitterStore();
const { newExpense, expenseError } = storeToRefs(splitterStore);

const submit = () => splitterStore.addExpense();
</script>
