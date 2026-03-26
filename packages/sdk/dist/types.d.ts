import { Keypair } from '@solana/web3.js';
export interface DegenCoinFlipOptions {
    /** Solana keypair for signing (CLI/agents — 0 popups) */
    keypair?: Keypair;
    /** Wallet adapter for browser signing (1-2 popups) */
    wallet?: WalletAdapter;
    /** Affiliate ID — earn commissions on every bet from your players */
    affiliateId?: string;
    /** Solana RPC endpoint (default: mainnet) */
    rpcUrl?: string;
    /** Backend API URL (default: api.degencoinflip.com/v2) */
    apiUrl?: string;
    /** Priority fee in SOL (default: auto via Helius) */
    priorityFee?: number;
    /** Max time to wait for flip result in ms (default: 120000) */
    timeout?: number;
    /** Path to JWT cache file, or false to disable (default: ~/.config/dcf/auth.json) */
    authCachePath?: string | false;
    /** Override authority pubkey */
    authority?: string;
}
/** Minimal wallet adapter interface for browser wallets */
export interface WalletAdapter {
    publicKey: {
        toBase58(): string;
        toBuffer(): Buffer;
    };
    signTransaction<T>(tx: T): Promise<T>;
    signAllTransactions<T>(txs: T[]): Promise<T[]>;
    signMessage?(message: Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
}
export interface FlipResult {
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
    flip_id: string;
    explorer: string;
}
export interface DryRunResult {
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
export interface BalanceResult {
    wallet: string;
    balance: number;
    state: 'IDLE' | 'PENDING_REWARD' | 'PENDING_FLIP';
    ready: boolean;
    pending_reward?: number;
    pending_deposit?: number;
    note?: string;
}
export interface HistoryFlip {
    time: string;
    side: string;
    bet: number;
    result: string;
    payout: number;
}
export interface HistorySummary {
    total: number;
    wins: number;
    losses: number;
    net_pnl: number;
    win_rate: string;
}
export interface HistoryResult {
    flips: HistoryFlip[];
    summary: HistorySummary;
}
export interface HistoryOptions {
    limit?: number;
    since?: string;
}
export interface ResumeResult {
    resumed: boolean;
    previous_state?: string;
    result?: string;
    payout?: number;
    claim_tx?: string;
    state?: string;
    message?: string;
}
export interface PlayOptions {
    noClaim?: boolean;
    priorityFee?: number;
    timeout?: number;
}
