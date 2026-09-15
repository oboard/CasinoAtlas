import Phaser from "phaser";

export interface ChipPalette {
  main: number;
  stripe: number;
  text: string;
}

export const CHIP_COLORS: Record<number, ChipPalette> = {
  10: { main: 0x3f7bcb, stripe: 0xfff4d6, text: "#eaf3ff" },
  25: { main: 0x27b06a, stripe: 0xfff4d6, text: "#f0fff8" },
  100: { main: 0x2a2f3f, stripe: 0xffd166, text: "#ffd166" },
  500: { main: 0x8e5cf0, stripe: 0xfff4d6, text: "#f3ecff" },
  1000: { main: 0xe2713a, stripe: 0x1d2340, text: "#fff4e6" },
};

export const CHIP_DENOMS = [10, 25, 100, 500, 1000];
const RADIUS = 34;

function chipTextureKey(value: number) {
  return `chip-base-${value}`;
}

export function ensureChipTexture(scene: Phaser.Scene, value: number): string {
  const key = chipTextureKey(value);
  if (scene.textures.exists(key)) return key;
  const pal = CHIP_COLORS[value] ?? CHIP_COLORS[100]!;
  const size = RADIUS * 2 + 8;
  const cx = size / 2;
  const g = scene.make.graphics({ x: 0, y: 0 });

  g.fillStyle(0x000000, 0);
  g.fillRect(0, 0, size, size);
  // Outer face
  g.fillStyle(pal.main, 1).fillCircle(cx, cx, RADIUS);
  // Edge edge-marks (classic casino chip notches)
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    g.lineStyle(11, pal.stripe, 1).beginPath();
    g.arc(cx, cx, RADIUS - 6, a - 0.14, a + 0.14);
    g.strokePath();
  }
  // Inner ring + center
  g.fillStyle(pal.stripe, 1).fillCircle(cx, cx, RADIUS - 16);
  g.fillStyle(pal.main, 1).fillCircle(cx, cx, RADIUS - 21);
  g.lineStyle(2, 0xffffff, 0.2).strokeCircle(cx, cx, RADIUS - 21);
  g.lineStyle(2, 0x000000, 0.25).strokeCircle(cx, cx, RADIUS - 1);

  g.generateTexture(key, size, size);
  g.destroy();
  return key;
}

export function makeChip(
  scene: Phaser.Scene,
  value: number,
  scale = 1,
): Phaser.GameObjects.Container {
  const pal = CHIP_COLORS[value] ?? CHIP_COLORS[100]!;
  ensureChipTexture(scene, value);
  const container = scene.add.container(0, 0);
  const sprite = scene.add.image(0, 0, chipTextureKey(value));
  const label = scene.add
    .text(0, -1, value >= 1000 ? "1K" : String(value), {
      fontFamily: "'DM Mono', monospace",
      fontStyle: "bold",
      fontSize: "15px",
      color: pal.text,
    })
    .setOrigin(0.5);
  container.add([sprite, label]);
  container.setData("value", value).setScale(scale);
  return container;
}

/** Pseudo-3D vertical stack of chips. */
export function makeChipStack(scene: Phaser.Scene, total: number): Phaser.GameObjects.Container {
  const stack = scene.add.container(0, 0);
  let remaining = total;
  const denoms = [...CHIP_DENOMS].reverse();
  const chips: number[] = [];
  while (remaining > 0 && chips.length < 24) {
    const d = denoms.find((v) => v <= remaining) ?? CHIP_DENOMS[0]!;
    chips.push(d);
    remaining -= d;
  }
  chips.forEach((value, i) => {
    const chip = makeChip(scene, value, 0.86);
    chip.setY(-i * 7);
    stack.add(chip);
  });
  return stack;
}
