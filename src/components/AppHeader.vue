<script setup lang="ts">
import { BookOpen, Dices, FlaskConical, Menu, Sparkles, Trophy } from "lucide-vue-next";
import { locale, setLocale } from "../i18n";
import { useCasinoStore } from "../stores/casino";
const store = useCasinoStore();
</script>
<template>
  <header class="app-header game-hud">
    <RouterLink to="/" class="brand"
      ><span class="brand-mark"><Sparkles :size="19" /></span
      ><span>CASINO<br /><b>ATLAS</b></span></RouterLink
    >
    <nav class="hud-nav">
      <RouterLink to="/"
        ><Dices :size="16" />{{ locale === "zh-CN" ? "游戏大厅" : "GAME LOBBY" }}</RouterLink
      ><RouterLink to="/learn"
        ><BookOpen :size="16" />{{ locale === "zh-CN" ? "图鉴" : "CODEX" }}</RouterLink
      ><RouterLink to="/learn/randomness"
        ><FlaskConical :size="16" />{{ locale === "zh-CN" ? "实验室" : "LAB" }}</RouterLink
      >
    </nav>
    <div class="header-actions">
      <div class="hud-level">
        <Trophy :size="15" /><span>{{ locale === "zh-CN" ? "探索者" : "EXPLORER" }}</span
        ><b>{{ store.totalGames }}</b>
      </div>
      <div class="language">
        <button :class="{ active: locale === 'zh-CN' }" @click="setLocale('zh-CN')">中</button
        ><button :class="{ active: locale === 'en-US' }" @click="setLocale('en-US')">EN</button>
      </div>
      <button class="icon-button"><Menu :size="20" /></button>
    </div>
  </header>
</template>
