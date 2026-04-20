import { createApp } from 'vue';
import App from './App.vue';
import { setupPrimeVue } from '@/plugins/primevue';
import { setupPinia } from '@/plugins/pinia';
import { setupRouter } from '@/plugins/router';
import { setupI18n } from '@/plugins/i18n';
import '@/assets/styles/main.css';

const app = createApp(App);

setupPinia(app);
setupPrimeVue(app);
setupI18n(app);
setupRouter(app);

app.mount('#app');
