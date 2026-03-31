import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { setVerbose, setQuiet, verboseLog, log } from '../src/logger';

describe('logger', () => {
  let captured: string[];
  let origError: typeof console.error;

  beforeEach(() => {
    captured = [];
    origError = console.error;
    console.error = (...args: any[]) => { captured.push(args.join(' ')); };
    // Reset flags
    setVerbose(false);
    setQuiet(false);
  });

  afterEach(() => {
    console.error = origError;
    setVerbose(false);
    setQuiet(false);
  });

  it('log() outputs to stderr when not quiet', () => {
    log('hello');
    assert.strictEqual(captured.length, 1);
    assert.strictEqual(captured[0], 'hello');
  });

  it('log() is silenced in quiet mode', () => {
    setQuiet(true);
    log('hello');
    assert.strictEqual(captured.length, 0);
  });

  it('verboseLog() is silent by default', () => {
    verboseLog('detail');
    assert.strictEqual(captured.length, 0);
  });

  it('verboseLog() outputs when verbose is on', () => {
    setVerbose(true);
    verboseLog('detail');
    assert.strictEqual(captured.length, 1);
    assert.match(captured[0], /\[verbose\] detail/);
  });

  it('verboseLog() is silenced by quiet even when verbose', () => {
    setVerbose(true);
    setQuiet(true);
    verboseLog('detail');
    assert.strictEqual(captured.length, 0);
  });
});
