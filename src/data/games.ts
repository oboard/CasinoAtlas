export type Locale = "zh-CN" | "en-US";
export interface GameDefinition {
  id: string;
  icon: string;
  category: "card" | "table" | "asian" | "slots";
  popularity: number;
  featured: boolean;
  status: "playable" | "soon";
  aliases: string[];
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  houseEdge: string;
}
const localized = (zh: string, en: string) => ({ "zh-CN": zh, "en-US": en });
export const games: GameDefinition[] = [
  {
    id: "slots",
    icon: "✦",
    category: "slots",
    popularity: 100,
    featured: true,
    status: "soon",
    aliases: ["lucky 7", "老虎机", "slot"],
    name: localized("幸运转轴", "Lucky Reels"),
    description: localized(
      "虚构转轴机器与随机性观察。",
      "Fictional reels for observing randomness.",
    ),
    houseEdge: "Varies",
  },
  {
    id: "baccarat",
    icon: "◈",
    category: "card",
    popularity: 98,
    featured: true,
    status: "soon",
    aliases: ["百家乐", "บาคาร่า"],
    name: localized("百家乐", "Baccarat"),
    description: localized(
      "比较庄、闲与和局的经典游戏。",
      "Compare banker, player, and tie outcomes.",
    ),
    houseEdge: "1.06%",
  },
  {
    id: "blackjack",
    icon: "♠",
    category: "card",
    popularity: 96,
    featured: true,
    status: "playable",
    aliases: ["21", "21点", "二十一点"],
    name: localized("21点", "Blackjack"),
    description: localized(
      "用策略、规则和概率认识经典纸牌游戏。",
      "Learn a classic card game through strategy and odds.",
    ),
    houseEdge: "0.4–2%",
  },
  {
    id: "roulette",
    icon: "◎",
    category: "table",
    popularity: 93,
    featured: true,
    status: "soon",
    aliases: ["轮盘", "欧洲轮盘"],
    name: localized("欧洲轮盘", "European Roulette"),
    description: localized("37 个结果与单零规则。", "37 outcomes with a single-zero rule."),
    houseEdge: "2.70%",
  },
  {
    id: "sicbo",
    icon: "⚄",
    category: "asian",
    popularity: 91,
    featured: true,
    status: "soon",
    aliases: ["骰宝", "大小", "sic bo"],
    name: localized("骰宝 / 大小", "Sic Bo"),
    description: localized(
      "三个骰子的亚洲经典桌面玩法。",
      "An Asian classic built around three dice.",
    ),
    houseEdge: "2.78%",
  },
  {
    id: "mahjong",
    icon: "▤",
    category: "asian",
    popularity: 89,
    featured: true,
    status: "soon",
    aliases: ["麻将"],
    name: localized("麻将", "Mahjong"),
    description: localized("牌型、记忆与文化脉络。", "Hands, memory, and cultural context."),
    houseEdge: "—",
  },
  {
    id: "holdem",
    icon: "♥",
    category: "card",
    popularity: 87,
    featured: true,
    status: "soon",
    aliases: ["德州扑克", "texas"],
    name: localized("德州扑克", "Texas Hold'em"),
    description: localized(
      "公共牌与位置策略入门。",
      "An introduction to community cards and position.",
    ),
    houseEdge: "—",
  },
  {
    id: "craps",
    icon: "⚂",
    category: "table",
    popularity: 84,
    featured: true,
    status: "soon",
    aliases: ["骰子", "craps"],
    name: localized("花旗骰", "Craps"),
    description: localized("多种下注与骰子概率。", "Many bets and dice probabilities."),
    houseEdge: "1.41%",
  },
  {
    id: "dragon-tiger",
    icon: "♣",
    category: "asian",
    popularity: 80,
    featured: false,
    status: "soon",
    aliases: ["龙虎"],
    name: localized("龙虎", "Dragon Tiger"),
    description: localized("比较单张牌的点数。", "Compare the value of single cards."),
    houseEdge: "3.73%",
  },
  {
    id: "keno",
    icon: "○",
    category: "table",
    popularity: 72,
    featured: false,
    status: "soon",
    aliases: ["基诺"],
    name: localized("基诺", "Keno"),
    description: localized("抽取数字的概率实验。", "A probability experiment with drawn numbers."),
    houseEdge: "Varies",
  },
];
export const categories = {
  all: localized("全部玩法", "All games"),
  slots: localized("转轴游戏", "Slot games"),
  card: localized("纸牌游戏", "Card games"),
  table: localized("桌面游戏", "Table games"),
  asian: localized("亚洲经典", "Asian classics"),
};
