import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import "./index.css";

const routes = [
  {
    path: "/",
    component: () => import(`./pages/App1.vue`),
  },
  {
    path: "/app2",
    component: () => import(`./pages/App2.vue`),
  },
  {
    path: "/app3",
    component: () => import(`./pages/App3.vue`),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");
