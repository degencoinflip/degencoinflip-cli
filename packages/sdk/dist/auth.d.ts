/**
 * Get a valid auth token.
 * Accepts either a Keypair (CLI/agents) or a WalletAdapter (browser wallets).
 */
export declare function ensureAuth(keypairOrWallet: any): Promise<string>;
