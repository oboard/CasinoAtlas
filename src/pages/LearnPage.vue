<script setup lang="ts">
import { Brain, Eye, Gauge, Shuffle } from "lucide-vue-next";
import { isChinese } from "../i18n";
const topics = [
  {
    icon: Shuffle,
    zh: "随机性误解",
    en: "Randomness misunderstandings",
    zhText: "短期波动并不等于规律；每一次独立结果都不需要“补偿”过去。",
    enText:
      "Short-term variation is not a pattern; independent outcomes do not need to compensate for the past.",
  },
  {
    icon: Brain,
    zh: "赌徒谬误",
    en: "Gambler's fallacy",
    zhText: "连续出现同一结果，不会让相反结果在下一次“更该出现”。",
    enText: "A streak does not make the opposite outcome 'due' on the next trial.",
  },
  {
    icon: Eye,
    zh: "近失效应",
    en: "Near misses",
    zhText: "看起来只差一点，是视觉体验，不会提高下一次的数学概率。",
    enText: "Looking close is a visual experience, not a higher mathematical chance next time.",
  },
  {
    icon: Gauge,
    zh: "损失追逐",
    en: "Loss chasing",
    zhText: "继续投入不会让已失去的虚拟筹码更容易回来；暂停和复盘是更好的选择。",
    enText:
      "Continuing does not make lost virtual chips easier to recover; pause and review instead.",
  },
];
</script>
<template>
  <div class="page-shell learn-page">
    <p class="eyebrow">LEARNING HALL · RESPONSIBLE PLAY</p>
    <h1>
      {{ isChinese ? "读懂游戏，也读懂自己的判断。" : "Learn the game—and your own judgments." }}
    </h1>
    <p class="lede">
      {{
        isChinese
          ? "Casino Atlas 以教育为先：规则、概率、认知偏差与理性决策。所有内容只使用虚拟筹码。"
          : "Casino Atlas puts learning first: rules, odds, cognitive biases, and thoughtful choices. Every activity uses virtual chips only."
      }}
    </p>
    <div class="topic-grid">
      <article v-for="topic in topics" :key="topic.en" class="topic-card">
        <component :is="topic.icon" :size="25" />
        <h2>{{ isChinese ? topic.zh : topic.en }}</h2>
        <p>{{ isChinese ? topic.zhText : topic.enText }}</p>
      </article>
    </div>
    <section class="learn-banner">
      <div>
        <p class="eyebrow">HANDS-ON EXPERIMENT</p>
        <h2>{{ isChinese ? "用数据观察随机性" : "See randomness through data" }}</h2>
        <p>
          {{
            isChinese
              ? "运行不同样本量的后台模拟，对比实际结果与理论模型。"
              : "Run background simulations at different sample sizes and compare observed results with the model."
          }}
        </p>
      </div>
      <RouterLink to="/learn/randomness" class="button primary">{{
        isChinese ? "打开随机实验室" : "Open Randomness Lab"
      }}</RouterLink>
    </section>
  </div>
</template>
