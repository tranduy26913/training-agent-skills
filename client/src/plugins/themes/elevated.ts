import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

/**
 * ElevatedPreset  EAura with deeper shadow/elevation tokens for all overlay
 * and surface components. Non-overlay components (DataTable, Button, etc.)
 * are handled via global CSS in assets/styles/main.css.
 */
const ElevatedPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: '{primary.300}',
          focusColor: '{primary.200}',
        },
      },
    },
  },
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
