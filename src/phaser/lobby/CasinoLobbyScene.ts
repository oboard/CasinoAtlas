import Phaser from "phaser";
import lobbyHallUrl from "../../assets/lobby/casino-play-hall.png";

export interface CasinoLobbyTable {
  id: string;
  icon: string;
  name: string;
  description: string;
  houseEdge: string;
  status: "playable" | "soon";
}

export interface CasinoLobbyPayload {
  tables: CasinoLobbyTable[];
  explored: number;
  labels: Record<string, string>;
}

export type CasinoLobbyCommand =
  | { type: "table:open"; id: string }
  | { type: "navigate"; path: "/learn" | "/learn/randomness" }
  | { type: "locale:toggle" };

const WIDTH = 1672;
const HEIGHT = 941;

interface TableAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "ellipse" | "rounded" | "circle";
  labelY: number;
}

const tableAnchors: Record<string, TableAnchor> = {
  slots: { x: 174, y: 364, width: 322, height: 310, shape: "rounded", labelY: 503 },
  baccarat: { x: 545, y: 395, width: 250, height: 190, shape: "ellipse", labelY: 500 },
  blackjack: { x: 840, y: 476, width: 565, height: 312, shape: "ellipse", labelY: 638 },
  roulette: { x: 1456, y: 322, width: 308, height: 220, shape: "circle", labelY: 449 },
  sicbo: { x: 1436, y: 520, width: 306, height: 220, shape: "rounded", labelY: 640 },
  mahjong: { x: 415, y: 520, width: 310, height: 222, shape: "rounded", labelY: 640 },
};

export class CasinoLobbyScene extends Phaser.Scene {
  private payload?: CasinoLobbyPayload;
  private tableLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private selectedTableId = "blackjack";

  constructor() {
    super("casino-lobby");
  }

  preload() {
    this.load.image("casino-play-hall", lobbyHallUrl);
  }

