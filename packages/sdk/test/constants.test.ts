import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  PROGRAM_ID,
  INITIALIZER_ID,
  COLD_HOUSE_ID,
  FEE_PERCENTAGE,
  FLAT_FEE_LAMPORTS,
  MIN_DEPOSIT_SOL,
  MAX_DEPOSIT_SOL,
  DEFAULT_PRIORITY_FEE_SOL,
  MAX_MARKET_LAMPORTS,
  IGNOREABLE_AMOUNT_SOL,
  DEFAULT_API_URL,
  SEEDS,
  setConfig,
  getApiUrl,
  getRpcUrl,
  getAuthorityId,
  DEFAULT_AUTHORITY,
} from '../src/constants';

describe('constants', () => {
  it('PROGRAM_ID is the correct mainnet program', () => {
    assert.strictEqual(PROGRAM_ID.toBase58(), 'BmjJ85zsP2xHPesBKpmHYKt136gzeTtNbeVDcdfybHHT');
  });

  it('INITIALIZER_ID is set', () => {
    assert.strictEqual(INITIALIZER_ID.toBase58(), 'h2oMkkgUF55mxMFeuUgVYwvEnpV5kRbvHVuDWMKDYFC');
  });

  it('COLD_HOUSE_ID is set', () => {
    assert.strictEqual(COLD_HOUSE_ID.toBase58(), 'i821bbVqQguuDLQp72gNWd52KBXBcEAQc4sVtZxWk4n');
  });

  it('fee is 3.5%', () => {
    assert.strictEqual(FEE_PERCENTAGE, 0.035);
  });

  it('flat fee is 10000 lamports (0.00001 SOL)', () => {
    assert.strictEqual(FLAT_FEE_LAMPORTS, 10_000);
  });

  it('deposit range is 0.001 to 32 SOL', () => {
    assert.strictEqual(MIN_DEPOSIT_SOL, 0.001);
    assert.strictEqual(MAX_DEPOSIT_SOL, 32);
  });

  it('default priority fee is 0.0001 SOL', () => {
    assert.strictEqual(DEFAULT_PRIORITY_FEE_SOL, 0.0001);
  });

  it('max market lamports is 500k', () => {
    assert.strictEqual(MAX_MARKET_LAMPORTS, 500_000);
  });

  it('ignoreable amount is 0.001 SOL', () => {
    assert.strictEqual(IGNOREABLE_AMOUNT_SOL, 0.001);
  });

  it('default API URL points to production v2', () => {
    assert.strictEqual(DEFAULT_API_URL, 'https://api.degencoinflip.com/v2');
  });

  it('SEEDS has correct values', () => {
    assert.strictEqual(SEEDS.HOUSE_TREASURY, 'house_treasury');
    assert.strictEqual(SEEDS.HOUSE_STATE, 'house_state');
    assert.strictEqual(SEEDS.DEGENERATE, 'degenerate');
    assert.strictEqual(SEEDS.REWARDS, 'rewards');
  });
});

describe('config functions', () => {
  beforeEach(() => {
    // Reset config to defaults
    setConfig({ apiUrl: undefined, rpcUrl: undefined, authority: undefined });
  });

  it('getApiUrl returns default when not configured', () => {
    assert.strictEqual(getApiUrl(), DEFAULT_API_URL);
  });

  it('getApiUrl returns custom URL after setConfig', () => {
    setConfig({ apiUrl: 'https://custom.api.com' });
    assert.strictEqual(getApiUrl(), 'https://custom.api.com');
  });

  it('getRpcUrl returns mainnet default when not configured', () => {
    // Clear env to test default
    const orig = process.env.DCF_RPC_URL;
    delete process.env.DCF_RPC_URL;
    assert.strictEqual(getRpcUrl(), 'https://api.mainnet-beta.solana.com');
    if (orig) process.env.DCF_RPC_URL = orig;
  });

  it('getRpcUrl returns custom URL after setConfig', () => {
    setConfig({ rpcUrl: 'https://my-rpc.com' });
    assert.strictEqual(getRpcUrl(), 'https://my-rpc.com');
  });

  it('getAuthorityId returns default authority when not configured', () => {
    assert.strictEqual(getAuthorityId().toBase58(), DEFAULT_AUTHORITY);
  });

  it('getAuthorityId returns custom authority after setConfig', () => {
    // Use a valid base58 pubkey
    setConfig({ authority: INITIALIZER_ID.toBase58() });
    assert.strictEqual(getAuthorityId().toBase58(), INITIALIZER_ID.toBase58());
  });

  it('setConfig overrides only provided fields', () => {
    setConfig({ apiUrl: 'https://a.com' });
    assert.strictEqual(getApiUrl(), 'https://a.com');
    // rpcUrl should still be default
    const orig = process.env.DCF_RPC_URL;
    delete process.env.DCF_RPC_URL;
    assert.strictEqual(getRpcUrl(), 'https://api.mainnet-beta.solana.com');
    if (orig) process.env.DCF_RPC_URL = orig;
  });
});
