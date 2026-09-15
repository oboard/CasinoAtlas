<script setup lang="ts">
import { computed, ref } from "vue";
import { Play, Sigma } from "lucide-vue-next";
import { isChinese } from "../i18n";
interface Result {
  runs: number;
  bankroll: number;
  net: number;
  wins: number;
  losses: number;
  winRate: number;
  variance: number;
  history: number[];
}
const runs = ref(1000);
const running = ref(false);
const result = ref<Result>();
function simulate() {
  running.value = true;
  const worker = new Worker(new URL("../simulation/worker.ts", import.meta.url), {
    type: "module",
  });
  worker.onmessage = (event: MessageEvent<Result>) => {
    result.value = event.data;
    running.value = false;
    worker.terminate();
  };
  worker.postMessage({ runs: runs.value, bet: 100 });
}
const path = computed(() => {
  const points = result.value?.history ?? [];
  if (points.length < 2) return "";
  const min = Math.min(...points),
    max = Math.max(...points),
    range = max - min || 1;
  return points
    .map(
      (value, index) =>
        `${index ? "L" : "M"}${(index / (points.length - 1)) * 100},${90 - ((value - min) / range) * 80}`,
    )
    .join(" ");
});
</script>
<template>
  <div class="page-shell learn-page">
    <p class="eyebrow"><Sigma :size="15" /> RANDOMNESS LAB</p>
    <h1>{{ isChinese ? "小样本不是理论概率" : "Small samples are not theory" }}</h1>
    <p class="lede">
      {{
        isChinese
          ? "让 Web Worker 在后台运行纯虚拟 21 点结果。次数越多，观察值通常越接近模型，但永远不会保证某一个短期结果。"
          : "Run virtual Blackjack-style outcomes in a Web Worker. More trials often move observations toward a model—never guaranteeing a short-term result."
      }}
    </p>
    <section class="lab-controls">
      <div>
        <label>{{ isChinese ? "模拟局数" : "Simulation rounds" }}</label>
        <div class="run-options">
          <button
            v-for="n in [10, 100, 1000, 10000, 100000]"
            :key="n"
            :class="{ active: runs === n }"
            @click="runs = n"
          >
            {{ n.toLocaleString() }}
          </button>
        </div>
      </div>
      <button class="button primary" :disabled="running" @click="simulate">
        <Play :size="17" />{{
          running
            ? isChinese
              ? "正在模拟…"
              : "Simulating…"
            : isChinese
              ? "运行模拟"
              : "Run simulation"
        }}
      </button>
    </section>
    <section v-if="result" class="results">
      <div class="chart-card">
        <div class="chart-title">
          <h3>{{ isChinese ? "虚拟筹码曲线" : "Virtual bankroll curve" }}</h3>
          <span>{{ result.runs.toLocaleString() }} {{ isChinese ? "局" : "rounds" }}</span>
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            :d="path"
            fill="none"
            stroke="#5de0c1"
            stroke-width="2.5"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div class="stat-grid">
        <article>
          <span>{{ isChinese ? "最终筹码" : "Final bankroll" }}</span
          ><strong>{{ result.bankroll.toLocaleString() }}</strong>
        </article>
        <article>
          <span>{{ isChinese ? "实际净结果" : "Actual net" }}</span
          ><strong :class="{ negative: result.net < 0 }"
            >{{ result.net > 0 ? "+" : "" }}{{ result.net.toLocaleString() }}</strong
          >
        </article>
        <article>
          <span>{{ isChinese ? "观察胜率" : "Observed win rate" }}</span
          ><strong>{{ (result.winRate * 100).toFixed(1) }}%</strong>
        </article>
        <article>
          <span>{{ isChinese ? "模型方差" : "Model variance" }}</span
          ><strong>{{ result.variance.toLocaleString() }}</strong>
        </article>
      </div>
    </section>
    <article class="education-callout">
      <b>{{ isChinese ? "要点：" : "Takeaway:" }}</b>
      {{
        isChinese
          ? "连续输赢看起来有意义，但独立随机事件不“记得”你的历史。不要把模拟器的结果理解为未来承诺。"
          : "Streaks can feel meaningful, but independent random events do not remember history. Treat a simulation as evidence, never a promise."
      }}
    </article>
  </div>
</template>
