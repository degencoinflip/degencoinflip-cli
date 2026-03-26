import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { play, dryRun, resume } from './engine';
import { detectState } from './resume';
import { getBalance, getConnection, getWallet, getProvider, getProgram, loadKeypair, resetClients, setKeypair, setWalletAdapter, getWalletAdapter } from './anchor';
import { ensureAuth } from './auth';
import { findDegenerateAccount, findRewardsAccount } from './pda';
import { IGNOREABLE_AMOUNT_SOL, FEE_PERCENTAGE, getApiUrl, getRpcUrl } from './constants';
import { setVerbose, setQuiet } from './logger';
import type {
  DegenCoinFlipOptions,
  FlipResult,
  DryRunResult,
  BalanceResult,
  HistoryResult,
  HistoryOptions,
  ResumeResult,
  PlayOptions,
  WalletAdapter,
} from './types';

// Re-export all types
export type {
  DegenCoinFlipOptions,
  FlipResult,
  DryRunResult,
  BalanceResult,
  HistoryResult,
  HistoryOptions,
  ResumeResult,
  PlayOptions,
  WalletAdapter,
} from './types';

// Re-export error class
export { DcfError, Errors } from './errors';

// Re-export utilities for advanced usage
export { loadKeypair, setKeypair, setWalletAdapter, getWalletAdapter, getConnection, getWallet, getProvider, getProgram, resetClients } from './anchor';
export { MIN_DEPOSIT_SOL, MAX_DEPOSIT_SOL, FEE_PERCENTAGE, PROGRAM_ID, INITIALIZER_ID, COLD_HOUSE_ID } from './constants';
export { findHouseTreasury, findHouseState, findDegenerateAccount, findRewardsAccount } from './pda';

/**
 * Degen Coin Flip SDK.
 *
 * ```typescript
 * const dcf = new DegenCoinFlip({ keypair });
 * const result = await dcf.play('H', 1.0);
 * ```
 */
export class DegenCoinFlip {
  private readonly keypair?: Keypair;
  private readonly _walletAdapter?: any;
  private readonly affiliateId?: string;

  constructor(opts: DegenCoinFlipOptions) {
    // Set env vars from options (consumed by anchor.ts, constants.ts)
    if (opts.rpcUrl) process.env.DCF_RPC_URL = opts.rpcUrl;
    if (opts.apiUrl) process.env.DCF_API_URL = opts.apiUrl;
    if (opts.authority) process.env.DCF_AUTHORITY = opts.authority;

    // Reset cached clients first
    resetClients();

    // Load keypair or wallet adapter
    if (opts.keypair) {
      this.keypair = opts.keypair;
      setKeypair(this.keypair);
    } else if (opts.wallet) {
      // Browser wallet adapter
      setWalletAdapter(opts.wallet);
      (this as any)._walletAdapter = opts.wallet;
    } else {
      this.keypair = loadKeypair();
      setKeypair(this.keypair);
    }

    this.affiliateId = opts.affiliateId;
  }

  /** Get the wallet public key */
  get walletId(): string {
    if (this._walletAdapter) {
      const pk = this._walletAdapter.publicKey;
      return typeof pk === 'string' ? pk : pk.toBase58();
    }
    return this.keypair!.publicKey.toBase58();
  }

  /**
   * Play a coin flip.
   * Handles everything: auth, state recovery, deposit, wait, claim.
   */
  async play(side: string, amount: number, opts?: PlayOptions): Promise<FlipResult> {
    return play(side, amount, {
      noClaim: opts?.noClaim,
      priorityFee: opts?.priorityFee,
      timeout: opts?.timeout,
    });
  }

  /**
   * Preview flip costs without playing.
   */
  async dryRun(side: string, amount: number, priorityFee?: number): Promise<DryRunResult> {
    return dryRun(side, amount, priorityFee);
  }

