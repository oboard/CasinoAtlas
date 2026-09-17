<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Phaser from "phaser";
import { useRouter } from "vue-router";
import { games } from "../data/games";
import { isChinese, locale, setLocale } from "../i18n";
import { CasinoLobbyScene, type CasinoLobbyCommand } from "../phaser/lobby/CasinoLobbyScene";
import { createHighDensityGame } from "../phaser/core/createHighDensityGame";
import { useCasinoStore } from "../stores/casino";

const host = ref<HTMLDivElement>();
const router = useRouter();
const store = useCasinoStore();
let game: Phaser.Game | undefined;
let destroyGame: (() => void) | undefined;

const labels = computed(() =>
  isChinese.value
    ? {
        profile: "档案 · 虚拟探索",
        explorer: "世界赌场博物馆",
        explored: "已探索局数 ·",
        safe: "仅使用虚拟筹码",
        playNow: "可游玩",
        comingSoon: "筹备中",
        featuredQuest: "推荐任务",
        hallTable: "游艺馆桌台",
        edge: "理论优势 ·",
        enterTable: "进入练习桌",
        learn: "图鉴",
        lab: "概率实验室",
        language: "切换 English",
        navigationHint: "方向键选择桌台 · ENTER 入座 · L 图鉴 · R 实验室",
        lockedNotice: "这张桌子正在布置中，敬请期待。",
      }
    : {
        profile: "PROFILE · VIRTUAL EXPLORER",
        explorer: "WORLD CASINO MUSEUM",
        explored: "ROUNDS EXPLORED ·",
        safe: "VIRTUAL CHIPS ONLY",
        playNow: "PLAY NOW",
        comingSoon: "COMING SOON",
        featuredQuest: "FEATURED QUEST",
        hallTable: "PLAY HALL TABLE",
        edge: "HOUSE EDGE ·",
        enterTable: "ENTER TABLE",
        learn: "CODEX",
        lab: "PROBABILITY LAB",
        language: "切换中文",
        navigationHint: "ARROWS SELECT A TABLE · ENTER SIT DOWN · L CODEX · R LAB",
        lockedNotice: "THIS TABLE IS BEING PREPARED. CHECK BACK SOON.",
      },
);

const payload = computed(() => ({
  tables: games
    .filter((game) =>
      ["slots", "baccarat", "blackjack", "roulette", "sicbo", "mahjong"].includes(game.id),
    )
    .map((game) => ({
      id: game.id,
      icon: game.icon,
      name: game.name[locale.value],
      description: game.description[locale.value],
      houseEdge: game.houseEdge,
      status: game.status,
    })),
  explored: store.totalGames,
  labels: labels.value,
}));

function pushState() {
  game?.registry.set("casinoAtlasLobbyPayload", payload.value);
  const scene = game?.scene.getScene("casino-lobby") as CasinoLobbyScene | undefined;
  scene?.events.emit("state", payload.value);
}

function handle(command: CasinoLobbyCommand) {
  if (command.type === "table:open") {
    if (command.id === "blackjack") router.push("/game/blackjack");
    return;
  }
  if (command.type === "navigate") {
    router.push(command.path);
    return;
  }
  setLocale(locale.value === "zh-CN" ? "en-US" : "zh-CN");
}

onMounted(() => {
  if (!host.value) return;

  const highDensityGame = createHighDensityGame(host.value, {
    type: Phaser.AUTO,
    backgroundColor: "#02050c",
    scene: CasinoLobbyScene,
    render: { antialias: true, antialiasGL: true, roundPixels: true, pixelArt: false },
  });
  game = highDensityGame.game;
  destroyGame = () => highDensityGame.destroy();
  game.registry.set("casinoAtlasLobbyAction", (command: CasinoLobbyCommand) => handle(command));
  window.setTimeout(pushState, 40);
});

watch(payload, pushState, { deep: true });
onBeforeUnmount(() => destroyGame?.());
</script>

<template>
  <div
    ref="host"
    class="casino-lobby-canvas"
    aria-label="Interactive Casino Atlas game lobby"
  ></div>
</template>
