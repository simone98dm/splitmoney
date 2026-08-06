import { onMounted, onUnmounted, ref } from "vue";

/**
 * True once the page has scrolled past `threshold`.
 *
 * Used to condense the sticky header: at the top it can afford the full
 * figure plus the stats strip, but 22% of a phone screen is too much to hold
 * permanently while someone scrolls a list of expenses.
 */
export const useScrolledPast = (threshold = 120) => {
  const isPast = ref(false);
  const update = () => {
    isPast.value = window.scrollY > threshold;
  };

  onMounted(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
  });

  onUnmounted(() => window.removeEventListener("scroll", update));

  return isPast;
};
