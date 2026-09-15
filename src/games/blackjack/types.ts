export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export interface Card {
  suit: Suit;
  rank: Rank;
}
export type RoundPhase = "betting" | "player-turn" | "dealer-turn" | "settled";
export type Outcome = "win" | "lose" | "push" | "blackjack" | null;
export type OutcomeReason =
  | "player-bust"
  | "dealer-bust"
  | "higher-total"
  | "lower-total"
  | "same-total"
  | "player-blackjack"
  | "dealer-blackjack"
  | null;
export interface Hand {
  cards: Card[];
  bet: number;
  stood: boolean;
  doubled: boolean;
  outcome: Outcome;
  outcomeReason: OutcomeReason;
}
export interface BlackjackRules {
  dealerHitsSoft17: boolean;
  blackjackPayout: number;
}
export interface BlackjackState {
  phase: RoundPhase;
  bankroll: number;
  dealer: Card[];
  hands: Hand[];
  activeHand: number;
  message: string;
  rules: BlackjackRules;
}
