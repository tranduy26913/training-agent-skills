import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useUiStore = defineStore("ui", () => {
  type AccentColor = "sky" | "violet" | "emerald" | "rose";
  const sidebarCollapsed = ref(false);
  const mobileSidebarOpen = ref(false);
  const darkMode = ref(localStorage.getItem("darkMode") === "true");
  const accentColor = ref<AccentColor>(
    (localStorage.getItem("accentColor") as AccentColor) || "sky",
  );
  const loadingRequests = ref(0);
  const isLoading = computed(() => loadingRequests.value > 0);

  // Apply dark mode class on init
  if (darkMode.value) {
    document.documentElement.classList.add("dark");
  }
  document.documentElement.dataset.accent = accentColor.value;

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function toggleMobileSidebar(): void {
    mobileSidebarOpen.value = !mobileSidebarOpen.value;
  }

  function closeMobileSidebar(): void {
    mobileSidebarOpen.value = false;
  }

  function startLoading(): void {
    loadingRequests.value += 1;
  }

  function stopLoading(): void {
    loadingRequests.value = Math.max(0, loadingRequests.value - 1);
  }

  function toggleDarkMode(): void {
    darkMode.value = !darkMode.value;
    localStorage.setItem("darkMode", String(darkMode.value));
    if (darkMode.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function setAccentColor(color: AccentColor): void {
    accentColor.value = color;
    localStorage.setItem("accentColor", color);
    document.documentElement.dataset.accent = color;
  }

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    darkMode,
    accentColor,
    isLoading,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    toggleDarkMode,
    setAccentColor,
    startLoading,
    stopLoading,
  };
});
