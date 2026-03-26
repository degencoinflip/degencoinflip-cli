import { VersionedTransaction } from '@solana/web3.js';
/**
 * Build an unsigned claim (reveal) transaction.
 * Returns a VersionedTransaction that has NOT been signed or sent.
 */
export declare function buildClaimTransaction(id?: string, amount?: number, side?: string, priorityFee?: number): Promise<VersionedTransaction>;
export declare function claimReward(id?: string, amount?: number, side?: string, priorityFee?: number): Promise<string>;
