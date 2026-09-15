import type { Card } from "./types";

export function handValue(cards: Card[]) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      total += 11;
      aces++;
    } else total += ["K", "Q", "J"].includes(card.rank) ? 10 : Number(card.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 };
}
export const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards).total === 21;
