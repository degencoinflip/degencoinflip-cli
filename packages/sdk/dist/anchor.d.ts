import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';
/** Set a keypair directly (bypasses file loading) */
export declare function setKeypair(kp: Keypair): void;
/** Set a browser wallet adapter (Phantom, Solflare, etc.) */
export declare function setWalletAdapter(adapter: any): void;
/** Get the active wallet adapter, if one was set */
export declare function getWalletAdapter(): any;
export declare function loadKeypair(keypairPath?: string): Keypair;
export declare function getConnection(rpcUrl?: string): Connection;
export declare function getWallet(keypairPath?: string): any;
export declare function getProvider(keypairPath?: string, rpcUrl?: string): AnchorProvider;
export declare function getProgram(keypairPath?: string, rpcUrl?: string): Program;
export declare function getBalance(keypairPath?: string, rpcUrl?: string): Promise<number>;
export declare function resetClients(): void;
