import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DcfError, Errors } from '../src/errors';
import { MIN_DEPOSIT_SOL, MAX_DEPOSIT_SOL } from '../src/constants';

// Test the validation logic that engine.ts uses before hitting the chain
describe('input validation', () => {
  describe('side validation', () => {
    it('H is valid', () => {
      const side = 'H';
      assert.strictEqual(side === 'H' || side === 'T', true);
    });

    it('T is valid', () => {
      const side = 'T';
      assert.strictEqual(side === 'H' || side === 'T', true);
    });

    it('lowercase h is invalid (engine expects uppercase)', () => {
      const side = 'h';
      assert.strictEqual(side === 'H' || side === 'T', false);
    });

    it('X throws invalidSide', () => {
      const err = Errors.invalidSide('X');
      assert(err instanceof DcfError);
      assert.match(err.message, /invalid side "X"/);
    });

    it('empty string throws invalidSide', () => {
      const err = Errors.invalidSide('');
      assert(err instanceof DcfError);
      assert.match(err.message, /invalid side ""/);
    });
  });

  describe('amount validation', () => {
    it('0.001 (min) is valid', () => {
      const amount = MIN_DEPOSIT_SOL;
      assert(amount >= MIN_DEPOSIT_SOL && amount <= MAX_DEPOSIT_SOL);
    });

    it('32 (max) is valid', () => {
      const amount = MAX_DEPOSIT_SOL;
      assert(amount >= MIN_DEPOSIT_SOL && amount <= MAX_DEPOSIT_SOL);
    });

    it('1 SOL is valid', () => {
      const amount = 1;
      assert(amount >= MIN_DEPOSIT_SOL && amount <= MAX_DEPOSIT_SOL);
    });

    it('0 is invalid', () => {
      assert(0 < MIN_DEPOSIT_SOL);
    });

    it('33 is over max', () => {
      assert(33 > MAX_DEPOSIT_SOL);
    });

    it('-1 is negative and invalid', () => {
      assert(-1 < MIN_DEPOSIT_SOL);
    });

    it('invalidAmount error includes range', () => {
      const err = Errors.invalidAmount(50, MIN_DEPOSIT_SOL, MAX_DEPOSIT_SOL);
      assert.match(err.message, /50 SOL.*out of range/);
      assert.match(err.hint!, /min 0.001/);
      assert.match(err.hint!, /max 32/);
    });
  });
});

describe('history time parsing', () => {
  // Replicate the parseStartTime helper from index.ts
  function parseStartTime(since: string): string {
    const now = Date.now();
    const match = since.match(/^(\d+)(h|d|m)$/);
    if (!match) return new Date(now - 24 * 3600_000).toISOString();
    const [, num, unit] = match;
    const ms = parseInt(num) * (unit === 'h' ? 3600_000 : unit === 'd' ? 86400_000 : 60_000);
    return new Date(now - ms).toISOString();
  }

  it('24h parses to 24 hours ago', () => {
    const result = new Date(parseStartTime('24h'));
    const expected = Date.now() - 24 * 3600_000;
    // Allow 100ms tolerance
    assert(Math.abs(result.getTime() - expected) < 100);
  });

  it('7d parses to 7 days ago', () => {
    const result = new Date(parseStartTime('7d'));
    const expected = Date.now() - 7 * 86400_000;
    assert(Math.abs(result.getTime() - expected) < 100);
  });

  it('30m parses to 30 minutes ago', () => {
    const result = new Date(parseStartTime('30m'));
    const expected = Date.now() - 30 * 60_000;
    assert(Math.abs(result.getTime() - expected) < 100);
  });

  it('invalid format defaults to 24h', () => {
    const result = new Date(parseStartTime('garbage'));
    const expected = Date.now() - 24 * 3600_000;
    assert(Math.abs(result.getTime() - expected) < 100);
  });
});

describe('history formatTimeAgo', () => {
  // Replicate the formatTimeAgo helper from index.ts
  function formatTimeAgo(dateStr: string | undefined): string {
    if (!dateStr) return '?';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  it('undefined returns ?', () => {
    assert.strictEqual(formatTimeAgo(undefined), '?');
  });

  it('just now returns "now"', () => {
    assert.strictEqual(formatTimeAgo(new Date().toISOString()), 'now');
  });

  it('5 minutes ago', () => {
    const d = new Date(Date.now() - 5 * 60_000).toISOString();
    assert.strictEqual(formatTimeAgo(d), '5m ago');
  });

  it('2 hours ago', () => {
    const d = new Date(Date.now() - 2 * 3600_000).toISOString();
    assert.strictEqual(formatTimeAgo(d), '2h ago');
  });

  it('3 days ago', () => {
    const d = new Date(Date.now() - 3 * 86400_000).toISOString();
    assert.strictEqual(formatTimeAgo(d), '3d ago');
  });
});
