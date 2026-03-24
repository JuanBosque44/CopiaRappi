import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import './style.css'
import { useUserStore } from './store/userStore.js';

const app = createApp(App);

const pinia = createPinia();
app.use(pinia);  
app.use(router);

const userStore = useUserStore();
userStore.restoreSession();
await userStore.validateSession();


app.mount('#app');
