import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { setConfig } from '../src/constants';

// We mock global fetch to test the API client without hitting the real backend
describe('API client', () => {
  let origFetch: typeof globalThis.fetch;
  let lastFetchUrl: string;
  let lastFetchOpts: RequestInit;

  beforeEach(() => {
    origFetch = globalThis.fetch;
    setConfig({ apiUrl: 'https://test-api.example.com/v2' });
  });

  afterEach(() => {
    globalThis.fetch = origFetch;
    setConfig({ apiUrl: undefined });
  });

  function mockFetch(status: number, body: unknown) {
    globalThis.fetch = (async (url: any, opts: any) => {
      lastFetchUrl = url.toString();
      lastFetchOpts = opts;
      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }) as any;
  }

  describe('playFlip', () => {
    it('sends POST to /flips/play with camelCase params', async () => {
      mockFetch(200, { payload: { won: true, amount: 1, side: 'H', id: 'test-id' } });

      // Dynamic import to get fresh module with mocked fetch
      const { playFlip } = await import('../src/api');

      const result = await playFlip({
        walletId: 'abc123',
        side: 'H',
        amount: 1,
        depositSignature: 'sig123',
        flipId: 'flip-1',
        affiliateId: 'aff-1',
      });

      assert.strictEqual(lastFetchUrl, 'https://test-api.example.com/v2/flips/play');
      assert.strictEqual(lastFetchOpts.method, 'POST');

      const body = JSON.parse(lastFetchOpts.body as string);
      assert.strictEqual(body.walletId, 'abc123');
      assert.strictEqual(body.side, 'H');
      assert.strictEqual(body.amount, 1);
      assert.strictEqual(body.depositSignature, 'sig123');
      assert.strictEqual(body.flipId, 'flip-1');
      assert.strictEqual(body.affiliateId, 'aff-1');

      // Check headers
      const headers = lastFetchOpts.headers as Record<string, string>;
      assert.strictEqual(headers['Content-Type'], 'application/json');

      // Response extracted from payload
      assert.strictEqual(result.won, true);
      assert.strictEqual(result.id, 'test-id');
    });

    it('throws DcfError on non-ok response', async () => {
      mockFetch(500, 'Internal Server Error');
      const { playFlip } = await import('../src/api');

      await assert.rejects(
        () => playFlip({
          walletId: 'abc',
          side: 'H',
          amount: 1,
          depositSignature: 'sig',
          flipId: 'id',
        }),
        (err: any) => {
          assert.match(err.message, /API call flips\/play failed/);
          return true;
        },
      );
    });

    it('omits affiliateId when not provided', async () => {
      mockFetch(200, { payload: { won: false } });
      const { playFlip } = await import('../src/api');

      await playFlip({
        walletId: 'abc',
        side: 'T',
        amount: 0.5,
        depositSignature: 'sig',
        flipId: 'id',
      });

      const body = JSON.parse(lastFetchOpts.body as string);
      assert.strictEqual(body.affiliateId, undefined);
    });
  });

  describe('getNonce', () => {
    it('sends GET to /wallets/{id}/nonce', async () => {
      mockFetch(200, { payload: { nonce: 'abc123' } });
      const { getNonce } = await import('../src/api');

      const result = await getNonce('wallet123');
      assert.match(lastFetchUrl, /\/wallets\/wallet123\/nonce\?x=gn/);
      assert.strictEqual(result.nonce, 'abc123');
    });

    it('includes referral param when provided', async () => {
      mockFetch(200, { payload: { nonce: 'abc' } });
      const { getNonce } = await import('../src/api');

      await getNonce('wallet123', 'ref456');
      assert.match(lastFetchUrl, /referral=ref456/);
    });
  });

  describe('authorize', () => {
    it('sends POST to /authorize with correct headers', async () => {
      mockFetch(200, {
        data: { payload: { idToken: 'jwt-token', exp: 999, username: 'degen', status: 'ok' } },
      });
      const { authorize } = await import('../src/api');

      const result = await authorize('wallet1', 'base64sig');
      assert.match(lastFetchUrl, /\/authorize$/);
      assert.strictEqual(lastFetchOpts.method, 'POST');

      const headers = lastFetchOpts.headers as Record<string, string>;
      assert.strictEqual(headers['Signature-Encoding'], 'base64');

      const body = JSON.parse(lastFetchOpts.body as string);
      assert.strictEqual(body.walletId, 'wallet1');
      assert.strictEqual(body.signature, 'base64sig');

      assert.strictEqual(result.idToken, 'jwt-token');
    });

    it('throws on auth failure', async () => {
      mockFetch(401, 'Unauthorized');
      const { authorize } = await import('../src/api');

      await assert.rejects(
        () => authorize('wallet1', 'bad-sig'),
        (err: any) => {
          assert.match(err.message, /authentication failed/);
          return true;
        },
      );
    });
  });

  describe('response payload extraction', () => {
    it('handles { payload: ... } format', async () => {
      mockFetch(200, { payload: { foo: 'bar' } });
      const { getCoinFlip } = await import('../src/api');
      const result = await getCoinFlip('token');
      assert.strictEqual(result.foo, 'bar');
    });

    it('handles { data: { payload: ... } } format', async () => {
      mockFetch(200, { data: { payload: { foo: 'bar' } } });
      const { getCoinFlip } = await import('../src/api');
      const result = await getCoinFlip('token');
      assert.strictEqual(result.foo, 'bar');
    });

    it('falls back to raw json', async () => {
      mockFetch(200, { foo: 'bar' });
      const { getCoinFlip } = await import('../src/api');
      const result = await getCoinFlip('token');
      assert.strictEqual(result.foo, 'bar');
    });
  });
});
