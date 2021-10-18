import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import "./index.css";

const routes = [
  {
    path: "/",
    component: () => import(`./pages/Objects.vue`),
  },
  {
    path: "/human",
    component: () => import(`./pages/Human.vue`),
  },
  {
    path: "/holistic",
    component: () => import(`./pages/Holistic.vue`),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");
