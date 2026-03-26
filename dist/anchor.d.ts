import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, VersionedTransaction, Transaction } from '@solana/web3.js';
declare class KeypairWallet implements Wallet {
    readonly payer: Keypair;
    constructor(payer: Keypair);
    get publicKey(): import("@solana/web3.js").PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>;
}
export declare function loadKeypair(keypairPath?: string): Keypair;
export declare function getConnection(rpcUrl?: string): Connection;
export declare function getWallet(keypairPath?: string): KeypairWallet;
export declare function getProvider(keypairPath?: string, rpcUrl?: string): AnchorProvider;
export declare function getProgram(keypairPath?: string, rpcUrl?: string): Program;
export declare function getBalance(keypairPath?: string, rpcUrl?: string): Promise<number>;
export declare function resetClients(): void;
export {};
