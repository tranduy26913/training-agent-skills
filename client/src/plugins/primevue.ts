import type { App } from 'vue';
import PrimeVue from 'primevue/config';
import ElevatedPreset from './themes/elevated';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import 'primeicons/primeicons.css';

export function setupPrimeVue(app: App): void {
  app.use(PrimeVue, {
    theme: {
      preset: ElevatedPreset,
      options: {
        darkModeSelector: '.dark',
      },
    },
  });
  app.use(ToastService);
  app.use(ConfirmationService);
  // Register v-tooltip directive globally so it works in all components
  app.directive('tooltip', Tooltip);
}
