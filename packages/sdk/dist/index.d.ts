import type { DegenCoinFlipOptions, FlipResult, DryRunResult, BalanceResult, HistoryResult, HistoryOptions, ResumeResult, PlayOptions } from './types';
export type { DegenCoinFlipOptions, FlipResult, DryRunResult, BalanceResult, HistoryResult, HistoryOptions, ResumeResult, PlayOptions, WalletAdapter, } from './types';
export { DcfError, Errors } from './errors';
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
export declare class DegenCoinFlip {
    private readonly keypair?;
    private readonly _walletAdapter?;
    private readonly affiliateId?;
    constructor(opts: DegenCoinFlipOptions);
    /** Get the wallet public key */
    get walletId(): string;
    /**
     * Play a coin flip.
     * Handles everything: auth, state recovery, deposit, wait, claim.
     */
    play(side: string, amount: number, opts?: PlayOptions): Promise<FlipResult>;
    /**
     * Preview flip costs without playing.
     */
    dryRun(side: string, amount: number, priorityFee?: number): Promise<DryRunResult>;
    /**
     * Check wallet balance and game state.
     */
    balance(): Promise<BalanceResult>;
    /**
     * Get flip history.
     */
    history(opts?: HistoryOptions): Promise<HistoryResult>;
    /**
     * Resume any stuck game state.
     */
    resume(): Promise<ResumeResult | null>;
    /** Set verbose logging */
    setVerbose(v: boolean): void;
    /** Set quiet mode */
    setQuiet(q: boolean): void;
}
