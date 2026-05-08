// ## 应用入口 ──────────────────────────────────────────────────────────────
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/tokens.css'
import './assets/main.css'

createApp(App).use(createPinia()).use(router).mount('#app')
