export function truncateAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function formatSol(amount: number, decimals = 4): string {
  return amount.toFixed(decimals);
}

export function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}
