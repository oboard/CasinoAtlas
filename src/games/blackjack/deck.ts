import type { Card, Rank, Suit } from "./types";

const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export class Shoe {
  private cards: Card[] = [];
  private readonly decks: number;
  constructor(decks = 6) {
    this.decks = decks;
    this.reset();
  }
  reset() {
    this.cards = Array.from({ length: this.decks }, () =>
      suits.flatMap((suit) => ranks.map((rank) => ({ suit, rank }))),
    ).flat();
    this.shuffle();
  }
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j]!, this.cards[i]!];
    }
  }
  draw(): Card {
    if (this.cards.length < 52) this.reset();
    return this.cards.pop()!;
  }
}
