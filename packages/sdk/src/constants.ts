import { PublicKey } from '@solana/web3.js';

// Program
export const PROGRAM_ID = new PublicKey('BmjJ85zsP2xHPesBKpmHYKt136gzeTtNbeVDcdfybHHT');

// Key accounts
export const INITIALIZER_ID = new PublicKey('h2oMkkgUF55mxMFeuUgVYwvEnpV5kRbvHVuDWMKDYFC');
export const COLD_HOUSE_ID = new PublicKey('i821bbVqQguuDLQp72gNWd52KBXBcEAQc4sVtZxWk4n');
export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Default authority (overridable via DCF_AUTHORITY env var)
export const DEFAULT_AUTHORITY = 'modn84SAs1ccUAmxtmRY85yPz44qixgGrUwi276WYy1';

export function getAuthorityId(): PublicKey {
  return new PublicKey(process.env.DCF_AUTHORITY ?? DEFAULT_AUTHORITY);
}

// PDA seed strings
export const SEEDS = {
  HOUSE_TREASURY: 'house_treasury',
  HOUSE_STATE: 'house_state',
  DEGENERATE: 'degenerate',
  REWARDS: 'rewards',
} as const;

// Fee constants (match on-chain lib.rs)
export const FEE_PERCENTAGE = 0.035;
export const FLAT_FEE_LAMPORTS = 10_000;
export const MIN_DEPOSIT_SOL = 0.001;
export const MAX_DEPOSIT_SOL = 32;

// Priority fee defaults
export const DEFAULT_PRIORITY_FEE_SOL = 0.0001;
export const MAX_MARKET_LAMPORTS = 500_000;
export const PRIORITY_LEVEL = 'VERYHIGH';

// Thresholds
export const IGNOREABLE_AMOUNT_SOL = 0.001;

// API
export const DEFAULT_API_URL = 'https://api.degencoinflip.com/v2';

export function getApiUrl(): string {
  return process.env.DCF_API_URL ?? DEFAULT_API_URL;
}

export function getRpcUrl(): string {
  return process.env.DCF_RPC_URL ?? process.env.REACT_APP_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
}
