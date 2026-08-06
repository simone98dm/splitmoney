<template>
  <div class="flex min-h-dvh flex-col">
    <ExpenseSplitter class="flex-1" />

    <footer class="border-t border-line px-4 py-4 text-center text-xs text-ink-muted">
      <p>
        Made with ❤️ by
        <a
          class="inline-flex min-h-[44px] items-center px-2 underline underline-offset-2 hover:text-ink"
          href="https://simone98dm.dev"
        >
          simone98dm
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ExpenseSplitter from "~/components/ExpenseSplitter.vue";
</script>
