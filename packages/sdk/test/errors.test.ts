import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DcfError, Errors } from '../src/errors';

describe('DcfError', () => {
  it('extends Error with name DcfError', () => {
    const err = new DcfError('test message');
    assert(err instanceof Error);
    assert.strictEqual(err.name, 'DcfError');
    assert.strictEqual(err.message, 'test message');
  });

  it('stores hint and exitCode', () => {
    const err = new DcfError('msg', 'try this', 42);
    assert.strictEqual(err.hint, 'try this');
    assert.strictEqual(err.exitCode, 42);
  });

  it('defaults exitCode to 1', () => {
    const err = new DcfError('msg');
    assert.strictEqual(err.exitCode, 1);
  });

  it('format() includes message', () => {
    const err = new DcfError('something broke');
    assert.strictEqual(err.format(), 'error: something broke');
  });

  it('format() includes hint when present', () => {
    const err = new DcfError('something broke', 'fix it');
    assert.strictEqual(err.format(), 'error: something broke\n  fix it');
  });
});

describe('Errors factories', () => {
  it('noKeypair returns DcfError with hint', () => {
    const err = Errors.noKeypair();
    assert(err instanceof DcfError);
    assert.match(err.message, /no keypair found/);
    assert(err.hint!.includes('DCF_KEYPAIR'));
  });

  it('insufficientBalance formats amounts to 4 decimals', () => {
    const err = Errors.insufficientBalance(1.5, 0.5);
    assert.match(err.message, /1\.5000/);
    assert.match(err.message, /0\.5000/);
  });

  it('invalidSide includes the bad side value', () => {
    const err = Errors.invalidSide('X');
    assert.match(err.message, /invalid side "X"/);
    assert.match(err.message, /H.*T/);
  });

  it('invalidAmount includes range', () => {
    const err = Errors.invalidAmount(100, 0.001, 32);
    assert.match(err.message, /100 SOL.*out of range/);
    assert.match(err.hint!, /min 0.001/);
    assert.match(err.hint!, /max 32/);
  });

  it('depositFailed with detail', () => {
    const err = Errors.depositFailed('tx expired');
    assert.match(err.message, /deposit transaction failed.*tx expired/);
  });

  it('depositFailed without detail', () => {
    const err = Errors.depositFailed();
    assert.strictEqual(err.message, 'deposit transaction failed');
  });

  it('claimFailed with and without detail', () => {
    assert.match(Errors.claimFailed('nope').message, /claim transaction failed.*nope/);
    assert.strictEqual(Errors.claimFailed().message, 'claim transaction failed');
  });

  it('timeout includes seconds', () => {
    const err = Errors.timeout(120);
    assert.match(err.message, /timed out after 120s/);
  });

  it('authFailed with detail', () => {
    const err = Errors.authFailed('401 Unauthorized');
    assert.match(err.message, /authentication failed.*401/);
  });

  it('apiFailed includes method and detail', () => {
    const err = Errors.apiFailed('flips/play', '500 Internal');
    assert.match(err.message, /API call flips\/play failed.*500/);
  });

  it('nothingToResume', () => {
    const err = Errors.nothingToResume();
    assert.match(err.message, /nothing to resume/);
  });
});
