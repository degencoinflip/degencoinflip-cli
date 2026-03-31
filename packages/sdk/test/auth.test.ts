import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { Keypair } from '@solana/web3.js';
import { setConfig } from '../src/constants';

describe('auth', () => {
  let origFetch: typeof globalThis.fetch;
  let fetchCalls: Array<{ url: string; opts: RequestInit }>;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    fetchCalls = [];
    setConfig({ apiUrl: 'https://test-api.example.com/v2' });
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    setConfig({ apiUrl: undefined });
  });

  function mockFetchSequence(responses: Array<{ status: number; body: unknown }>) {
    let callIndex = 0;
    globalThis.fetch = (async (url: any, opts: any) => {
      fetchCalls.push({ url: url.toString(), opts });
      const resp = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;
      return {
        ok: resp.status >= 200 && resp.status < 300,
        status: resp.status,
        json: async () => resp.body,
        text: async () => JSON.stringify(resp.body),
      };
    }) as any;
  }

  it('ensureAuth with keypair: gets nonce, signs with nacl, authorizes', async () => {
    const keypair = Keypair.generate();

    mockFetchSequence([
      // getNonce response
      { status: 200, body: { payload: { nonce: 'test-nonce-123' } } },
      // authorize response
      {
        status: 200,
        body: {
          data: {
            payload: {
              idToken: 'jwt-test-token',
              exp: Math.floor(Date.now() / 1000) + 3600,
              username: 'testuser',
              status: 'ok',
            },
          },
        },
      },
    ]);

    const { ensureAuth } = await import('../src/auth');
    const token = await ensureAuth(keypair);

    assert.strictEqual(token, 'jwt-test-token');

    // First call should be getNonce
    assert.match(fetchCalls[0].url, /\/wallets\/.*\/nonce/);

    // Second call should be authorize
    assert.match(fetchCalls[1].url, /\/authorize/);
    const authBody = JSON.parse(fetchCalls[1].opts.body as string);
    assert.strictEqual(authBody.walletId, keypair.publicKey.toBase58());
    // Signature should be base64 encoded
    assert(authBody.signature.length > 0);
  });

  it('ensureAuth with wallet adapter: calls signMessage', async () => {
    const fakePublicKey = Keypair.generate().publicKey;
    let signMessageCalled = false;

    const mockWallet = {
      publicKey: fakePublicKey,
      signMessage: async (message: Uint8Array) => {
        signMessageCalled = true;
        // Return a fake 64-byte signature
        return { signature: new Uint8Array(64).fill(1) };
      },
      signTransaction: async <T>(tx: T) => tx,
      signAllTransactions: async <T>(txs: T[]) => txs,
    };

    mockFetchSequence([
      { status: 200, body: { payload: { nonce: 'nonce-456' } } },
      {
        status: 200,
        body: {
          data: {
            payload: {
              idToken: 'jwt-wallet-token',
              exp: Math.floor(Date.now() / 1000) + 3600,
              username: 'walletuser',
              status: 'ok',
            },
          },
        },
      },
    ]);

    const { ensureAuth } = await import('../src/auth');
    const token = await ensureAuth(mockWallet);

    assert.strictEqual(token, 'jwt-wallet-token');
    assert.strictEqual(signMessageCalled, true);
  });

  it('throws when wallet has no signMessage', async () => {
    const mockWallet = {
      publicKey: Keypair.generate().publicKey,
      signTransaction: async <T>(tx: T) => tx,
      signAllTransactions: async <T>(txs: T[]) => txs,
      // no signMessage, no secretKey
    };

    mockFetchSequence([
      { status: 200, body: { payload: { nonce: 'nonce-789' } } },
    ]);

    const { ensureAuth } = await import('../src/auth');

    await assert.rejects(
      () => ensureAuth(mockWallet),
      (err: any) => {
        assert.match(err.message, /signMessage/);
        return true;
      },
    );
  });
});
