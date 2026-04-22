import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

/**
 * ElevatedPreset — Aura with deeper shadow/elevation tokens for all overlay
 * and surface components. Non-overlay components (DataTable, Button, etc.)
 * are handled via global CSS in assets/styles/main.css.
 */
const ElevatedPreset = definePreset(Aura, {
  components: {
    card: {
      root: {
        shadow:
          '0 4px 16px -2px rgba(0, 0, 0, 0.10), 0 2px 6px -2px rgba(0, 0, 0, 0.07)',
      },
    },
    dialog: {
      root: {
        shadow: '0 24px 48px -12px rgba(0, 0, 0, 0.22)',
        borderRadius: '1rem',
      },
    },
    drawer: {
      root: {
        shadow: '0 24px 48px -12px rgba(0, 0, 0, 0.22)',
      },
    },
    tooltip: {
      root: {
        shadow: '0 4px 12px rgba(0, 0, 0, 0.14)',
      },
    },
    popover: {
      root: {
        shadow:
          '0 10px 20px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
      },
    },
    menu: {
      root: {
        shadow:
          '0 10px 20px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
      },
    },
    tieredmenu: {
      root: {
        shadow:
          '0 10px 20px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
      },
    },
    contextmenu: {
      root: {
        shadow:
          '0 10px 20px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -4px rgba(0, 0, 0, 0.08)',
      },
    },
  },
});

export default ElevatedPreset;
