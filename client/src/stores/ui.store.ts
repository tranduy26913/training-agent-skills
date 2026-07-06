import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false);
  const mobileSidebarOpen = ref(false);
  const darkMode = ref(localStorage.getItem('darkMode') === 'true');
  const loadingRequests = ref(0);
  const isLoading = computed(() => loadingRequests.value > 0);

  // Apply dark mode class on init
  if (darkMode.value) {
    document.documentElement.classList.add('dark');
  }

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
    localStorage.setItem('darkMode', String(darkMode.value));
    if (darkMode.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  return {
    sidebarCollapsed,
    mobileSidebarOpen,
    darkMode,
    isLoading,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    toggleDarkMode,
    startLoading,
    stopLoading,
  };
});
