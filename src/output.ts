export type Format = 'json' | 'table' | 'compact';

let explicitFormat: Format | null = null;
let quiet = false;
let verbose = false;

export function setFormat(f: Format) { explicitFormat = f; }
export function setQuiet(q: boolean) { quiet = q; }
export function setVerbose(v: boolean) { verbose = v; }
export function isVerbose() { return verbose; }

function shouldUseHuman(): boolean {
  if (quiet) return false;
  if (explicitFormat === 'json' || explicitFormat === 'compact') return false;
  if (explicitFormat === 'table') return true;
  // Default to human. Only use JSON if explicitly piped (isTTY === false)
  if (process.stdout.isTTY === false) return false;
  return true;
}

function getJsonMode(): 'pretty' | 'compact' {
  if (explicitFormat === 'compact' || quiet) return 'compact';
  return 'pretty';
}

// --- Generic output (fallback) ---

export function output(data: Record<string, unknown>) {
  if (shouldUseHuman()) {
    outputKeyValue(data);
  } else {
    outputJson(data);
  }
}

function outputJson(data: Record<string, unknown>) {
  if (getJsonMode() === 'compact') {
    console.log(JSON.stringify(data));
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

function outputKeyValue(data: Record<string, unknown>) {
  const maxKeyLen = Math.max(...Object.keys(data).map(k => k.length));
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'object' && value !== null) continue;
    console.log(`  ${key.padEnd(maxKeyLen)}  ${value}`);
  }
}

// --- Play result ---

export interface PlayOutput {
  result: 'WIN' | 'LOSS';
  side: string;
  bet: number;
  fee: number;
  payout: number;
  profit: number;
  balance_before: number;
  balance_after: number;
  tx: string;
  claim_tx?: string;
  flip_id?: string;
  explorer: string;
}

export function outputPlay(data: PlayOutput) {
  if (shouldUseHuman()) {
    console.log('');
    console.log(`  ${data.result}  →  ${data.balance_after} SOL`);
    console.log('');
  } else {
    outputJson(data as unknown as Record<string, unknown>);
  }
}

// --- Dry run ---

export interface DryRunOutput {
  dry_run: true;
  side: string;
  bet: number;
  fee: number;
  priority_fee: number;
  total_cost: number;
  potential_win: number;
  balance: number;
  can_play: boolean;
}

export function outputDryRun(data: DryRunOutput) {
  if (shouldUseHuman()) {
    console.log('');
    console.log('  Dry run — no SOL spent');
    console.log('');
    console.log(`  Bet         ${data.bet} SOL`);
    console.log(`  Fee         ${data.fee} SOL`);
    console.log(`  Priority    ${data.priority_fee} SOL`);
    console.log(`  Total cost  ${data.total_cost} SOL`);
    console.log(`  If you win  ${data.potential_win} SOL`);
    console.log(`  Balance     ${data.balance} SOL ${data.can_play ? '✓' : '✗ insufficient'}`);
    console.log('');
  } else {
    outputJson(data as unknown as Record<string, unknown>);
  }
}

// --- Resume ---

export interface ResumeOutput {
  resumed: boolean;
  previous_state?: string;
  result?: string;
  payout?: number;
  claim_tx?: string;
  state?: string;
  message?: string;
}

export function outputResume(data: ResumeOutput) {
  if (shouldUseHuman()) {
    if (!data.resumed) {
      console.log('');
      console.log('  No stuck state — ready to play');
      console.log('  dcf play H 1');
      console.log('');
    } else {
      console.log('');
      console.log('  Recovered stuck flip');
      console.log('');
      console.log(`  Previous state  ${data.previous_state}`);
      console.log(`  Result          ${data.result}`);
      if (data.payout) console.log(`  Claimed         ${data.payout} SOL`);
      if (data.claim_tx) console.log(`  Tx              https://solscan.io/tx/${data.claim_tx}`);
      console.log('');
    }
  } else {
    outputJson(data as unknown as Record<string, unknown>);
  }
}

// --- Balance ---

export interface BalanceOutput {
  wallet: string;
  balance: number;
  state: string;
  ready: boolean;
  pending_reward?: number;
  pending_deposit?: number;
  note?: string;
}

export function outputBalance(data: BalanceOutput) {
  if (shouldUseHuman()) {
    const stateLabel = data.state === 'IDLE' ? 'IDLE — ready to play'
      : data.state === 'PENDING_REWARD' ? `PENDING_REWARD — ${data.pending_reward} SOL to claim`
      : `PENDING_FLIP — ${data.pending_deposit} SOL in escrow`;

    console.log('');
    console.log(`  Wallet   ${data.wallet}`);
    console.log(`  Balance  ${data.balance} SOL`);
    console.log(`  State    ${stateLabel}`);
    if (data.note) console.log(`  Hint     ${data.note}`);
    console.log('');
  } else {
    outputJson(data as unknown as Record<string, unknown>);
  }
}

// --- History ---

export interface HistoryOutput {
  flips: Array<{ time: string; side: string; bet: number; result: string; payout: number }>;
  summary: { total: number; wins: number; losses: number; net_pnl: number; win_rate: string };
}

export function outputHistory(data: HistoryOutput) {
  if (shouldUseHuman()) {
    console.log('  TIME       SIDE  BET      RESULT  PAYOUT');
    for (const f of data.flips) {
      const time = f.time.padEnd(9);
      const side = f.side.padEnd(4);
      const bet = String(f.bet).padEnd(7);
      const result = f.result.padEnd(6);
      const payout = String(f.payout);
      console.log(`  ${time}  ${side}  ${bet}  ${result}  ${payout}`);
    }
    const s = data.summary;
    const pnlStr = s.net_pnl >= 0 ? `+${s.net_pnl}` : `${s.net_pnl}`;
    console.log('');
    console.log(`  ${s.total} flips | ${s.wins}W ${s.losses}L | ${pnlStr} SOL | ${s.win_rate}`);
  } else {
    outputJson(data as unknown as Record<string, unknown>);
  }
}

// --- Logging (always stderr) ---

export function log(msg: string) {
  if (!quiet) console.error(msg);
}

export function verboseLog(msg: string) {
  if (verbose && !quiet) console.error(`[verbose] ${msg}`);
}
