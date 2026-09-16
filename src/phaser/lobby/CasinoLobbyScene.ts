import Phaser from "phaser";

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

const WIDTH = 1280;
const HEIGHT = 720;
const tablePositions: Record<string, { x: number; y: number }> = {
  slots: { x: 214, y: 286 },
  baccarat: { x: 478, y: 244 },
  blackjack: { x: 680, y: 414 },
  roulette: { x: 1018, y: 272 },
  sicbo: { x: 1008, y: 505 },
  mahjong: { x: 318, y: 508 },
};

export class CasinoLobbyScene extends Phaser.Scene {
  private payload?: CasinoLobbyPayload;
  private tableLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private selectedTableId = "blackjack";

  constructor() {
    super("casino-lobby");
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
    this.render();
  }

  private fitLogicalHall(viewportWidth: number, viewportHeight: number) {
    const zoom = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
    if (this.payload) this.render();
  }

  private paintLobby() {
    this.children.removeAll(true);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x02050c, 1).fillRect(0, 0, WIDTH, HEIGHT);
    graphics.fillStyle(0x081225, 1).fillRoundedRect(18, 16, WIDTH - 36, HEIGHT - 32, 36);
    graphics.lineStyle(2, 0x3d506b, 0.88).strokeRoundedRect(18, 16, WIDTH - 36, HEIGHT - 32, 36);

    graphics.fillStyle(0x130d25, 1).fillRoundedRect(42, 44, WIDTH - 84, 176, 28);
    graphics.lineStyle(1, 0xd5ae58, 0.5).strokeRoundedRect(42, 44, WIDTH - 84, 176, 28);
    graphics.fillStyle(0x5d183e, 0.32).fillEllipse(WIDTH / 2, 55, 730, 130);
    graphics.fillStyle(0x124252, 0.3).fillEllipse(WIDTH / 2, 166, 1090, 146);

    for (let index = 0; index < 10; index += 1) {
      const x = 84 + index * 123;
      graphics.fillStyle(index % 2 ? 0x422049 : 0x20365e, 0.55).fillRoundedRect(x, 66, 78, 118, 18);
      graphics.lineStyle(1, 0xe1c579, 0.28).strokeRoundedRect(x, 66, 78, 118, 18);
      graphics.fillStyle(0xf0c665, 0.26).fillCircle(x + 39, 91, 3);
    }

    graphics
      .fillStyle(0x07101e, 1)
      .fillTriangle(112, HEIGHT - 32, WIDTH - 112, HEIGHT - 32, WIDTH / 2, 186);
    graphics
      .fillStyle(0x153646, 0.9)
      .fillTriangle(178, HEIGHT - 32, WIDTH - 178, HEIGHT - 32, WIDTH / 2, 192);
    graphics
      .lineStyle(2, 0xd2ae5a, 0.56)
      .strokeTriangle(178, HEIGHT - 32, WIDTH - 178, HEIGHT - 32, WIDTH / 2, 192);

    for (let index = 0; index < 7; index += 1) {
      const progress = index / 7;
      const y = 226 + index * 70;
      const left = Phaser.Math.Linear(WIDTH / 2 - 32, 130, progress);
      const right = Phaser.Math.Linear(WIDTH / 2 + 32, WIDTH - 130, progress);
      graphics.lineStyle(1, 0x82e1cf, 0.1 + index * 0.02).lineBetween(left, y, right, y);
    }

    graphics.fillStyle(0x051019, 0.7).fillRoundedRect(72, 222, 120, 362, 28);
    graphics.fillStyle(0x051019, 0.7).fillRoundedRect(WIDTH - 192, 222, 120, 362, 28);
    graphics.lineStyle(1, 0x426c78, 0.45).strokeRoundedRect(72, 222, 120, 362, 28);
    graphics.lineStyle(1, 0x426c78, 0.45).strokeRoundedRect(WIDTH - 192, 222, 120, 362, 28);

