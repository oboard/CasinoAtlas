import Phaser from "phaser";

const RENDER_SCALE = 2;

function getDisplaySize(host: HTMLElement) {
  const bounds = host.getBoundingClientRect();

  return {
    width: Math.max(1, Math.round(bounds.width)),
    height: Math.max(1, Math.round(bounds.height)),
  };
}

function resizeGame(game: Phaser.Game, host: HTMLElement) {
  const displaySize = getDisplaySize(host);

  game.canvas.style.width = `${displaySize.width}px`;
  game.canvas.style.height = `${displaySize.height}px`;
  game.scale.resize(displaySize.width * RENDER_SCALE, displaySize.height * RENDER_SCALE);
}

export function createHighDensityGame(
  host: HTMLElement,
  config: Omit<Phaser.Types.Core.GameConfig, "parent" | "width" | "height" | "scale">,
) {
  const displaySize = getDisplaySize(host);
  const game = new Phaser.Game({
    ...config,
    parent: host,
    width: displaySize.width * RENDER_SCALE,
    height: displaySize.height * RENDER_SCALE,
    scale: { mode: Phaser.Scale.NONE },
  });
  const observer = new ResizeObserver(() => resizeGame(game, host));

  resizeGame(game, host);
  observer.observe(host);

  return {
    game,
    destroy() {
      observer.disconnect();
      game.destroy(true);
    },
  };
}
