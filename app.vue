<template>
  <div class="flex flex-col h-screen justify-between">
    <main class="container mx-auto">
      <div class="flex justify-between items-center sm:p-2">
        <span></span>
        <h2 class="text-2xl text-center font-bold">Divisione Spese</h2>
        <button v-if="!roomId" @click="expenseStore.generateUrl()">
          Copy link
        </button>
        <button v-else @click="expenseStore.saveRoom()">Save</button>
      </div>
      <ExpenseSplitter />
    </main>
    <footer class="h-10 text-center text-gray-500 text-xs">
      <p>Made with ❤️ by <a href="https://simone98dm.dev">simone98dm</a></p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useExpenseSplitterStore } from "~/store/expense";

const expenseStore = useExpenseSplitterStore();
const { roomId } = storeToRefs(expenseStore);

onMounted(async () => {
  const route = useRoute();
  if (route.query.room) {
    await expenseStore.init(route.query.room as string);
  }
});
</script>
