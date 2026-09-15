import { defineStore } from "pinia";
export const useCasinoStore = defineStore("casino", {
  state: () => ({
    totalGames: 0,
    totalWager: 0,
    netResult: 0,
    longestSession: 0,
    history: [10000],
    tutorialDone: false,
  }),
  actions: {
    recordRound(wager: number, before: number, after: number) {
      this.totalGames++;
      this.totalWager += wager;
      this.netResult += after - before;
      this.history.push(10000 + this.netResult);
      this.longestSession = Math.max(this.longestSession, this.totalGames);
    },
    completeTutorial() {
      this.tutorialDone = true;
    },
  },
});