  create() {
    this.paintLobby();
    this.events.on("state", (payload: CasinoLobbyPayload) => {
      this.payload = payload;
      if (!payload.tables.some((table) => table.id === this.selectedTableId)) {
        this.selectedTableId =
          payload.tables.find((table) => table.status === "playable")?.id ??
          payload.tables[0]?.id ??
          "";
      }
      this.render();
    });
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.handleShortcut(event));
    this.scale.on("resize", (size: Phaser.Structs.Size) =>
      this.fitLogicalHall(size.width, size.height),
    );
    this.fitLogicalHall(this.scale.width, this.scale.height);
    this.payload = this.registry.get("casinoAtlasLobbyPayload") as CasinoLobbyPayload | undefined;
    this.render();
  }

  private fitLogicalHall(viewportWidth: number, viewportHeight: number) {
    const zoom = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
  }

  private paintLobby() {
    this.add.image(0, 0, "casino-play-hall").setOrigin(0).setDisplaySize(WIDTH, HEIGHT);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x020713, 0.1).fillRect(0, 0, WIDTH, HEIGHT);
    vignette.fillStyle(0x020713, 0.18).fillTriangle(0, 0, 260, 0, 0, HEIGHT);
    vignette.fillStyle(0x020713, 0.18).fillTriangle(WIDTH, 0, WIDTH - 260, 0, WIDTH, HEIGHT);

    this.createAmbientSparkles();
    this.tableLayer = this.add.container();
    this.uiLayer = this.add.container();
  }

  private createAmbientSparkles() {
    const colors = [0xffda72, 0x78f2d3, 0xffffff];
    for (let index = 0; index < 24; index += 1) {
      const sparkle = this.add.circle(
        Phaser.Math.Between(255, WIDTH - 255),
        Phaser.Math.Between(70, 350),
        Phaser.Math.Between(1, 3),
        colors[index % colors.length],
        0.65,
      );
      this.tweens.add({
        targets: sparkle,
        alpha: 0.14,
        scale: 0.4,
        duration: Phaser.Math.Between(950, 1900),
        delay: index * 90,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  private render() {
    if (!this.payload || !this.tableLayer || !this.uiLayer) return;
    this.tableLayer.removeAll(true);
    this.uiLayer.removeAll(true);
    this.payload.tables.forEach((table) => this.drawTableTarget(table));
    this.drawHud(this.payload);
    this.drawSelectionPanel(this.payload);
  }

  private drawTableTarget(table: CasinoLobbyTable) {
    const anchor = tableAnchors[table.id];
    if (!anchor) return;
    const selected = table.id === this.selectedTableId;
    const playable = table.status === "playable";
    const container = this.add.container(anchor.x, anchor.y);

    if (selected) {
      const glow = this.add.graphics();
      this.drawOutline(glow, anchor, playable ? 0x7dffe0 : 0xa8c9e8, playable ? 0.88 : 0.52, 5, 15);
      this.drawOutline(glow, anchor, playable ? 0xffd56f : 0x86a1c0, playable ? 0.48 : 0.24, 2, 34);
      container.add(glow);
      this.tweens.add({
        targets: glow,
        alpha: 0.34,
        scaleX: 1.045,
        scaleY: 1.045,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }

    if (selected) {
      const label = this.add.container(0, anchor.labelY - anchor.y);
      const labelWidth = Math.max(120, table.name.length * 11 + 55);
      const labelPanel = this.add.graphics();
      labelPanel.fillStyle(0x06152a, 0.9).fillRoundedRect(-labelWidth / 2, -16, labelWidth, 32, 16);
      labelPanel
        .lineStyle(1, playable ? 0x90f3dc : 0x7e9dbb, 0.9)
        .strokeRoundedRect(-labelWidth / 2, -16, labelWidth, 32, 16);
      label.add([
        labelPanel,
        this.add
          .text(0, -4, `${table.icon}  ${table.name}`, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#fff4be",
            fontStyle: "bold",
            letterSpacing: 1,
          })
          .setOrigin(0.5),
      ]);
      container.add(label);
      container.add(
        this.add
          .text(
            0,
            anchor.labelY - anchor.y + 22,
            playable
              ? (this.payload?.labels.playNow ?? "PLAY NOW")
              : (this.payload?.labels.comingSoon ?? "COMING SOON"),
            {
              fontFamily: "Arial",
              fontSize: "8px",
              color: playable ? "#8dffe0" : "#bbcadc",
              fontStyle: "bold",
              letterSpacing: 1.6,
            },
          )
          .setOrigin(0.5),
      );
    }

    const zone = this.add.zone(0, 0, anchor.width, anchor.height);
    zone.setInteractive({ useHandCursor: playable });
    zone.on("pointerover", () => this.selectTable(table.id));
    zone.on("pointerup", () => this.activateTable(table));
    container.add(zone);
    this.tableLayer.add(container);
  }

  private drawOutline(
    graphics: Phaser.GameObjects.Graphics,
    anchor: TableAnchor,
    color: number,
    alpha: number,
    lineWidth: number,
    padding: number,
  ) {
    graphics.lineStyle(lineWidth, color, alpha);
    if (anchor.shape === "ellipse") {
      graphics.strokeEllipse(0, 0, anchor.width + padding, anchor.height + padding);
      return;
    }
    if (anchor.shape === "circle") {
      graphics.strokeCircle(0, 0, Math.max(anchor.width, anchor.height) / 2 + padding / 2);
      return;
    }
    graphics.strokeRoundedRect(
      -(anchor.width + padding) / 2,
      -(anchor.height + padding) / 2,
      anchor.width + padding,
      anchor.height + padding,
      24,
    );
  }

  private drawHud(payload: CasinoLobbyPayload) {
    const profile = this.add.container(52, 20);
    profile.add([
      this.add.text(74, 20, payload.labels.profile, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#b8f4e2",
        fontStyle: "bold",
        letterSpacing: 1.2,
      }),
      this.add.text(74, 36, payload.labels.explorer, {
        fontFamily: "Georgia",
        fontSize: "13px",
        color: "#f7f0d1",
        fontStyle: "bold",
      }),
      this.add.text(74, 52, `${payload.labels.explored} ${payload.explored}`, {
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "#a9c8db",
        letterSpacing: 0.6,
      }),
    ]);
    this.uiLayer.add(profile);

    const wallet = this.add.container(1374, 20);
    wallet.add([
      this.add.text(74, 20, payload.labels.safe, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#b8f4e2",
        fontStyle: "bold",
        letterSpacing: 1.2,
      }),
      this.add.text(74, 46, "10,000", {
        fontFamily: "Georgia",
        fontSize: "23px",
        color: "#fff0ab",
        fontStyle: "bold",
      }),
      this.add
        .text(276, 42, "＋", {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#d9effc",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    ]);
    this.uiLayer.add(wallet);

    this.createHudHotspot(18, 22, 258, 78, () => this.emit({ type: "navigate", path: "/learn" }));
    this.createHudHotspot(1370, 22, 292, 78, () => this.emit({ type: "locale:toggle" }));
  }

  private createHudHotspot(
    x: number,
    y: number,
    width: number,
    height: number,
    action: () => void,
  ) {
    const hotspot = this.add
      .zone(x + width / 2, y + height / 2, width, height)
      .setInteractive({ useHandCursor: true });
    hotspot.on("pointerup", action);
    this.uiLayer.add(hotspot);
  }

  private drawSelectionPanel(payload: CasinoLobbyPayload) {
    const tables = payload.tables;
    const selected = tables.find((table) => table.id === this.selectedTableId) ?? tables[0];
    if (!selected) return;
    const playable = selected.status === "playable";
    const panel = this.add.container(636, 794);
    const thumbnail = this.add.graphics();
    thumbnail.fillStyle(0x0a2940, 0.92).fillRoundedRect(0, 0, 82, 82, 18);
    thumbnail.lineStyle(2, playable ? 0x8cf2d8 : 0x7a92ae, 0.9).strokeRoundedRect(0, 0, 82, 82, 18);
    thumbnail.fillStyle(playable ? 0x117d69 : 0x31445d, 1).fillEllipse(41, 42, 58, 38);
    panel.add([
      thumbnail,
      this.add
        .text(41, 41, selected.icon, {
          fontFamily: "Georgia",
          fontSize: "29px",
          color: "#fff2b1",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
    ]);
    this.uiLayer.add(panel);

    const detail = this.add.container(732, 807);
    detail.add([
      this.add.text(0, 0, playable ? payload.labels.featuredQuest : payload.labels.hallTable, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: playable ? "#96f0d8" : "#bad1e7",
        fontStyle: "bold",
        letterSpacing: 1.4,
      }),
      this.add.text(0, 24, selected.name, {
        fontFamily: "Georgia",
        fontSize: "25px",
        color: "#fff0ad",
        fontStyle: "bold",
      }),
      this.add.text(0, 50, `${payload.labels.edge} ${selected.houseEdge}`, {
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "#80e5ca",
        letterSpacing: 0.8,
      }),
    ]);
    this.uiLayer.add(detail);

    this.drawMainAction(selected, payload);
    this.drawCarouselDots(tables);
    this.uiLayer.add(
      this.add
        .text(WIDTH / 2, 907, payload.labels.navigationHint, {
          fontFamily: "Arial",
          fontSize: "9px",
          color: "#c5dceb",
          letterSpacing: 1.25,
        })
        .setOrigin(0.5),
    );
  }

  private drawMainAction(selected: CasinoLobbyTable, payload: CasinoLobbyPayload) {
    const playable = selected.status === "playable";
    const button = this.add.container(943 + 106, 815 + 31);
    const panel = this.add.graphics();
    panel.fillStyle(playable ? 0x4fe3c6 : 0x2d4058, 1).fillRoundedRect(-106, -31, 212, 62, 26);
    panel.lineStyle(2, playable ? 0xd8fff3 : 0x6f8aa6, 1).strokeRoundedRect(-106, -31, 212, 62, 26);
    button.add([
      panel,
      this.add
        .text(0, -8, playable ? payload.labels.enterTable : payload.labels.comingSoon, {
          fontFamily: "Arial",
          fontSize: "11px",
          color: playable ? "#072947" : "#b8c7d8",
          fontStyle: "bold",
          letterSpacing: 1.4,
        })
        .setOrigin(0.5),
      this.add
        .text(0, 12, playable ? "ENTER" : "LOCKED", {
          fontFamily: "'DM Mono', monospace",
          fontSize: "8px",
          color: playable ? "#16576c" : "#8fa3b9",
          letterSpacing: 1.4,
        })
        .setOrigin(0.5),
    ]);
    if (playable) {
      button.setSize(212, 62).setInteractive({ useHandCursor: true });
      button.on("pointerover", () => button.setScale(1.035));
      button.on("pointerout", () => button.setScale(1));
      button.on("pointerup", () => this.activateTable(selected));
    }
    this.uiLayer.add(button);
  }

  private drawCarouselDots(tables: CasinoLobbyTable[]) {
    const selectedIndex = tables.findIndex((table) => table.id === this.selectedTableId);
    tables.forEach((table, index) => {
      const dot = this.add.circle(
        863 + index * 25,
        886,
        index === selectedIndex ? 7 : 5,
        index === selectedIndex ? 0x71e6cb : 0x899ab5,
        index === selectedIndex ? 1 : 0.68,
      );
      dot.setInteractive({ useHandCursor: true });
      dot.on("pointerup", () => this.selectTable(table.id));
      this.uiLayer.add(dot);
    });
  }

  private selectTable(id: string) {
    if (id === this.selectedTableId) return;
    this.selectedTableId = id;
    this.render();
  }

  private activateTable(table: CasinoLobbyTable) {
    this.selectedTableId = table.id;
    if (table.status === "playable") {
      this.emit({ type: "table:open", id: table.id });
      return;
    }
    this.render();
    this.showLockedNotice();
  }

  private showLockedNotice() {
    const message = this.add
      .text(WIDTH / 2, 750, this.payload?.labels.lockedNotice ?? "THIS TABLE IS BEING PREPARED", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#e6f3ff",
        fontStyle: "bold",
        letterSpacing: 1.3,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.84);
    this.uiLayer.add(message);
    this.tweens.add({
      targets: message,
      alpha: 1,
      scale: 1,
      y: 738,
      duration: 220,
      yoyo: true,
      hold: 900,
      ease: "Quad.Out",
      onComplete: () => message.destroy(),
    });
  }

  private handleShortcut(event: KeyboardEvent) {
    if (!this.payload || event.repeat) return;
    const key = event.key.toLowerCase();
    const tables = this.payload.tables;
    const selectedIndex = tables.findIndex((table) => table.id === this.selectedTableId);
    if (["arrowleft", "arrowup", "arrowright", "arrowdown"].includes(key)) {
      event.preventDefault();
      const direction = key === "arrowleft" || key === "arrowup" ? -1 : 1;
      const nextIndex = (selectedIndex + direction + tables.length) % tables.length;
      const next = tables[nextIndex];
      if (next) this.selectTable(next.id);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      const selected = tables.find((table) => table.id === this.selectedTableId);
      if (selected) this.activateTable(selected);
      return;
    }
    if (key === "l") this.emit({ type: "navigate", path: "/learn" });
    if (key === "r") this.emit({ type: "navigate", path: "/learn/randomness" });
    if (key === "z") this.emit({ type: "locale:toggle" });
  }

  private emit(command: CasinoLobbyCommand) {
    const callback = this.registry.get("casinoAtlasLobbyAction") as
      | ((command: CasinoLobbyCommand) => void)
      | undefined;
    callback?.(command);
  }
}
