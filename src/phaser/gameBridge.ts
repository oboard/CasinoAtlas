import type { BlackjackState } from "../games/blackjack/types";

export type BlackjackCommand =
  | { type: "chip:add"; value: number }
  | { type: "bet:clear" }
  | { type: "deal" }
  | { type: "hit" }
  | { type: "stand" }
  | { type: "double" }
  | { type: "split" }
  | { type: "next" };

export type BlackjackSceneEvent =
  | { type: "action"; action: BlackjackCommand }
  | { type: "balance"; balance: number }
  | { type: "torso"; back: true }
  | { type: "state"; state: BlackjackState };