  /**
   * Check wallet balance and game state.
   */
  async balance(): Promise<BalanceResult> {
    const connection = getConnection();
    const wallet = getWallet();
    const player = wallet.publicKey;

    const [rewardsPda] = await findRewardsAccount(player);
    const [degeneratePda] = await findDegenerateAccount(player);

    const [balanceLamports, rewardsLamports, degenerateLamports] = await Promise.all([
      connection.getBalance(player, 'processed'),
      connection.getBalance(rewardsPda, 'processed'),
      connection.getBalance(degeneratePda, 'processed'),
    ]);

    const round4 = (n: number) => Math.round(n * 10000) / 10000;
    const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
    const rewardsSol = rewardsLamports / LAMPORTS_PER_SOL;
    const depositSol = degenerateLamports / LAMPORTS_PER_SOL;

    const hasPendingReward = rewardsSol >= IGNOREABLE_AMOUNT_SOL;
    const hasPendingFlip = depositSol >= IGNOREABLE_AMOUNT_SOL;

    const state = hasPendingReward ? 'PENDING_REWARD' as const
      : hasPendingFlip ? 'PENDING_FLIP' as const
      : 'IDLE' as const;

    const result: BalanceResult = {
      wallet: player.toBase58(),
      balance: round4(balanceSol),
      state,
      ready: !hasPendingFlip,
    };

    if (hasPendingReward) {
      result.pending_reward = round4(rewardsSol);
      result.note = 'Run dcf.play() to auto-claim, or dcf.resume() to claim only';
    }
    if (hasPendingFlip) {
      result.pending_deposit = round4(depositSol);
      result.note = 'Flip in progress — will auto-resolve on next play()';
    }

    return result;
  }

  /**
   * Get flip history.
   */
  async history(opts?: HistoryOptions): Promise<HistoryResult> {
    const limit = opts?.limit ?? 10;
    const since = opts?.since ?? '24h';
    const token = await ensureAuth(this._walletAdapter || this.keypair!);
    const walletId = this.walletId;

    const startTime = parseStartTime(since);
    const endTime = new Date().toISOString();
    const url = `${getApiUrl()}/coinFlips/walletHistory?walletId=${walletId}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;

    const res = await fetch(url, { headers: { Authorization: token } });
    if (!res.ok) throw new Error(`History API failed: ${res.status}`);

    const json = await res.json();
    const flips = json?.payload ?? json?.data?.payload ?? json ?? [];
    const flipArray = Array.isArray(flips) ? flips : [];

    const formatted = flipArray.slice(0, limit).map((f: any) => ({
      time: formatTimeAgo(f.createdAt || f.created_at),
      side: f.side ?? '?',
      bet: f.amount ?? 0,
      result: f.won ? 'WIN' : 'LOSS',
      payout: f.won ? (f.amount ?? 0) * 2 : 0,
    }));

    const wins = formatted.filter(f => f.result === 'WIN').length;
    const losses = formatted.length - wins;
    const netPnl = formatted.reduce((sum, f) => {
      return sum + (f.result === 'WIN' ? f.bet : -(f.bet * (1 + FEE_PERCENTAGE)));
    }, 0);

    return {
      flips: formatted,
      summary: {
        total: formatted.length,
        wins,
        losses,
        net_pnl: Math.round(netPnl * 1000) / 1000,
        win_rate: formatted.length > 0 ? `${Math.round((wins / formatted.length) * 100)}%` : '0%',
      },
    };
  }

  /**
   * Resume any stuck game state.
   */
  async resume(): Promise<ResumeResult | null> {
    return resume();
  }

  /** Set verbose logging */
  setVerbose(v: boolean) { setVerbose(v); }

  /** Set quiet mode */
  setQuiet(q: boolean) { setQuiet(q); }
}

// --- Helpers ---

function parseStartTime(since: string): string {
  const now = Date.now();
  const match = since.match(/^(\d+)(h|d|m)$/);
  if (!match) return new Date(now - 24 * 3600_000).toISOString();
  const [, num, unit] = match;
  const ms = parseInt(num) * (unit === 'h' ? 3600_000 : unit === 'd' ? 86400_000 : 60_000);
  return new Date(now - ms).toISOString();
}

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '?';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
