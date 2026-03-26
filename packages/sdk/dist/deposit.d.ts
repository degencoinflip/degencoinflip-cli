import { VersionedTransaction } from '@solana/web3.js';
/**
 * Build an unsigned deposit (participate) transaction.
 * Returns a VersionedTransaction that has NOT been signed or sent.
 */
export declare function buildDepositTransaction(id: string, amount: number, side: string, priorityFee?: number): Promise<VersionedTransaction>;
export declare function depositSol(id: string, amount: number, side: string, priorityFee?: number): Promise<string>;
