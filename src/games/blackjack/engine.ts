import { Shoe } from "./deck";
import { handValue, isBlackjack } from "./evaluator";
import type { BlackjackRules, BlackjackState, Hand } from "./types";

const defaultRules: BlackjackRules = { dealerHitsSoft17: false, blackjackPayout: 1.5 };
export class BlackjackEngine {
  private shoe = new Shoe();
  state: BlackjackState;
  constructor(bankroll = 10000, rules = defaultRules) {
    this.state = {
      phase: "betting",
      bankroll,
      dealer: [],
      hands: [],
      activeHand: 0,
      message: "Choose a virtual-chip bet to begin.",
      rules,
    };
  }
  startRound(bet = 100) {
    if (this.state.phase !== "betting" || bet > this.state.bankroll) return;
    const hand: Hand = {
      cards: [this.shoe.draw(), this.shoe.draw()],
      bet,
      stood: false,
      doubled: false,
      outcome: null,
      outcomeReason: null,
    };
    this.state = {
      ...this.state,
      bankroll: this.state.bankroll - bet,
      dealer: [this.shoe.draw(), this.shoe.draw()],
      hands: [hand],
      activeHand: 0,
      phase: "player-turn",
      message: "Your decision: hit, stand, double, or split.",
    };
    if (isBlackjack(hand.cards)) this.settle();
  }
  hit() {
    const hand = this.active();
    if (!hand || this.state.phase !== "player-turn") return;
    hand.cards.push(this.shoe.draw());
    if (handValue(hand.cards).total > 21) {
      hand.stood = true;
      hand.outcome = "lose";
      hand.outcomeReason = "player-bust";
      this.nextHand();
    }
  }
  stand() {
    const hand = this.active();
    if (!hand || this.state.phase !== "player-turn") return;
    hand.stood = true;
    this.nextHand();
  }
  double() {
    const hand = this.active();
    if (!hand || hand.cards.length !== 2 || this.state.bankroll < hand.bet) return;
    this.state.bankroll -= hand.bet;
    hand.bet *= 2;
    hand.doubled = true;
    this.hit();
    if (!hand.stood) {
      hand.stood = true;
      this.nextHand();
    }
  }
  split() {
    const hand = this.active();
    if (
      !hand ||
      hand.cards.length !== 2 ||
      hand.cards[0]!.rank !== hand.cards[1]!.rank ||
      this.state.bankroll < hand.bet
    )
      return;
    this.state.bankroll -= hand.bet;
    const second: Hand = {
      cards: [hand.cards.pop()!, this.shoe.draw()],
      bet: hand.bet,
      stood: false,
      doubled: false,
      outcome: null,
      outcomeReason: null,
    };
    hand.cards.push(this.shoe.draw());
    this.state.hands.splice(this.state.activeHand + 1, 0, second);
    this.state.message = "Play the first split hand.";
  }
  reset() {
    this.state = {
      ...this.state,
      phase: "betting",
      dealer: [],
      hands: [],
      activeHand: 0,
      message: "Choose a virtual-chip bet to begin.",
    };
  }
  private active() {
    return this.state.hands[this.state.activeHand];
  }
  private nextHand() {
    const next = this.state.hands.findIndex((hand) => !hand.stood);
    if (next >= 0) {
      this.state.activeHand = next;
      return;
    }
    this.settle();
  }
  private settle() {
    this.state.phase = "dealer-turn";
    const dealerScore = handValue(this.state.dealer);
    while (
      dealerScore.total < 17 ||
      (dealerScore.total === 17 && dealerScore.soft && this.state.rules.dealerHitsSoft17)
    ) {
      this.state.dealer.push(this.shoe.draw());
      Object.assign(dealerScore, handValue(this.state.dealer));
    }
    const dealer = handValue(this.state.dealer).total;
    const dealerHasBlackjack = isBlackjack(this.state.dealer);
    for (const hand of this.state.hands) {
      const score = handValue(hand.cards).total;
      if (hand.outcome === "lose" || score > 21) {
        hand.outcome = "lose";
        hand.outcomeReason = "player-bust";
      } else if (dealerHasBlackjack && !isBlackjack(hand.cards)) {
        hand.outcome = "lose";
        hand.outcomeReason = "dealer-blackjack";
      } else if (isBlackjack(hand.cards) && !dealerHasBlackjack) {
        hand.outcome = "blackjack";
        hand.outcomeReason = "player-blackjack";
        this.state.bankroll += hand.bet * (1 + this.state.rules.blackjackPayout);
      } else if (dealer > 21) {
        hand.outcome = "win";
        hand.outcomeReason = "dealer-bust";
        this.state.bankroll += hand.bet * 2;
      } else if (score > dealer) {
        hand.outcome = "win";
        hand.outcomeReason = "higher-total";
        this.state.bankroll += hand.bet * 2;
      } else if (score === dealer) {
        hand.outcome = "push";
        hand.outcomeReason = "same-total";
        this.state.bankroll += hand.bet;
      } else {
        hand.outcome = "lose";
        hand.outcomeReason = "lower-total";
      }
    }
    const outcomes = this.state.hands.map((hand) => hand.outcome);
    this.state.phase = "settled";
    this.state.message = outcomes.includes("blackjack")
      ? "Blackjack! 3:2 payout."
      : outcomes.includes("win")
        ? "You win — take a moment to review the odds."
        : outcomes.includes("push")
          ? "Push — your virtual chips are returned."
          : "Dealer wins this round. Each round remains independent.";
  }
}
