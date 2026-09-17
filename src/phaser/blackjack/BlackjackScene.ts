import Phaser from "phaser";
import { handValue } from "../../games/blackjack/evaluator";
import type { BlackjackState, Card, Hand } from "../../games/blackjack/types";
import type { BlackjackCommand } from "../gameBridge";
import { CHIP_COLORS, CHIP_DENOMS, makeChip, makeChipStack } from "../core/ChipSprite";

export interface BlackjackScenePayload {
  state: BlackjackState;
  selectedBet: number;
  message: string;
  labels: Record<string, string>;
}

const WIDTH = 1280;
const HEIGHT = 720;
const suitSymbols: Record<Card["suit"], string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

export class BlackjackScene extends Phaser.Scene {
  private payload?: BlackjackScenePayload;
  private tableLayer!: Phaser.GameObjects.Container;
  private handLayer!: Phaser.GameObjects.Container;
  private uiLayer!: Phaser.GameObjects.Container;
  private lastDealerCount = 0;
  private lastHandCounts: number[] = [];
  private lastPhase?: BlackjackState["phase"];

  constructor() {
    super("blackjack-table");
  }

  create() {
    this.paintBackdrop();
    this.events.on("state", (payload: BlackjackScenePayload) => {
      this.payload = payload;
      this.render();
    });
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.handleShortcut(event));
    this.scale.on("resize", (size: Phaser.Structs.Size) =>
      this.fitLogicalTable(size.width, size.height),
    );
    this.fitLogicalTable(this.scale.width, this.scale.height);
    this.render();
  }

  private fitLogicalTable(viewportWidth: number, viewportHeight: number) {
    const zoom = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
    if (this.payload) this.render();
  }

  private paintBackdrop() {
    this.children.removeAll(true);
    const graphics = this.add.graphics();
    graphics.fillStyle(0x02050c, 1).fillRect(0, 0, WIDTH, HEIGHT);
    graphics.fillStyle(0x0b1020, 1).fillRoundedRect(18, 16, WIDTH - 36, HEIGHT - 32, 36);
    graphics.lineStyle(2, 0x3e4262, 0.85).strokeRoundedRect(18, 16, WIDTH - 36, HEIGHT - 32, 36);

    graphics.fillStyle(0x10112a, 1).fillRoundedRect(42, 42, WIDTH - 84, 126, 24);
    graphics.lineStyle(1, 0xc3a756, 0.54).strokeRoundedRect(42, 42, WIDTH - 84, 126, 24);
    graphics.fillStyle(0x5e1538, 0.28).fillEllipse(WIDTH / 2, 52, 720, 120);
    graphics.fillStyle(0x113a49, 0.22).fillEllipse(WIDTH / 2, 104, 1120, 150);

    for (let index = 0; index < 9; index += 1) {
      const x = 112 + index * 132;
      graphics
        .fillStyle(index % 2 === 0 ? 0x314060 : 0x3e1d42, 0.34)
        .fillRoundedRect(x, 56, 86, 90, 16);
      graphics.lineStyle(1, 0xd8c37a, 0.24).strokeRoundedRect(x, 56, 86, 90, 16);
      graphics.fillStyle(0xf0c25f, 0.24).fillCircle(x + 43, 78, 3);
    }

    graphics.fillStyle(0x080d19, 1).fillEllipse(WIDTH / 2, 470, 1168, 532);
    graphics.lineStyle(7, 0x3b2440, 1).strokeEllipse(WIDTH / 2, 470, 1168, 532);
    graphics.lineStyle(3, 0xd4ae56, 0.86).strokeEllipse(WIDTH / 2, 468, 1126, 500);
    graphics.fillStyle(0x093f42, 1).fillEllipse(WIDTH / 2, 462, 1080, 456);
    graphics.lineStyle(2, 0x8bd9bd, 0.55).strokeEllipse(WIDTH / 2, 462, 1042, 422);
    graphics.lineStyle(2, 0xe4bf62, 0.38).strokeEllipse(WIDTH / 2, 462, 974, 365);
    graphics.fillStyle(0x061d2a, 0.46).fillEllipse(WIDTH / 2, 627, 978, 170);

    for (let x = 170; x < WIDTH - 150; x += 48) {
      for (let y = 252; y < 592; y += 44) {
        const offset = (Math.floor(y / 44) + Math.floor(x / 48)) % 2 === 0 ? 0 : 4;
        graphics.fillStyle(0xa9ead0, 0.055).fillCircle(x + offset, y, 1.5);
      }
    }

    const dealerStation = this.add.container(WIDTH / 2, 154);
    const dealerShadow = this.add.graphics();
    dealerShadow.fillStyle(0x02030a, 0.5).fillEllipse(0, 12, 174, 74);
    dealerShadow.fillStyle(0x15283b, 1).fillCircle(0, -18, 24);
    dealerShadow.fillStyle(0x15283b, 1).fillTriangle(-56, 33, 56, 33, 0, -2);
    dealerShadow.lineStyle(2, 0xc9a855, 0.42).strokeCircle(0, -18, 24);
    dealerStation.add(dealerShadow);

    this.add
      .text(WIDTH / 2, 73, "CASINO ATLAS", {
        fontFamily: "Georgia",
        fontSize: "25px",
        color: "#fff0b0",
        fontStyle: "bold",
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(WIDTH / 2, 106, "TABLE 01  ·  BLACKJACK SALON", {
        fontFamily: "Arial",
        fontSize: "10px",
        color: "#94dfca",
        letterSpacing: 3.2,
      })
      .setOrigin(0.5);

    this.createAmbientLights();
    this.tableLayer = this.add.container();
    this.handLayer = this.add.container();
    this.uiLayer = this.add.container();
  }

  private createAmbientLights() {
    const colors = [0xf5c75e, 0x5de0c1, 0xc66c9d];
    for (let index = 0; index < 13; index += 1) {
      const light = this.add.circle(
        Phaser.Math.Between(60, WIDTH - 60),
        Phaser.Math.Between(42, 168),
        Phaser.Math.Between(1, 3),
        colors[index % colors.length],
        0.45,
      );
      this.tweens.add({
        targets: light,
        alpha: 0.1,
        scale: 0.6,
        duration: Phaser.Math.Between(900, 1800),
        delay: index * 85,
        yoyo: true,
        repeat: -1,
        ease: "Sine.InOut",
      });
    }
  }

  private render() {
    if (!this.payload || !this.tableLayer || !this.handLayer || !this.uiLayer) return;
    const { state, selectedBet, message, labels } = this.payload;
    const enteredRound = this.lastPhase === "betting" && state.phase === "player-turn";
    const settledRound = this.lastPhase !== "settled" && state.phase === "settled";
    this.tableLayer.removeAll(true);
    this.handLayer.removeAll(true);
    this.uiLayer.removeAll(true);
    this.drawHeader(state, labels);
    this.drawDealer(state, labels);
    this.drawBetArea(selectedBet, state, labels);
    this.drawPlayerHands(state, labels);
    this.drawMessage(message, state, labels);
    this.drawFooter(state, selectedBet, labels);
    if (enteredRound) this.showRoundCallout("CARDS IN PLAY", "#a7ffe8");
    if (settledRound) this.showResult(state, labels);
    this.lastDealerCount = state.dealer.length;
    this.lastHandCounts = state.hands.map((hand) => hand.cards.length);
    this.lastPhase = state.phase;
  }

  private drawHeader(state: BlackjackState, labels: Record<string, string>) {
    const phaseLabel =
      state.phase === "betting"
        ? labels.phaseBetting
        : state.phase === "player-turn"
          ? labels.phasePlayer
          : state.phase === "dealer-turn"
            ? labels.phaseDealer
            : labels.phaseSettled;
    const phaseColor =
      state.phase === "settled" ? "#ffe087" : state.phase === "player-turn" ? "#9af4d7" : "#bbd8f1";
    const balance = this.add.container(1000, 58);
    const panel = this.add.graphics();
    panel.fillStyle(0x071729, 0.88).fillRoundedRect(0, 0, 210, 54, 14);
    panel.lineStyle(1, 0x5c86a0, 0.76).strokeRoundedRect(0, 0, 210, 54, 14);
    balance.add([
      panel,
      this.add.text(16, 10, labels.balance, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#91dfc9",
        letterSpacing: 1.7,
      }),
      this.add.text(16, 26, state.bankroll.toLocaleString(), {
        fontFamily: "'DM Mono', monospace",
        fontSize: "19px",
        color: "#ffffff",
        fontStyle: "bold",
      }),
      this.add
        .text(190, 31, "◆", { fontFamily: "Arial", fontSize: "17px", color: "#edc55f" })
        .setOrigin(0.5),
    ]);
    this.uiLayer.add(balance);

    const phase = this.add.container(70, 62);
    const phasePanel = this.add.graphics();
    phasePanel.fillStyle(0x10152b, 0.82).fillRoundedRect(0, 0, 212, 33, 16);
    phasePanel.lineStyle(1, 0x425a78, 0.72).strokeRoundedRect(0, 0, 212, 33, 16);
    phase.add([
      phasePanel,
      this.add.circle(16, 16, 4, state.phase === "player-turn" ? 0x62e4be : 0xe9bf60),
      this.add.text(29, 10, phaseLabel, {
        fontFamily: "Arial",
        fontSize: "10px",
        color: phaseColor,
        fontStyle: "bold",
        letterSpacing: 1.4,
      }),
    ]);
    this.uiLayer.add(phase);
  }

  private drawDealer(state: BlackjackState, labels: Record<string, string>) {
    const dealerTitle = this.add.container(WIDTH / 2, 175);
    const dealerPanel = this.add.graphics();
    dealerPanel.fillStyle(0x07182a, 0.84).fillRoundedRect(-91, -16, 182, 31, 15);
    dealerPanel.lineStyle(1, 0x74957f, 0.75).strokeRoundedRect(-91, -16, 182, 31, 15);
    dealerTitle.add([
      dealerPanel,
      this.add
        .text(0, 0, `◆  ${labels.dealer}`, {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#c6f6e8",
          fontStyle: "bold",
          letterSpacing: 2.4,
        })
        .setOrigin(0.5),
    ]);
    this.handLayer.add(dealerTitle);
    this.drawHand(state.dealer, WIDTH / 2, 260, state.phase === "player-turn", "dealer");
    if (state.phase !== "betting" && state.phase !== "player-turn") {
      const value = handValue(state.dealer).total;
      this.handLayer.add(
        this.add
          .text(WIDTH / 2, 326, `${labels.total} ${value}`, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: "#d9f9ee",
            letterSpacing: 1,
          })
          .setOrigin(0.5),
      );
    }
  }

  private drawPlayerHands(state: BlackjackState, labels: Record<string, string>) {
    if (!state.hands.length) return;
    const spacing = state.hands.length === 1 ? 0 : 258;
    state.hands.forEach((hand, index) => {
      const x = WIDTH / 2 + (index - (state.hands.length - 1) / 2) * spacing;
      const isActive = index === state.activeHand && state.phase === "player-turn";
      if (isActive) {
        const glow = this.add.graphics();
        glow.fillStyle(0xf5dc75, 0.08).fillRoundedRect(x - 166, 362, 332, 197, 26);
        glow.lineStyle(2, 0xf5dc75, 0.82).strokeRoundedRect(x - 166, 362, 332, 197, 26);
        this.handLayer.add(glow);
      }
      this.handLayer.add(
        this.add
          .text(x, 380, `${labels.player}${state.hands.length > 1 ? ` ${index + 1}` : ""}`, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: isActive ? "#ffe896" : "#b3f4df",
            fontStyle: "bold",
            letterSpacing: 2.2,
          })
          .setOrigin(0.5),
      );
      this.drawHand(hand.cards, x, 465, false, `hand-${index}`);
      const total = handValue(hand.cards).total;
      this.handLayer.add(
        this.add
          .text(x, 540, `${labels.total} ${total}`, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: total > 21 ? "#ffafba" : "#e1fff6",
            letterSpacing: 1,
          })
          .setOrigin(0.5),
      );
      if (hand.outcome) this.drawOutcome(x, 565, hand, labels);
    });
  }

  private drawOutcome(x: number, y: number, hand: Hand, labels: Record<string, string>) {
    const map: Record<string, string> = {
      win: labels.win,
      lose: labels.lose,
      push: labels.push,
      blackjack: labels.blackjack,
    };
    const outcome = hand.outcome ?? "";
    const color = outcome === "lose" ? "#ff94a4" : outcome === "push" ? "#c8d5e6" : "#fff0a5";
    this.handLayer.add(
      this.add
        .text(x, y, map[outcome] ?? "", {
          fontFamily: "Arial",
          fontSize: "14px",
          color,
          fontStyle: "bold",
          letterSpacing: 1.6,
        })
        .setOrigin(0.5),
    );
  }

  private drawHand(cards: Card[], x: number, y: number, hideSecond: boolean, id: string) {
    const gap = 82;
    cards.forEach((card, index) => {
      const cardX = x + (index - (cards.length - 1) / 2) * gap;
      const faceDown = hideSecond && index === 1;
      const container = this.makeCard(cardX, y, card, faceDown);
      this.handLayer.add(container);
      const prior =
        id === "dealer"
          ? this.lastDealerCount
          : (this.lastHandCounts[Number(id.replace("hand-", ""))] ?? 0);
      if (index >= prior) {
        container.setPosition(1110, 196).setScale(0.6).setAlpha(0.15).setRotation(0.16);
        this.tweens.add({
          targets: container,
          x: cardX,
          y,
          scale: 1,
          alpha: 1,
          rotation: 0,
          ease: "Cubic.Out",
          duration: 460,
          delay: (index - prior) * 155,
        });
      }
    });
  }

  private makeCard(x: number, y: number, card: Card, faceDown: boolean) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x00030a, 0.46).fillRoundedRect(-32, -42, 72, 98, 10);
    const face = this.add.graphics();
    face.fillStyle(faceDown ? 0x2a397e : 0xfaf9f3, 1).fillRoundedRect(-36, -48, 72, 94, 9);
    face.lineStyle(2, faceDown ? 0xe4bd62 : 0xc8d2dd, 1).strokeRoundedRect(-36, -48, 72, 94, 9);
    container.add([shadow, face]);
    if (faceDown) {
      const pattern = this.add.graphics();
      pattern.fillStyle(0x152359, 0.85).fillRoundedRect(-28, -40, 56, 78, 7);
      for (let offset = -16; offset <= 16; offset += 11) {
        pattern.lineStyle(1, 0x9df1d8, 0.62).strokeCircle(offset, 0, 7);
      }
      container.add(pattern);
      return container;
    }
    const red = card.suit === "hearts" || card.suit === "diamonds";
    const ink = red ? "#c42d47" : "#17243b";
    container.add(
      this.add.text(-27, -37, card.rank, {
        fontFamily: "Georgia",
        fontSize: "19px",
        color: ink,
        fontStyle: "bold",
      }),
    );
    container.add(
      this.add.text(-25, -17, suitSymbols[card.suit], {
        fontFamily: "Arial",
        fontSize: "14px",
        color: ink,
      }),
    );
    container.add(
      this.add
        .text(0, 4, suitSymbols[card.suit], {
          fontFamily: "Georgia",
          fontSize: "36px",
          color: ink,
        })
        .setOrigin(0.5),
    );
    return container;
  }

  private drawBetArea(selectedBet: number, state: BlackjackState, labels: Record<string, string>) {
    const x = 176;
    const y = 440;
    const ring = this.add.graphics();
    ring.fillStyle(0x061a26, 0.85).fillCircle(x, y, 105);
    ring.lineStyle(3, 0xf1d36d, 0.72).strokeCircle(x, y, 105);
    ring.lineStyle(1, 0xa9f0dc, 0.68).strokeCircle(x, y, 88);
    this.tableLayer.add(ring);
    this.tableLayer.add(
      this.add
        .text(x, y - 58, labels.bet, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#b9f1df",
          letterSpacing: 1.8,
        })
        .setOrigin(0.5),
    );
    if (selectedBet > 0) {
      const stack = makeChipStack(this, selectedBet).setPosition(x, y + 18);
      this.tableLayer.add(stack);
      this.tableLayer.add(
        this.add
          .text(x, y + 59, selectedBet.toLocaleString(), {
            fontFamily: "'DM Mono', monospace",
            fontSize: "13px",
            color: "#fff7c8",
            fontStyle: "bold",
          })
          .setOrigin(0.5),
      );
    } else {
      this.tableLayer.add(
        this.add
          .text(x, y + 5, labels.place, {
            fontFamily: "Arial",
            fontSize: "11px",
            color: "#80c7b7",
            align: "center",
            wordWrap: { width: 140 },
          })
          .setOrigin(0.5),
      );
    }
    if (state.phase === "betting" && selectedBet > 0) {
      this.canvasButton(
        114,
        555,
        124,
        32,
        labels.clear,
        () => this.emit({ type: "bet:clear" }),
        true,
        "small",
      );
    }
  }

  private drawMessage(message: string, state: BlackjackState, labels: Record<string, string>) {
    const box = this.add.graphics();
    box.fillStyle(0x061728, 0.88).fillRoundedRect(380, 340, 520, 38, 19);
    box
      .lineStyle(1, state.phase === "player-turn" ? 0xe4bf68 : 0x4d8d82, 0.72)
      .strokeRoundedRect(380, 340, 520, 38, 19);
    const icon = state.phase === "settled" ? "✦" : state.phase === "player-turn" ? "◆" : "•";
    this.uiLayer.add([
      box,
      this.add.text(402, 351, icon, { fontFamily: "Arial", fontSize: "13px", color: "#f4cf6c" }),
      this.add
        .text(WIDTH / 2 + 10, 359, message, {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#e1f7f0",
          wordWrap: { width: 445 },
        })
        .setOrigin(0.5),
      this.add
        .text(WIDTH / 2, 390, labels.shortcuts, {
          fontFamily: "Arial",
          fontSize: "8px",
          color: "#79b9aa",
          letterSpacing: 0.8,
        })
        .setOrigin(0.5),
    ]);
  }

  private drawFooter(state: BlackjackState, selectedBet: number, labels: Record<string, string>) {
    const baseY = 628;
    if (state.phase === "betting") {
      this.uiLayer.add(
        this.add.text(72, 603, labels.choose, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#9be1d0",
          letterSpacing: 1.5,
        }),
      );
      CHIP_DENOMS.forEach((value, index) => {
        const chip = makeChip(this, value, 0.9).setPosition(126 + index * 88, 652);
        chip.setSize(68, 68).setInteractive({ useHandCursor: true });
        chip.on("pointerover", () => chip.setScale(1.02));
        chip.on("pointerout", () => chip.setScale(0.9));
        chip.on("pointerup", () => this.emit({ type: "chip:add", value }));
        this.uiLayer.add(chip);
        this.uiLayer.add(
          this.add
            .text(126 + index * 88, 693, String(index + 1), {
              fontFamily: "'DM Mono', monospace",
              fontSize: "8px",
              color: "#84aea8",
            })
            .setOrigin(0.5),
        );
      });
      this.canvasButton(
        525,
        618,
        262,
        64,
        labels.deal,
        () => this.emit({ type: "deal" }),
        selectedBet > 0 && selectedBet <= state.bankroll,
        "main",
        "ENTER",
      );
      return;
    }
    if (state.phase === "player-turn") {
      const hand = state.hands[state.activeHand];
      const canDouble = Boolean(hand && hand.cards.length === 2 && state.bankroll >= hand.bet);
      const canSplit = Boolean(
        hand &&
        hand.cards.length === 2 &&
        hand.cards[0]?.rank === hand.cards[1]?.rank &&
        state.bankroll >= hand.bet,
      );
      this.canvasButton(
        400,
        baseY,
        132,
        58,
        labels.hit,
        () => this.emit({ type: "hit" }),
        true,
        "main",
        "H",
      );
      this.canvasButton(
        544,
        baseY,
        132,
        58,
        labels.stand,
        () => this.emit({ type: "stand" }),
        true,
        "outline",
        "S",
      );
      this.canvasButton(
        688,
        baseY,
        132,
        58,
        labels.double,
        () => this.emit({ type: "double" }),
        canDouble,
        "outline",
        "D",
      );
      this.canvasButton(
        832,
        baseY,
        132,
        58,
        labels.split,
        () => this.emit({ type: "split" }),
        canSplit,
        "outline",
        "P",
      );
      return;
    }
    if (state.phase === "settled") {
      this.canvasButton(
        525,
        618,
        262,
        64,
        labels.next,
        () => this.emit({ type: "next" }),
        true,
        "main",
        "ENTER",
      );
    }
  }

  private canvasButton(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    action: () => void,
    enabled: boolean,
    style: "main" | "outline" | "small",
    shortcut?: string,
  ) {
    const button = this.add.container(x + width / 2, y + height / 2);
    const graphics = this.add.graphics();
    const main = style === "main";
    const fill = enabled ? (main ? 0x57d8bc : 0x0c2944) : 0x122239;
    const stroke = enabled ? (main ? 0xb4f7e5 : 0x6586a3) : 0x2d465c;
    graphics
      .fillStyle(fill, 1)
      .fillRoundedRect(-width / 2, -height / 2, width, height, style === "small" ? 10 : 14);
    graphics
      .lineStyle(2, stroke, 1)
      .strokeRoundedRect(-width / 2, -height / 2, width, height, style === "small" ? 10 : 14);
    const labelText = this.add
      .text(0, shortcut ? -5 : 0, label, {
        fontFamily: "Arial",
        fontSize: style === "small" ? "10px" : "13px",
        color: enabled ? (main ? "#062338" : "#e8f7ff") : "#60778d",
        fontStyle: "bold",
        letterSpacing: 1.1,
      })
      .setOrigin(0.5);
    button.add([graphics, labelText]);
    if (shortcut) {
      button.add(
        this.add
          .text(0, height / 2 - 12, shortcut, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "8px",
            color: enabled ? (main ? "#165062" : "#87adc9") : "#536a7c",
            letterSpacing: 1,
          })
          .setOrigin(0.5),
      );
    }
    if (enabled) {
      button.setSize(width, height).setInteractive({ useHandCursor: true });
      button.on("pointerover", () => button.setScale(1.03));
      button.on("pointerout", () => button.setScale(1));
      button.on("pointerdown", () => button.setScale(0.97));
      button.on("pointerup", () => {
        button.setScale(1.03);
        action();
      });
    }
    this.uiLayer.add(button);
  }

  private showRoundCallout(text: string, color: string) {
    const callout = this.add
      .text(WIDTH / 2, 200, text, {
        fontFamily: "Arial",
        fontSize: "18px",
        color,
        fontStyle: "bold",
        letterSpacing: 3.2,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.8);
    this.uiLayer.add(callout);
    this.tweens.add({
      targets: callout,
      alpha: 1,
      scale: 1,
      y: 186,
      duration: 300,
      yoyo: true,
      hold: 600,
      ease: "Quad.Out",
      onComplete: () => callout.destroy(),
    });
  }

  private showResult(state: BlackjackState, labels: Record<string, string>) {
    const outcomes = state.hands.map((hand) => hand.outcome);
    const hasWin = outcomes.some((outcome) => outcome === "win" || outcome === "blackjack");
    const hasPush = outcomes.includes("push");
    const title = hasWin ? labels.win : hasPush ? labels.push : labels.lose;
    const color = hasWin ? "#ffe583" : hasPush ? "#c9d8e8" : "#ff9ead";
    const banner = this.add
      .container(WIDTH / 2, 414)
      .setAlpha(0)
      .setScale(0.7);
    const panel = this.add.graphics();
    panel
      .fillStyle(hasWin ? 0x594620 : hasPush ? 0x213c4b : 0x572033, 0.94)
      .fillRoundedRect(-180, -35, 360, 70, 20);
    panel
      .lineStyle(2, hasWin ? 0xf5d66f : hasPush ? 0xb8d5e7 : 0xff9eab, 0.9)
      .strokeRoundedRect(-180, -35, 360, 70, 20);
    banner.add([
      panel,
      this.add
        .text(0, -5, title, {
          fontFamily: "Arial",
          fontSize: "23px",
          color,
          fontStyle: "bold",
          letterSpacing: 3,
        })
        .setOrigin(0.5),
      this.add
        .text(
          0,
          19,
          hasWin
            ? "VIRTUAL CHIPS AWARDED"
            : hasPush
              ? "WAGER RETURNED"
              : "SHUFFLE UP FOR THE NEXT ROUND",
          {
            fontFamily: "Arial",
            fontSize: "8px",
            color: "#ebf8f2",
            letterSpacing: 1.8,
          },
        )
        .setOrigin(0.5),
    ]);
    this.uiLayer.add(banner);
    this.tweens.add({ targets: banner, alpha: 1, scale: 1, duration: 380, ease: "Back.Out" });
    if (hasWin) this.celebrateWins();
  }

  private celebrateWins() {
    for (let index = 0; index < 22; index += 1) {
      const dot = this.add.circle(WIDTH / 2, 425, 4, CHIP_COLORS[index % 2 ? 25 : 100].stripe);
      this.uiLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: WIDTH / 2 + Phaser.Math.Between(-290, 290),
        y: Phaser.Math.Between(220, 535),
        alpha: 0,
        scale: 0.2,
        duration: 950,
        delay: index * 20,
        ease: "Quad.Out",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private handleShortcut(event: KeyboardEvent) {
    if (!this.payload || event.repeat) return;
    const { state, selectedBet } = this.payload;
    const key = event.key.toLowerCase();
    if (state.phase === "betting") {
      const chipIndex = Number(key) - 1;
      if (chipIndex >= 0 && chipIndex < CHIP_DENOMS.length) {
        this.emit({ type: "chip:add", value: CHIP_DENOMS[chipIndex]! });
        return;
      }
      if (event.key === "Enter" && selectedBet > 0 && selectedBet <= state.bankroll) {
        this.emit({ type: "deal" });
      }
      return;
    }
    if (state.phase === "player-turn") {
      if (key === "h") this.emit({ type: "hit" });
      if (key === "s") this.emit({ type: "stand" });
      if (key === "d") this.emit({ type: "double" });
      if (key === "p") this.emit({ type: "split" });
      return;
    }
    if (state.phase === "settled" && event.key === "Enter") this.emit({ type: "next" });
  }

  private emit(action: BlackjackCommand) {
    const callback = this.registry.get("casinoAtlasAction") as
      | ((command: BlackjackCommand) => void)
      | undefined;
    callback?.(action);
  }
}
