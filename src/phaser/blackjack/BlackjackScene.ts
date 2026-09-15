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

  constructor() {
    super("blackjack-table");
  }

  create() {
    this.paintBackdrop();
    this.events.on("state", (payload: BlackjackScenePayload) => {
      this.payload = payload;
      this.render();
    });
    this.scale.on("resize", (size: Phaser.Structs.Size) =>
      this.fitLogicalTable(size.width, size.height),
    );
    this.fitLogicalTable(this.scale.width, this.scale.height);
    this.render();
  }

  /** Scale the fixed game-world coordinates into the live viewport without scaling the bitmap. */
  private fitLogicalTable(viewportWidth: number, viewportHeight: number) {
    const scale = Math.min(viewportWidth / WIDTH, viewportHeight / HEIGHT);
    this.cameras.main.setZoom(scale);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
    if (this.payload) this.render();
  }

  private paintBackdrop() {
    this.children.removeAll(true);
    const g = this.add.graphics();
    g.fillStyle(0x030914, 1).fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0x071b36, 1).fillRoundedRect(21, 18, WIDTH - 42, HEIGHT - 36, 32);
    g.lineStyle(2, 0x315779, 1).strokeRoundedRect(21, 18, WIDTH - 42, HEIGHT - 36, 32);
    g.fillStyle(0x0b5f55, 1).fillRoundedRect(48, 73, WIDTH - 96, HEIGHT - 144, 60);
    g.lineStyle(3, 0x80e6c8, 0.55).strokeRoundedRect(48, 73, WIDTH - 96, HEIGHT - 144, 60);
    g.lineStyle(2, 0xd9b95a, 0.38).strokeRoundedRect(72, 97, WIDTH - 144, HEIGHT - 192, 48);
    for (let x = 105; x < WIDTH - 100; x += 38)
      for (let y = 135; y < HEIGHT - 120; y += 38) g.fillStyle(0x7ce7c7, 0.06).fillCircle(x, y, 1);
    this.add.text(82, 42, "CASINO ATLAS", {
      fontFamily: "Georgia",
      fontSize: "20px",
      color: "#fff2bc",
      fontStyle: "bold",
      letterSpacing: 3,
    });
    this.add.text(84, 65, "BLACKJACK · VIRTUAL TABLE", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#77cbb7",
      letterSpacing: 2,
    });
    const deck = this.add.container(1113, 111);
    for (let i = 0; i < 3; i++) {
      const card = this.add.graphics();
      card.fillStyle(0x242e7e, 1).fillRoundedRect(-30 + i * 3, -43 - i * 3, 60, 84, 8);
      card.lineStyle(2, 0xa9f5e2, 0.65).strokeRoundedRect(-30 + i * 3, -43 - i * 3, 60, 84, 8);
      deck.add(card);
    }
    this.add
      .text(1113, 168, "SHOE", {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#aeeedf",
        letterSpacing: 2,
      })
      .setOrigin(0.5);
    this.tableLayer = this.add.container();
    this.handLayer = this.add.container();
    this.uiLayer = this.add.container();
  }

  private render() {
    if (!this.payload || !this.tableLayer || !this.handLayer || !this.uiLayer) return;
    const previousPhase = this.payload.state.phase;
    this.tableLayer.removeAll(true);
    this.handLayer.removeAll(true);
    this.uiLayer.removeAll(true);
    const { state, selectedBet, message, labels } = this.payload;
    this.drawHeader(state, labels);
    this.drawDealer(state, labels);
    this.drawBetArea(selectedBet, state, labels);
    this.drawPlayerHands(state, labels);
    this.drawMessage(message);
    this.drawFooter(state, selectedBet, labels);
    if (state.phase === "settled" && previousPhase !== "settled") this.celebrateWins(state);
    this.lastDealerCount = state.dealer.length;
    this.lastHandCounts = state.hands.map((hand) => hand.cards.length);
  }

  private drawHeader(state: BlackjackState, labels: Record<string, string>) {
    const balance = this.add.container(1010, 38);
    const box = this.add.graphics();
    box.fillStyle(0x0c2743, 0.94).fillRoundedRect(-2, -22, 180, 46, 13);
    box.lineStyle(1, 0x4b7da1, 0.8).strokeRoundedRect(-2, -22, 180, 46, 13);
    balance.add([
      box,
      this.add.text(15, -11, labels.balance, {
        fontFamily: "Arial",
        fontSize: "9px",
        color: "#7fdcc7",
        letterSpacing: 1.5,
      }),
      this.add.text(15, 5, state.bankroll.toLocaleString(), {
        fontFamily: "'DM Mono', monospace",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
      }),
    ]);
    this.uiLayer.add(balance);
  }

  private drawDealer(state: BlackjackState, labels: Record<string, string>) {
    const title = this.add
      .text(WIDTH / 2, 125, labels.dealer, {
        fontFamily: "Arial",
        fontSize: "13px",
        color: "#b3f4df",
        fontStyle: "bold",
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    this.handLayer.add(title);
    this.drawHand(state.dealer, WIDTH / 2, 208, state.phase === "player-turn", false, "dealer");
    if (state.phase !== "betting" && state.phase !== "player-turn") {
      const value = handValue(state.dealer).total;
      this.handLayer.add(
        this.add
          .text(WIDTH / 2, 285, `${labels.total} ${value}`, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: "#d9f9ee",
          })
          .setOrigin(0.5),
      );
    }
  }

  private drawPlayerHands(state: BlackjackState, labels: Record<string, string>) {
    if (!state.hands.length) return;
    const spacing = state.hands.length === 1 ? 0 : 220;
    state.hands.forEach((hand, index) => {
      const x = WIDTH / 2 + (index - (state.hands.length - 1) / 2) * spacing;
      const isActive = index === state.activeHand && state.phase === "player-turn";
      if (isActive) {
        const glow = this.add.graphics();
        glow.lineStyle(2, 0xf5dc75, 0.8).strokeRoundedRect(x - 145, 333, 290, 215, 22);
        this.handLayer.add(glow);
      }
      this.handLayer.add(
        this.add
          .text(x, 354, `${labels.player} ${state.hands.length > 1 ? index + 1 : ""}`, {
            fontFamily: "Arial",
            fontSize: "12px",
            color: isActive ? "#ffe896" : "#b3f4df",
            fontStyle: "bold",
            letterSpacing: 2,
          })
          .setOrigin(0.5),
      );
      this.drawHand(hand.cards, x, 445, false, true, `hand-${index}`);
      const total = handValue(hand.cards).total;
      this.handLayer.add(
        this.add
          .text(x, 518, `${labels.total} ${total}`, {
            fontFamily: "'DM Mono', monospace",
            fontSize: "12px",
            color: "#e1fff6",
          })
          .setOrigin(0.5),
      );
      if (hand.outcome) this.drawOutcome(x, 542, hand, labels);
    });
  }

  private drawOutcome(x: number, y: number, hand: Hand, labels: Record<string, string>) {
    const map: Record<string, string> = {
      win: labels.win,
      lose: labels.lose,
      push: labels.push,
      blackjack: labels.blackjack,
    };
    const key = hand.outcome ?? "";
    const color = key === "lose" ? "#ff94a4" : key === "push" ? "#b9d0e9" : "#fff0a5";
    this.handLayer.add(
      this.add
        .text(x, y, map[key] ?? "", {
          fontFamily: "Arial",
          fontSize: "13px",
          color,
          fontStyle: "bold",
          letterSpacing: 1.2,
        })
        .setOrigin(0.5),
    );
  }

  private drawHand(
    cards: Card[],
    x: number,
    y: number,
    hideSecond: boolean,
    animate: boolean,
    id: string,
  ) {
    const gap = 79;
    cards.forEach((card, index) => {
      const cardX = x + (index - (cards.length - 1) / 2) * gap;
      const faceDown = hideSecond && index === 1;
      const container = this.makeCard(cardX, y, card, faceDown);
      this.handLayer.add(container);
      const prior =
        id === "dealer"
          ? this.lastDealerCount
          : (this.lastHandCounts[Number(id.replace("hand-", ""))] ?? 0);
      if (animate && index >= prior) {
        container.setPosition(1113, 111).setScale(0.65).setAlpha(0.2).setRotation(0.18);
        this.tweens.add({
          targets: container,
          x: cardX,
          y,
          scale: 1,
          alpha: 1,
          rotation: 0,
          ease: "Cubic.Out",
          duration: 430,
          delay: (index - prior) * 180,
        });
      }
    });
  }

  private makeCard(x: number, y: number, card: Card, faceDown: boolean) {
    const container = this.add.container(x, y);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x00111d, 0.45).fillRoundedRect(-32, -43, 70, 96, 10);
    const face = this.add.graphics();
    face.fillStyle(faceDown ? 0x293d9c : 0xf8f9fe, 1).fillRoundedRect(-36, -48, 70, 92, 9);
    face.lineStyle(2, faceDown ? 0x93e9d3 : 0xd6deeb, 1).strokeRoundedRect(-36, -48, 70, 92, 9);
    container.add([shadow, face]);
    if (faceDown) {
      const pattern = this.add.graphics();
      for (let i = -18; i <= 18; i += 12) {
        pattern.lineStyle(1, 0x91f0da, 0.55).strokeCircle(i, 0, 8);
      }
      container.add(pattern);
      return container;
    }
    const red = card.suit === "hearts" || card.suit === "diamonds";
    const ink = red ? "#d53a55" : "#12213a";
    container.add(
      this.add.text(-27, -37, card.rank, {
        fontFamily: "Georgia",
        fontSize: "18px",
        color: ink,
        fontStyle: "bold",
      }),
    );
    container.add(
      this.add.text(-25, -17, suitSymbols[card.suit], {
        fontFamily: "Arial",
        fontSize: "13px",
        color: ink,
      }),
    );
    container.add(
      this.add
        .text(0, 4, suitSymbols[card.suit], { fontFamily: "Georgia", fontSize: "35px", color: ink })
        .setOrigin(0.5),
    );
    return container;
  }

  private drawBetArea(selectedBet: number, state: BlackjackState, labels: Record<string, string>) {
    const x = 173,
      y = 427;
    const ring = this.add.graphics();
    ring.fillStyle(0x082e35, 0.7).fillCircle(x, y, 105);
    ring.lineStyle(2, 0xf1d36d, 0.72).strokeCircle(x, y, 105);
    ring.lineStyle(1, 0xa9f0dc, 0.55).strokeCircle(x, y, 89);
    this.tableLayer.add(ring);
    this.tableLayer.add(
      this.add
        .text(x, y - 59, labels.bet, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#a8ead8",
          letterSpacing: 2,
        })
        .setOrigin(0.5),
    );
    if (selectedBet > 0) {
      const stack = makeChipStack(this, selectedBet).setPosition(x, y + 17);
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
    } else
      this.tableLayer.add(
        this.add
          .text(x, y + 4, labels.place, {
            fontFamily: "Arial",
            fontSize: "11px",
            color: "#78bcaf",
            align: "center",
            wordWrap: { width: 140 },
          })
          .setOrigin(0.5),
      );
    if (state.phase === "betting" && selectedBet > 0)
      this.canvasButton(
        112,
        548,
        122,
        33,
        labels.clear,
        () => this.emit({ type: "bet:clear" }),
        true,
        "small",
      );
  }

  private drawMessage(message: string) {
    const box = this.add.graphics();
    box.fillStyle(0x071d34, 0.78).fillRoundedRect(372, 300, 536, 36, 18);
    box.lineStyle(1, 0x45806f, 0.65).strokeRoundedRect(372, 300, 536, 36, 18);
    this.uiLayer.add([
      box,
      this.add
        .text(WIDTH / 2, 318, message, { fontFamily: "Arial", fontSize: "12px", color: "#d9f5ed" })
        .setOrigin(0.5),
    ]);
  }

  private drawFooter(state: BlackjackState, selectedBet: number, labels: Record<string, string>) {
    const baseY = 647;
    if (state.phase === "betting") {
      this.uiLayer.add(
        this.add.text(76, 606, labels.choose, {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#83d7c4",
          letterSpacing: 1.5,
        }),
      );
      CHIP_DENOMS.forEach((value, index) => {
        const chip = makeChip(this, value, 0.93).setPosition(126 + index * 89, 650);
        chip.setSize(70, 70).setInteractive({ useHandCursor: true });
        chip.on("pointerover", () => chip.setScale(1.03));
        chip.on("pointerout", () => chip.setScale(0.93));
        chip.on("pointerup", () => this.emit({ type: "chip:add", value }));
        this.uiLayer.add(chip);
      });
      // The right-side guide occupies the far-right physical viewport. Keep primary controls
      // in the unobscured centre of the logical table, rather than behind that Vue overlay.
      this.canvasButton(
        545,
        616,
        255,
        66,
        labels.deal,
        () => this.emit({ type: "deal" }),
        selectedBet > 0 && selectedBet <= state.bankroll,
        "main",
      );
    } else if (state.phase === "player-turn") {
      const hand = state.hands[state.activeHand];
      const canDouble = Boolean(hand && hand.cards.length === 2 && state.bankroll >= hand.bet);
      const canSplit = Boolean(
        hand &&
        hand.cards.length === 2 &&
        hand.cards[0]?.rank === hand.cards[1]?.rank &&
        state.bankroll >= hand.bet,
      );
      this.canvasButton(
        535,
        baseY,
        130,
        58,
        labels.hit,
        () => this.emit({ type: "hit" }),
        true,
        "main",
      );
      this.canvasButton(
        678,
        baseY,
        130,
        58,
        labels.stand,
        () => this.emit({ type: "stand" }),
        true,
        "outline",
      );
      this.canvasButton(
        821,
        baseY,
        130,
        58,
        labels.double,
        () => this.emit({ type: "double" }),
        canDouble,
        "outline",
      );
      this.canvasButton(
        964,
        baseY,
        130,
        58,
        labels.split,
        () => this.emit({ type: "split" }),
        canSplit,
        "outline",
      );
    } else if (state.phase === "settled")
      this.canvasButton(
        545,
        616,
        255,
        66,
        labels.next,
        () => this.emit({ type: "next" }),
        true,
        "main",
      );
  }

  private canvasButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    action: () => void,
    enabled: boolean,
    style: "main" | "outline" | "small",
  ) {
    const button = this.add.container(x, y);
    const g = this.add.graphics();
    const main = style === "main";
    g.fillStyle(enabled ? (main ? 0x55d8bd : 0x0b2944) : 0x12233b, 1).fillRoundedRect(
      0,
      0,
      w,
      h,
      13,
    );
    g.lineStyle(2, enabled ? (main ? 0xa5f5df : 0x5082a4) : 0x2a4861, 1).strokeRoundedRect(
      0,
      0,
      w,
      h,
      13,
    );
    const text = this.add
      .text(w / 2, h / 2, label, {
        fontFamily: "Arial",
        fontSize: style === "small" ? "10px" : "13px",
        color: enabled ? (main ? "#062338" : "#e8f7ff") : "#60778d",
        fontStyle: "bold",
        letterSpacing: 1.1,
      })
      .setOrigin(0.5);
    button.add([g, text]);
    if (enabled) {
      // Containers otherwise rely on child bounds, which makes the pointer area drift once
      // the canvas is FIT-scaled. A fixed local rectangle exactly matches the drawn button.
      button.setSize(w, h);
      button.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), (area, pointerX, pointerY) =>
        area.contains(pointerX, pointerY),
      );
      if (button.input) button.input.cursor = "pointer";
      button.on("pointerover", () => button.setScale(1.035));
      button.on("pointerout", () => button.setScale(1));
      button.on("pointerup", action);
    }
    this.uiLayer.add(button);
  }

  private celebrateWins(state: BlackjackState) {
    if (!state.hands.some((hand) => hand.outcome === "win" || hand.outcome === "blackjack")) return;
    for (let i = 0; i < 18; i++) {
      const dot = this.add.circle(WIDTH / 2, 430, 4, CHIP_COLORS[i % 2 ? 25 : 100].stripe);
      this.uiLayer.add(dot);
      this.tweens.add({
        targets: dot,
        x: WIDTH / 2 + Phaser.Math.Between(-250, 250),
        y: Phaser.Math.Between(260, 500),
        alpha: 0,
        scale: 0.2,
        duration: 900,
        delay: i * 22,
        ease: "Quad.Out",
        onComplete: () => dot.destroy(),
      });
    }
  }
  private emit(action: BlackjackCommand) {
    const callback = this.registry.get("casinoAtlasAction") as
      | ((command: BlackjackCommand) => void)
      | undefined;
    callback?.(action);
  }
}
