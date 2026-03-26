import { Keypair } from '@solana/web3.js';
/**
 * Get a valid auth token for the given keypair.
 * Auto-authenticates if no cached token or expired.
 */
export declare function ensureAuth(keypair: Keypair): Promise<string>;
