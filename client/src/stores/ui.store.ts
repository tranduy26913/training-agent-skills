import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false);
  const darkMode = ref(localStorage.getItem('darkMode') === 'true');

  // Apply dark mode class on init
  if (darkMode.value) {
    document.documentElement.classList.add('dark');
  }

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
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
    darkMode,
    toggleSidebar,
    toggleDarkMode,
  };
});
