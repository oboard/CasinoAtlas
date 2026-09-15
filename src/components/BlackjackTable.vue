<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import Phaser from "phaser";
import { BlackjackScene, type BlackjackScenePayload } from "../phaser/blackjack/BlackjackScene";
import type { BlackjackCommand } from "../phaser/gameBridge";

const props = defineProps<{ payload: BlackjackScenePayload }>();
const emit = defineEmits<{ action: [command: BlackjackCommand] }>();
const host = ref<HTMLDivElement>();
let game: Phaser.Game | undefined;

function pushState() {
  const scene = game?.scene.getScene("blackjack-table") as BlackjackScene | undefined;
  scene?.events.emit("state", props.payload);
}

onMounted(() => {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: host.value,
    // Phaser owns a real canvas sized to its parent window. No fixed 1280×720
    // bitmap is stretched on high-density screens.
    width: "100%",
    height: "100%",
    backgroundColor: "#030914",
    scene: BlackjackScene,
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, antialiasGL: true, roundPixels: true, pixelArt: false },
  });
  game.registry.set("casinoAtlasAction", (command: BlackjackCommand) => emit("action", command));
  window.setTimeout(pushState, 40);
});
watch(() => props.payload, pushState, { deep: true });
onBeforeUnmount(() => game?.destroy(true));
</script>

<template>
  <div ref="host" class="arcade-table" aria-label="Interactive Blackjack table"></div>
</template>
