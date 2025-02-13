<template>
  <div>
    <h3 class="text-xl font-semibold mb-4">Costi da splittare</h3>
    <!-- Form per aggiungere spese -->
    <ExpenseForm />

    <!-- Lista delle spese -->
    <ExpenseList />

    <!-- Risultati -->
    <ExpenseResult />
  </div>
</template>

<script setup lang="ts">
import ExpenseResult from "~/components/expense/ExpenseResult.vue";
import ExpenseForm from "~/components/expense/ExpenseForm.vue";
import ExpenseList from "~/components/expense/ExpenseList.vue";
</script>
