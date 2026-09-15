<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ArrowLeft, BookOpen, CircleHelp, X } from "lucide-vue-next";
import BlackjackTable from "../components/BlackjackTable.vue";
import { BlackjackEngine } from "../games/blackjack/engine";
import { handValue } from "../games/blackjack/evaluator";
import type { BlackjackCommand } from "../phaser/gameBridge";
import { isChinese } from "../i18n";
import { useCasinoStore } from "../stores/casino";

const engine = new BlackjackEngine();
const state = reactive(engine.state);
const store = useCasinoStore();
const selectedBet = ref(0);
const helpOpen = ref(false);
const tutorialStep = ref(0);
let bankrollBeforeRound = state.bankroll;

const labels = computed(() =>
  isChinese.value
    ? {
        balance: "虚拟筹码",
        dealer: "庄 家",
        player: "玩 家",
        total: "点数",
        bet: "当前下注",
        place: "选择筹码",
        choose: "选择筹码下注",
        clear: "清除",
        deal: "发 牌",
        hit: "要 牌",
        stand: "停 牌",
        double: "加 倍",
        split: "分 牌",
        next: "下一局",
        win: "获 胜",
        lose: "庄家获胜",
        push: "和 局",
        blackjack: "BLACKJACK!",
      }
    : {
        balance: "VIRTUAL CHIPS",
        dealer: "DEALER",
        player: "PLAYER",
        total: "TOTAL",
        bet: "CURRENT BET",
        place: "CHOOSE\nCHIPS",
        choose: "CHOOSE YOUR CHIPS",
        clear: "CLEAR",
        deal: "DEAL CARDS",
        hit: "HIT",
        stand: "STAND",
        double: "DOUBLE",
        split: "SPLIT",
        next: "NEXT ROUND",
        win: "YOU WIN",
        lose: "DEALER WINS",
        push: "PUSH",
        blackjack: "BLACKJACK!",
      },
);

const settlementExplanation = computed(() => {
  const hand = state.hands.find((item) => item.outcomeReason);
  if (!hand?.outcomeReason) return "";
  const dealerTotal = state.dealer.length ? handValue(state.dealer).total : 0;
  const playerTotal = handValue(hand.cards).total;
  const reason = hand.outcomeReason;
  const copy = isChinese.value
    ? {
        "player-bust": "你爆牌了：手牌超过 21 点，因此庄家获胜。",
        "dealer-bust": "庄家爆牌：庄家手牌超过 21 点，因此你获胜。",
        "higher-total": `你的 ${playerTotal} 点高于庄家的 ${dealerTotal} 点，且双方都没有爆牌，因此你获胜。`,
        "lower-total": `庄家的 ${dealerTotal} 点高于你的 ${playerTotal} 点，且庄家没有爆牌，因此庄家获胜。`,
        "same-total": "双方点数相同，是和局（Push），下注筹码退回。",
        "player-blackjack": "你的前两张牌正好是 21 点 Blackjack，因此按 3:2 派彩。",
        "dealer-blackjack": "庄家的前两张牌正好是 21 点 Blackjack，因此庄家获胜。",
      }
    : {
        "player-bust": "You busted: your hand exceeded 21, so the dealer wins.",
        "dealer-bust": "The dealer busted: their hand exceeded 21, so you win.",
        "higher-total": `Your ${playerTotal} beat the dealer's ${dealerTotal}, with neither hand busting.`,
        "lower-total": `The dealer's ${dealerTotal} beat your ${playerTotal}, without the dealer busting.`,
        "same-total": "Both totals match: this is a push and your wager is returned.",
        "player-blackjack":
          "Your first two cards made 21: Blackjack pays 3:2 under this table's rules.",
        "dealer-blackjack": "The dealer's first two cards made 21: Blackjack, so the dealer wins.",
      };
  return copy[reason];
});
const message = computed(() => {
  if (state.phase === "betting") {
    if (selectedBet.value === 0)
      return isChinese.value
        ? "第 1 步：点击下方任意筹码，放入左侧下注圈。"
        : "Step 1: Click a chip below to place it in the bet circle.";
    return isChinese.value
      ? `已下注 ${selectedBet.value}。第 2 步：点击「发牌」开始。`
      : `Bet ${selectedBet.value} placed. Step 2: click DEAL CARDS.`;
  }
  if (state.phase === "player-turn") {
    const hand = state.hands[state.activeHand];
    if (!hand) return isChinese.value ? "请选择一个操作。" : "Choose an action.";
    const total = handValue(hand.cards).total;
    const canSplit = hand.cards.length === 2 && hand.cards[0]?.rank === hand.cards[1]?.rank;
    const canDouble = hand.cards.length === 2 && state.bankroll >= hand.bet;
    if (total > 21)
      return isChinese.value
        ? "你已爆牌，请等待结算。"
        : "You have busted. Wait for the round result.";
    if (canSplit)
      return isChinese.value
        ? `你有一对 ${hand.cards[0]?.rank}：可点「分牌」，或选择「要牌 / 停牌」。`
        : `You have a pair of ${hand.cards[0]?.rank}: choose SPLIT, HIT, or STAND.`;
    if (canDouble)
      return isChinese.value
        ? `你现在是 ${total} 点：选择「要牌」拿一张牌，或「停牌」让庄家补牌；也可以加倍。`
        : `You have ${total}: HIT for one more card, STAND to let the dealer play, or DOUBLE.`;
    return isChinese.value
      ? `你现在是 ${total} 点：选择「要牌」拿一张牌，或「停牌」让庄家补牌。`
      : `You have ${total}: choose HIT for one more card or STAND to let the dealer play.`;
  }
  if (state.phase === "settled")
    return `${settlementExplanation.value} ${isChinese.value ? "点击「下一局」重新下注。" : "Click NEXT ROUND to place a new bet."}`;
  return isChinese.value
    ? "庄家正在补牌，请稍候查看结果。"
    : "Dealer is drawing by the table rules—wait for the result.";
});
const payload = computed(() => ({
  state,
  selectedBet: selectedBet.value,
  message: message.value,
  labels: labels.value,
}));