    this.add
      .text(WIDTH / 2, 76, "CASINO ATLAS", {
        fontFamily: "Georgia",
        fontSize: "28px",
        color: "#fff0b0",
        fontStyle: "bold",
        letterSpacing: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(WIDTH / 2, 111, "THE INTERNATIONAL PLAY HALL", {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#9fe6d4",
        letterSpacing: 4.3,
      })
      .setOrigin(0.5);
    this.add
      .text(WIDTH / 2, 138, "DISCOVER TABLES  ·  LEARN THE ODDS  ·  PLAY WITH VIRTUAL CHIPS", {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#a9bed4",
        letterSpacing: 1.5,
      })
      .setOrigin(0.5);

    this.createAmbientLights();
    this.tableLayer = this.add.container();
    this.uiLayer = this.add.container();
  }

  private createAmbientLights() {
    const colors = [0xf3c85e, 0x63e3c4, 0xca699a];
    for (let index = 0; index < 24; index += 1) {
      const light = this.add.circle(
        Phaser.Math.Between(52, WIDTH - 52),
        Phaser.Math.Between(52, HEIGHT - 72),
        Phaser.Math.Between(1, 3),
        colors[index % colors.length],
        0.4,
      );
      this.tweens.add({
        targets: light,
        alpha: 0.08,
        scale: 0.5,
        delay: index * 70,
        duration: Phaser.Math.Between(1050, 2100),
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
    this.drawHud(this.payload);
    this.payload.tables.forEach((table) => this.drawTable(table));
    this.drawQuestPanel(this.payload);
    this.drawControls(this.payload);
  }

  private drawHud(payload: CasinoLobbyPayload) {
    const playerPanel = this.add.container(54, 48);
    const playerBox = this.add.graphics();
    playerBox.fillStyle(0x07192b, 0.9).fillRoundedRect(0, 0, 254, 55, 14);
    playerBox.lineStyle(1, 0x537f99, 0.76).strokeRoundedRect(0, 0, 254, 55, 14);
    playerPanel.add([
      playerBox,
      this.add.circle(25, 27, 16, 0x63ddc2, 1),
      this.add
        .text(25, 27, "A", {
          fontFamily: "Georgia",
          fontSize: "18px",
          color: "#08223b",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add.text(52, 11, payload.labels.profile, {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#91dccb",
        letterSpacing: 1.5,
      }),
      this.add.text(52, 26, payload.labels.explorer, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#f6f8ff",
        fontStyle: "bold",
        letterSpacing: 0.8,
      }),
      this.add.text(52, 42, `${payload.labels.explored} ${payload.explored}`, {
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "#a9c5dc",
        letterSpacing: 0.5,
      }),
    ]);
    this.uiLayer.add(playerPanel);

    const virtualPanel = this.add.container(1010, 48);
    const virtualBox = this.add.graphics();
    virtualBox.fillStyle(0x07192b, 0.9).fillRoundedRect(0, 0, 216, 55, 14);
    virtualBox.lineStyle(1, 0x537f99, 0.76).strokeRoundedRect(0, 0, 216, 55, 14);
    virtualPanel.add([
      virtualBox,
      this.add.text(16, 12, payload.labels.safe, {
        fontFamily: "Arial",
        fontSize: "8px",
        color: "#91e2cd",
        letterSpacing: 1.6,
      }),
      this.add.text(16, 29, "100% VIRTUAL", {
        fontFamily: "'DM Mono', monospace",
        fontSize: "15px",
        color: "#fff3b7",
        fontStyle: "bold",
      }),
      this.add
        .text(190, 30, "◇", { fontFamily: "Arial", fontSize: "20px", color: "#f1c85e" })
        .setOrigin(0.5),
    ]);
    this.uiLayer.add(virtualPanel);
  }

  private drawTable(table: CasinoLobbyTable) {
    const position = tablePositions[table.id];
    if (!position) return;
    const selected = table.id === this.selectedTableId;
    const playable = table.status === "playable";
    const tableContainer = this.add.container(position.x, position.y);
    const graphics = this.add.graphics();
    const width = playable ? 218 : 174;
    const height = playable ? 132 : 106;
    const rim = playable ? 0xefd36d : 0x526f82;
    const felt = playable ? 0x0d6e64 : 0x173b58;
    const glow = playable ? 0x63e6c4 : 0x5f7897;

    if (selected) {
      graphics
        .fillStyle(playable ? 0x61e0c6 : 0x8ba2b7, 0.12)
        .fillEllipse(0, 10, width + 50, height + 44);
      graphics
        .lineStyle(2, playable ? 0xffdf77 : 0x9db3c9, 0.86)
        .strokeEllipse(0, 10, width + 34, height + 24);
    }

    if (table.id === "roulette") {
      graphics.fillStyle(0x101a2f, 1).fillCircle(0, 0, 63);
      graphics.lineStyle(4, rim, 0.9).strokeCircle(0, 0, 63);
      graphics.fillStyle(0x0c5e51, 1).fillCircle(0, 0, 50);
      for (let index = 0; index < 14; index += 1) {
        const start = (Math.PI * 2 * index) / 14;
        graphics
          .lineStyle(2, index % 2 ? 0xd04b5e : 0xead76f, 0.8)
          .lineBetween(0, 0, Math.cos(start) * 48, Math.sin(start) * 48);
      }
      graphics.fillStyle(0xe2c15f, 1).fillCircle(0, 0, 9);
    } else if (table.id === "slots") {
      graphics.fillStyle(0x192348, 1).fillRoundedRect(-68, -50, 136, 100, 18);
      graphics.lineStyle(3, rim, 0.92).strokeRoundedRect(-68, -50, 136, 100, 18);
      for (let index = 0; index < 3; index += 1) {
        const x = -36 + index * 36;
        graphics.fillStyle(0xeef4f6, 0.96).fillRoundedRect(x - 13, -20, 26, 42, 5);
        graphics.lineStyle(1, 0xb6cae1, 1).strokeRoundedRect(x - 13, -20, 26, 42, 5);
      }
      graphics.fillStyle(0x64d8c0, 1).fillRoundedRect(64, -23, 18, 46, 8);
      graphics.fillStyle(0xf0ce68, 1).fillCircle(73, -32, 12);
    } else if (table.id === "sicbo") {
      graphics.fillStyle(0x182446, 1).fillRoundedRect(-76, -44, 152, 88, 19);
      graphics.lineStyle(3, rim, 0.88).strokeRoundedRect(-76, -44, 152, 88, 19);
      graphics.fillStyle(felt, 1).fillRoundedRect(-62, -32, 124, 64, 14);
      [-30, 0, 30].forEach((x) => {
        graphics.fillStyle(0xf2f1e9, 1).fillRoundedRect(x - 12, -12, 24, 24, 5);
        graphics
          .fillStyle(0x243552, 1)
          .fillCircle(x - 5, -5, 2.5)
          .fillCircle(x + 5, 5, 2.5);
      });
    } else if (table.id === "mahjong") {
      graphics.fillStyle(0x342b46, 1).fillRoundedRect(-76, -44, 152, 88, 19);
      graphics.lineStyle(3, rim, 0.88).strokeRoundedRect(-76, -44, 152, 88, 19);
      graphics.fillStyle(felt, 1).fillRoundedRect(-62, -32, 124, 64, 14);
      for (let index = 0; index < 4; index += 1) {
        const x = -42 + index * 28;
        graphics.fillStyle(0xf3f1d8, 1).fillRoundedRect(x, -18, 20, 36, 4);
        graphics.lineStyle(1, 0x4b6a71, 0.85).strokeRoundedRect(x, -18, 20, 36, 4);
        graphics.fillStyle(index % 2 ? 0xcf4255 : 0x3bb198, 1).fillCircle(x + 10, 0, 4);
      }
    } else {
      graphics.fillStyle(0x121b34, 1).fillEllipse(0, 4, width, height);
      graphics.lineStyle(4, rim, 0.92).strokeEllipse(0, 4, width, height);
      graphics.fillStyle(felt, 1).fillEllipse(0, 1, width - 20, height - 19);
      graphics.lineStyle(1, glow, 0.52).strokeEllipse(0, 1, width - 42, height - 36);
      if (table.id === "baccarat") {
        graphics.lineStyle(1, 0xe2c56a, 0.54).lineBetween(-42, 0, 42, 0);
        graphics.lineStyle(1, 0xe2c56a, 0.54).lineBetween(0, -24, 0, 24);
      }
      if (table.id === "blackjack") {
        graphics.lineStyle(2, 0xe3c462, 0.6).arc(0, 22, 72, Math.PI + 0.25, Math.PI * 2 - 0.25);
      }
    }

    const titleY = table.id === "roulette" ? 80 : height / 2 + 12;
    tableContainer.add([
      graphics,
      this.add
        .text(0, table.id === "roulette" ? 0 : -8, table.icon, {
          fontFamily: "Georgia",
          fontSize: playable ? "33px" : "27px",
          color: playable ? "#fff1a9" : "#c6d4e5",
          fontStyle: "bold",
        })
        .setOrigin(0.5),
      this.add
        .text(0, titleY, table.name, {
          fontFamily: "Arial",
          fontSize: playable ? "13px" : "11px",
          color: playable ? "#f6fff9" : "#d3deea",
          fontStyle: "bold",
          letterSpacing: 1,
        })
        .setOrigin(0.5),
      this.add
        .text(
          0,
          titleY + 15,
          playable
            ? (this.payload?.labels.playNow ?? "PLAY NOW")
            : (this.payload?.labels.comingSoon ?? "COMING SOON"),
          {
            fontFamily: "Arial",
            fontSize: "8px",
            color: playable ? "#8ff0d5" : "#a8b7ca",
            letterSpacing: 1.3,
          },
        )
        .setOrigin(0.5),
    ]);

    tableContainer.setSize(width + 30, height + 58);
    tableContainer.setInteractive(
      new Phaser.Geom.Rectangle(-(width + 30) / 2, -(height + 30) / 2, width + 30, height + 58),
      (area, pointerX, pointerY) => area.contains(pointerX, pointerY),
    );
    if (tableContainer.input) tableContainer.input.cursor = playable ? "pointer" : "not-allowed";
    tableContainer.on("pointerover", () => this.selectTable(table.id));
    tableContainer.on("pointerup", () => this.activateTable(table));
    this.tableLayer.add(tableContainer);

    if (playable) {
      const marker = this.add.circle(
        position.x + width / 2 - 13,
        position.y - height / 2 + 15,
        5,
        0xf4cd62,
        1,
      );
      this.tableLayer.add(marker);
      this.tweens.add({
        targets: marker,
        alpha: 0.25,
        scale: 1.45,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  private drawQuestPanel(payload: CasinoLobbyPayload) {
    const selected =
      payload.tables.find((table) => table.id === this.selectedTableId) ?? payload.tables[0];
    if (!selected) return;
    const panel = this.add.container(WIDTH / 2, 610);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x061629, 0.92).fillRoundedRect(-322, -40, 644, 80, 20);
    graphics
      .lineStyle(1, selected.status === "playable" ? 0x76dcc6 : 0x526d85, 0.8)
      .strokeRoundedRect(-322, -40, 644, 80, 20);
    const playable = selected.status === "playable";
    panel.add([
      graphics,
      this.add.text(-293, -20, playable ? payload.labels.featuredQuest : payload.labels.hallTable, {
        fontFamily: "Arial",
        fontSize: "8px",
        color: playable ? "#9ae7d4" : "#a8bdd2",
        letterSpacing: 1.6,
      }),
      this.add.text(-293, 0, selected.name, {
        fontFamily: "Georgia",
        fontSize: "21px",
        color: playable ? "#fff0a6" : "#e7edf8",
        fontStyle: "bold",
      }),
      this.add.text(-115, -11, selected.description, {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#bbcee0",
        wordWrap: { width: 276 },
      }),
      this.add.text(-115, 17, `${payload.labels.edge} ${selected.houseEdge}`, {
        fontFamily: "'DM Mono', monospace",
        fontSize: "9px",
        color: "#7edcc5",
        letterSpacing: 0.7,
      }),
    ]);
    this.uiLayer.add(panel);
    this.canvasButton(
      900,
      588,
      166,
      44,
      playable ? payload.labels.enterTable : payload.labels.comingSoon,
      () => this.activateTable(selected),
      playable,
      playable ? "ENTER" : undefined,
    );
  }

  private drawControls(payload: CasinoLobbyPayload) {
    this.canvasButton(
      56,
      660,
      132,
      32,
      payload.labels.learn,
      () => this.emit({ type: "navigate", path: "/learn" }),
      true,
      "L",
    );
    this.canvasButton(
      198,
      660,
      132,
      32,
      payload.labels.lab,
      () => this.emit({ type: "navigate", path: "/learn/randomness" }),
      true,
      "R",
    );
    this.canvasButton(
      1090,
      660,
      136,
      32,
      payload.labels.language,
      () => this.emit({ type: "locale:toggle" }),
      true,
      "Z",
    );
    this.uiLayer.add(
      this.add
        .text(WIDTH / 2, 681, payload.labels.navigationHint, {
          fontFamily: "Arial",
          fontSize: "9px",
          color: "#81aabd",
          letterSpacing: 1.3,
        })
        .setOrigin(0.5),
    );
  }

  private canvasButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    action: () => void,
    enabled: boolean,
    shortcut?: string,
  ) {
    const button = this.add.container(x, y);
    const graphics = this.add.graphics();
    graphics.fillStyle(enabled ? 0x0b2943 : 0x142238, 1).fillRoundedRect(0, 0, width, height, 11);
    graphics
      .lineStyle(1, enabled ? 0x5d96a9 : 0x38536b, 1)
      .strokeRoundedRect(0, 0, width, height, 11);
    button.add([
      graphics,
      this.add
        .text(width / 2, height / 2, label, {
          fontFamily: "Arial",
          fontSize: "9px",
          color: enabled ? "#dff8ef" : "#77889b",
          fontStyle: "bold",
          letterSpacing: 1.1,
        })
        .setOrigin(0.5),
    ]);
    if (shortcut) {
      button.add(
        this.add
          .text(width - 12, height / 2, shortcut, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "8px",
            color: "#7bdcc3",
          })
          .setOrigin(0.5),
      );
    }
    if (enabled) {
      button.setSize(width, height);
      button.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        (area, pointerX, pointerY) => area.contains(pointerX, pointerY),
      );
      if (button.input) button.input.cursor = "pointer";
      button.on("pointerover", () => button.setScale(1.04));
      button.on("pointerout", () => button.setScale(1));
      button.on("pointerup", action);
    }
    this.uiLayer.add(button);
  }

  private selectTable(id: string) {
    if (id === this.selectedTableId) return;
    this.selectedTableId = id;
    this.render();
  }

  private activateTable(table: CasinoLobbyTable) {
    this.selectedTableId = table.id;
    this.render();
    if (table.status === "playable") {
      this.emit({ type: "table:open", id: table.id });
      return;
    }
    this.showLockedNotice();
  }

  private showLockedNotice() {
    const message = this.add
      .text(WIDTH / 2, 556, this.payload?.labels.lockedNotice ?? "THIS TABLE IS BEING PREPARED", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#d6e2ef",
        fontStyle: "bold",
        letterSpacing: 1.6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.8);
    this.uiLayer.add(message);
    this.tweens.add({
      targets: message,
      alpha: 1,
      scale: 1,
      y: 544,
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
