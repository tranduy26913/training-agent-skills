import { createApp } from 'vue';
import App from './App.vue';
import { setupPrimeVue } from '@/plugins/primevue';
import { setupPinia } from '@/plugins/pinia';
import { setupRouter } from '@/plugins/router';
import '@/assets/styles/main.css';

const app = createApp(App);

setupPinia(app);
setupPrimeVue(app);
setupRouter(app);

app.mount('#app');
