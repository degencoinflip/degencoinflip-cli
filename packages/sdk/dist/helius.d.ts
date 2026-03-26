import { VersionedTransaction } from '@solana/web3.js';
export declare function getPriorityFeeEstimate(transaction: VersionedTransaction, priorityLevel?: string): Promise<number>;
