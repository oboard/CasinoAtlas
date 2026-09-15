import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import BlackjackPage from "../pages/BlackjackPage.vue";
import LearnPage from "../pages/LearnPage.vue";
import RandomnessPage from "../pages/RandomnessPage.vue";
export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/game/blackjack", component: BlackjackPage },
    { path: "/learn", component: LearnPage },
    { path: "/learn/randomness", component: RandomnessPage },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
