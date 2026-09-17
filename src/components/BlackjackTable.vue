<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Phaser from "phaser";
import { BlackjackScene, type BlackjackScenePayload } from "../phaser/blackjack/BlackjackScene";
import { createHighDensityGame } from "../phaser/core/createHighDensityGame";
import type { BlackjackCommand } from "../phaser/gameBridge";

const props = defineProps<{ payload: BlackjackScenePayload }>();
const emit = defineEmits<{ action: [command: BlackjackCommand] }>();
const host = ref<HTMLDivElement>();
let game: Phaser.Game | undefined;
let destroyGame: (() => void) | undefined;

function pushState() {
  const scene = game?.scene.getScene("blackjack-table") as BlackjackScene | undefined;
  scene?.events.emit("state", props.payload);
}

onMounted(() => {
  if (!host.value) return;

  const highDensityGame = createHighDensityGame(host.value, {
    type: Phaser.AUTO,
    backgroundColor: "#030914",
    scene: BlackjackScene,
    render: { antialias: true, antialiasGL: true, roundPixels: true, pixelArt: false },
  });
  game = highDensityGame.game;
  destroyGame = () => highDensityGame.destroy();
  game.registry.set("casinoAtlasAction", (command: BlackjackCommand) => emit("action", command));
  window.setTimeout(pushState, 40);
});
watch(() => props.payload, pushState, { deep: true });
onBeforeUnmount(() => destroyGame?.());
</script>

<template>
  <div ref="host" class="arcade-table" aria-label="Interactive Blackjack table"></div>
</template>
