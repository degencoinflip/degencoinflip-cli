import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PublicKey } from '@solana/web3.js';
import { findHouseTreasury, findHouseState, findDegenerateAccount, findRewardsAccount } from '../src/pda';
import { setConfig } from '../src/constants';

// Use default authority for deterministic results
beforeEach(() => {
  setConfig({ authority: undefined });
});

describe('PDA derivation', () => {
  const player = new PublicKey('11111111111111111111111111111112');

  it('findHouseTreasury returns a valid PublicKey and bump', async () => {
    const [pda, bump] = await findHouseTreasury();
    assert(pda instanceof PublicKey);
    assert(typeof bump === 'number');
    assert(bump >= 0 && bump <= 255);
  });

  it('findHouseTreasury is deterministic', async () => {
    const [pda1] = await findHouseTreasury();
    const [pda2] = await findHouseTreasury();
    assert.strictEqual(pda1.toBase58(), pda2.toBase58());
  });

  it('findHouseState returns a different address than findHouseTreasury', async () => {
    const [treasury] = await findHouseTreasury();
    const [state] = await findHouseState();
    assert.notStrictEqual(treasury.toBase58(), state.toBase58());
  });

  it('findDegenerateAccount is deterministic for same player', async () => {
    const [pda1] = await findDegenerateAccount(player);
    const [pda2] = await findDegenerateAccount(player);
    assert.strictEqual(pda1.toBase58(), pda2.toBase58());
  });

  it('findDegenerateAccount differs for different players', async () => {
    const player2 = new PublicKey('11111111111111111111111111111113');
    const [pda1] = await findDegenerateAccount(player);
    const [pda2] = await findDegenerateAccount(player2);
    assert.notStrictEqual(pda1.toBase58(), pda2.toBase58());
  });

  it('findRewardsAccount is deterministic for same player', async () => {
    const [pda1] = await findRewardsAccount(player);
    const [pda2] = await findRewardsAccount(player);
    assert.strictEqual(pda1.toBase58(), pda2.toBase58());
  });

  it('findRewardsAccount differs from findDegenerateAccount', async () => {
    const [rewards] = await findRewardsAccount(player);
    const [degenerate] = await findDegenerateAccount(player);
    assert.notStrictEqual(rewards.toBase58(), degenerate.toBase58());
  });
});
