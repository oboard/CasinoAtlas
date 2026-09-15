<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowRight,
  ChevronRight,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-vue-next";
import { categories, games } from "../data/games";
import { isChinese, locale } from "../i18n";
import { useCasinoStore } from "../stores/casino";
const search = ref("");
const category = ref<keyof typeof categories>("all");
const store = useCasinoStore();
const filtered = computed(() =>
  games.filter(
    (g) =>
      (category.value === "all" || g.category === category.value) &&
      [g.name[locale.value], ...g.aliases]
        .join(" ")
        .toLowerCase()
        .includes(search.value.toLowerCase()),
  ),
);
const featured = computed(() => games.filter((g) => g.featured));
</script>
<template>
  <main class="lobby-world">
    <section class="lobby-top page-shell">
      <div class="player-panel">
        <div class="avatar-orb">A</div>
        <div>
          <small>{{ isChinese ? "档案 · 虚拟探索" : "PROFILE · VIRTUAL EXPLORER" }}</small
          ><b>{{ isChinese ? "世界赌场博物馆" : "WORLD CASINO MUSEUM" }}</b
          ><span>{{ isChinese ? "已探索玩法" : "GAMES EXPLORED" }} · {{ store.totalGames }}</span>
        </div>
      </div>
      <div class="safety-pill">
        <ShieldCheck :size="15" />{{ isChinese ? "100% 虚拟筹码" : "100% VIRTUAL CHIPS" }}
      </div>
    </section>
    <section class="game-map page-shell">
      <div class="map-grid"></div>
      <div class="map-copy">
        <p class="eyebrow">
          <Sparkles :size="15" />
          {{ isChinese ? "选择你的下一站" : "CHOOSE YOUR NEXT DESTINATION" }}
        </p>
        <h1>{{ isChinese ? "国际赌场游艺馆" : "THE INTERNATIONAL PLAY HALL" }}</h1>
        <p>
          {{
            isChinese
              ? "选择一张游戏桌，学习规则、尝试虚拟筹码，并把每一局当作概率实验。"
              : "Choose a table, learn the rules, try virtual chips, and treat every round as a probability experiment."
          }}
        </p>
        <RouterLink to="/game/blackjack" class="quest-button"
          ><span class="quest-glyph">♠</span
          ><span
            ><small>{{ isChinese ? "推荐任务" : "FEATURED QUEST" }}</small
            ><b>{{ isChinese ? "进入 21 点练习桌" : "ENTER BLACKJACK TABLE" }}</b></span
          ><ArrowRight :size="18"
        /></RouterLink>
      </div>
      <div class="map-tables">
        <RouterLink
          v-for="game in featured.slice(0, 6)"
          :key="game.id"
          :to="game.status === 'playable' ? `/game/${game.id}` : '#'"
          class="map-table"
          :class="[`table-${game.id}`, { locked: game.status === 'soon' }]"
          ><span class="table-glow"></span><span class="map-icon">{{ game.icon }}</span
          ><b>{{ game.name[locale] }}</b
          ><small>{{
            game.status === "playable"
              ? isChinese
                ? "可游玩"
                : "PLAY NOW"
              : isChinese
                ? "筹备中"
                : "COMING SOON"
          }}</small
          ><LockKeyhole v-if="game.status === 'soon'" :size="12" /></RouterLink
        >)
      </div>
      <div class="map-compass">
        <span>✦</span><b>{{ isChinese ? "全球玩法地图" : "GLOBAL PLAY MAP" }}</b
        ><small>{{ isChinese ? "向下探索全部游戏桌" : "SCROLL TO EXPLORE" }}</small>
      </div>
    </section>
    <section class="mission-strip page-shell">
      <div class="mission-index">01</div>
      <div>
        <small>{{ isChinese ? "当前推荐" : "TODAY’S EXPLORATION" }}</small>
        <h2>{{ isChinese ? "认识 Blackjack 的胜负逻辑" : "Understand Blackjack outcomes" }}</h2>
      </div>
      <p>
        {{
          isChinese
            ? "学会要牌、停牌、加倍与分牌；每个结算都附带原因解释。"
            : "Learn hit, stand, double, and split—every result includes a clear explanation."
        }}
      </p>
      <RouterLink to="/game/blackjack"><ChevronRight :size="23" /></RouterLink>
    </section>
    <section class="table-gallery page-shell">
      <div class="gallery-heading">
        <div>
          <p class="eyebrow">GAME TABLE DIRECTORY</p>
          <h2>{{ isChinese ? "选择一张桌子开始" : "Choose a table to begin" }}</h2>
        </div>
        <label class="game-search"
          ><Search :size="18" /><input
            v-model="search"
            :placeholder="
              isChinese ? '搜索 21点、百家乐、Sic Bo…' : 'Search Blackjack, Baccarat, Sic Bo…'
            "
        /></label>
      </div>
      <div class="catalog-tabs">
        <button
          v-for="(_, key) in categories"
          :key="key"
          :class="{ active: category === key }"
          @click="category = key"
        >
          {{ categories[key][locale] }}
        </button>
      </div>
      <div class="table-grid">
        <article
          v-for="game in filtered"
          :key="game.id"
          class="table-card"
          :class="{ playable: game.status === 'playable' }"
        >
          <div class="table-card-top">
            <span class="table-token">{{ game.icon }}</span
            ><span>EDGE · {{ game.houseEdge }}</span>
          </div>
          <h3>{{ game.name[locale] }}</h3>
          <p>{{ game.description[locale] }}</p>
          <RouterLink v-if="game.status === 'playable'" :to="`/game/${game.id}`"
            >{{ isChinese ? "坐下游玩" : "TAKE A SEAT" }} <ArrowRight :size="16" /></RouterLink
          ><span v-else class="locked-label"
            ><LockKeyhole :size="13" />{{ isChinese ? "筹备中" : "IN DEVELOPMENT" }}</span
          >
        </article>
      </div>
    </section>
  </main>
</template>
