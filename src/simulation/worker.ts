export {};
type Request = { runs: number; bet: number };
self.onmessage = (event: MessageEvent<Request>) => {
  const { runs, bet } = event.data;
  let bankroll = 10000;
  let wins = 0;
  const history = [bankroll];
  for (let i = 0; i < runs; i++) {
    const random = Math.random();
    const result = random < 0.422 ? bet : random < 0.507 ? 0 : -bet;
    bankroll += result;
    if (result > 0) wins++;
    if (i % Math.max(1, Math.floor(runs / 30)) === 0) history.push(bankroll);
  }
  self.postMessage({
    runs,
    bankroll,
    net: bankroll - 10000,
    wins,
    losses: runs - wins,
    winRate: wins / runs,
    variance: bet * bet * 0.67,
    history,
  });
};