function sync(record = false) {
  Object.assign(state, engine.state);
  if (record && state.phase === "settled") {
    store.recordRound(selectedBet.value, bankrollBeforeRound, state.bankroll);
    selectedBet.value = 0;
  }
}

function handle(command: BlackjackCommand) {
  if (command.type === "chip:add") {
    if (state.phase === "betting")
      selectedBet.value = Math.min(state.bankroll, selectedBet.value + command.value);
    return;
  }
  if (command.type === "bet:clear") {
    selectedBet.value = 0;
    return;
  }
  if (command.type === "deal") {
    if (selectedBet.value <= 0 || selectedBet.value > state.bankroll) return;
    bankrollBeforeRound = state.bankroll;
    engine.startRound(selectedBet.value);
    sync(true);
    return;
  }
  if (command.type === "next") {
    engine.reset();
    sync();
    return;
  }
  if (command.type === "hit") engine.hit();
  if (command.type === "stand") engine.stand();
  if (command.type === "double") engine.double();
  if (command.type === "split") engine.split();
  sync(true);
}

function advanceTutorial() {
  tutorialStep.value = Math.min(2, tutorialStep.value + 1);
  if (tutorialStep.value === 2) store.completeTutorial();
}
</script>

<template>
  <div class="arcade-stage">
    <BlackjackTable :payload="payload" @action="handle" />
    <div class="arcade-topbar">
      <RouterLink to="/" class="arcade-back"
        ><ArrowLeft :size="16" /> {{ isChinese ? "大厅" : "LOBBY" }}</RouterLink
      >
      <button class="learn-toggle" @click="helpOpen = !helpOpen">
        <BookOpen :size="16" /> {{ isChinese ? "说明书" : "GUIDE" }}
      </button>
    </div>
    <aside class="arcade-drawer">
      <button class="drawer-close" @click="helpOpen = false"><X :size="19" /></button>
      <p class="eyebrow">
        <CircleHelp :size="14" /> {{ isChinese ? "游戏中的学习卡" : "IN-GAME LEARNING CARD" }}
      </p>
      <h2>{{ isChinese ? "了解，而不是追逐。" : "Learn—do not chase." }}</h2>
      <div class="tutorial-copy">
        <p v-if="tutorialStep === 0">
          {{
            isChinese
              ? "A 可以计为 1 或 11。观察点数，再作决定。"
              : "An ace can count as 1 or 11. Observe your total before deciding."
          }}
        </p>
        <p v-else-if="tutorialStep === 1">
          {{
            isChinese
              ? "规则与策略会影响长期赌场优势；短期连胜或连败不代表趋势。"
              : "Rules and strategy affect the long-run edge; streaks do not prove a trend."
          }}
        </p>
        <p v-else>
          {{
            isChinese
              ? "近失与连输很有情绪张力，但不改变下一局的随机概率。"
              : "Near misses and losses can feel powerful, but do not change the next round’s random odds."
          }}
        </p>
        <button class="drawer-action" @click="advanceTutorial">
          {{
            tutorialStep < 2
              ? isChinese
                ? "下一张学习卡"
                : "NEXT LEARNING CARD"
              : isChinese
                ? "已完成教程"
                : "TUTORIAL COMPLETE"
          }}
        </button>
      </div>
      <section class="guide-section">
        <h3>{{ isChinese ? "怎样获胜 / 失败" : "How you win / lose" }}</h3>
        <ul class="guide-list">
          <li>
            <b class="good">{{ isChinese ? "你赢" : "YOU WIN" }}</b
            ><span>{{
              isChinese
                ? "庄家爆牌，或你的点数比庄家高（都不超过 21）。"
                : "Dealer busts, or your total is higher while both totals are 21 or lower."
            }}</span>
          </li>
          <li>
            <b class="bad">{{ isChinese ? "你输" : "YOU LOSE" }}</b
            ><span>{{
              isChinese
                ? "你超过 21 点爆牌，或庄家的点数更高，或庄家有 Blackjack。"
                : "You exceed 21, the dealer has the higher total, or the dealer has Blackjack."
            }}</span>
          </li>
          <li>
            <b class="neutral">{{ isChinese ? "和局" : "PUSH" }}</b
            ><span>{{
              isChinese
                ? "你和庄家同点数；当前下注会退回。"
                : "You and dealer have the same total; your current wager returns."
            }}</span>
          </li>
        </ul>
      </section>
      <section class="guide-section">
        <h3>{{ isChinese ? "要牌还是停牌？" : "Hit or stand?" }}</h3>
        <div class="mini-rule">
          <b>{{ isChinese ? "小于 17 点" : "Below 17" }}</b
          ><span>{{
            isChinese
              ? "常见基础策略通常要牌；你会有爆牌风险。"
              : "Basic strategy commonly hits; you accept bust risk."
          }}</span>
        </div>
        <div class="mini-rule">
          <b>{{ isChinese ? "17 点及以上" : "17 or more" }}</b
          ><span>{{
            isChinese
              ? "常见基础策略常会停牌，但庄家明牌和软硬牌都会影响最佳选择。"
              : "Basic strategy often stands, but dealer up-card and soft/hard totals matter."
          }}</span>
        </div>
        <div class="mini-rule">
          <b>{{ isChinese ? "大 / 小" : "High / low" }}</b
          ><span>{{
            isChinese
              ? "这里没有大小单双下注；“大”代表更接近 21 的手牌点数，不代表下一张牌更可能大。"
              : "There is no big/small wager here: a high total is closer to 21, not a prediction of the next card."
          }}</span>
        </div>
      </section>
      <div v-if="state.phase === 'settled'" class="result-explanation">
        <span>{{ isChinese ? "本局判定" : "THIS ROUND" }}</span>
        <p>{{ settlementExplanation }}</p>
      </div>
      <div class="odds-list">
        <div>
          <span>{{ isChinese ? "基础策略下赌场优势" : "House edge with basic strategy" }}</span
          ><b>~0.4%</b>
        </div>
        <div>
          <span>{{ isChinese ? "和局概率（近似）" : "Push probability (approx.)" }}</span
          ><b>~8.5%</b>
        </div>
        <div>
          <span>{{ isChinese ? "真实货币" : "Real money" }}</span
          ><b>{{ isChinese ? "从不涉及" : "Never involved" }}</b>
        </div>
      </div>
    </aside>
  </div>
</template>
