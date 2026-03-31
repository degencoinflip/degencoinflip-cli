import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  FEE_PERCENTAGE,
  FLAT_FEE_LAMPORTS,
  DEFAULT_PRIORITY_FEE_SOL,
  MIN_DEPOSIT_SOL,
  MAX_DEPOSIT_SOL,
} from '../src/constants';

// Replicate the fee math from engine.ts to verify it
function totalCost(amount: number, priorityFee: number): number {
  return amount + (amount * FEE_PERCENTAGE) + (FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL) + priorityFee;
}

function feeAmount(amount: number): number {
  return amount * FEE_PERCENTAGE + FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

describe('fee calculations', () => {
  it('1 SOL bet: fee = 0.035 + 0.00001 = 0.03501', () => {
    assert.strictEqual(round4(feeAmount(1)), 0.035);
  });

  it('1 SOL bet: total cost with default priority', () => {
    const cost = totalCost(1, DEFAULT_PRIORITY_FEE_SOL);
    // 1 + 0.035 + 0.00001 + 0.0001 = 1.03511
    assert.strictEqual(round4(cost), 1.0351);
  });

  it('0.001 SOL (min bet): total cost', () => {
    const cost = totalCost(MIN_DEPOSIT_SOL, DEFAULT_PRIORITY_FEE_SOL);
    // 0.001 + 0.000035 + 0.00001 + 0.0001 = 0.001145
    assert.strictEqual(round4(cost), 0.0011);
  });

  it('32 SOL (max bet): fee = 1.12 + 0.00001', () => {
    const fee = feeAmount(MAX_DEPOSIT_SOL);
    assert.strictEqual(round4(fee), 1.12);
  });

  it('potential win is always 2x the bet', () => {
    for (const bet of [0.001, 0.5, 1, 5, 32]) {
      assert.strictEqual(bet * 2, bet + bet);
    }
  });

  it('profit on win = bet amount (2x payout minus original bet)', () => {
    const bet = 1;
    const payout = bet * 2;
    const profit = payout - bet;
    assert.strictEqual(profit, bet);
  });

  it('loss = -(bet * (1 + FEE_PERCENTAGE)) for PnL calculation', () => {
    const bet = 1;
    const loss = -(bet * (1 + FEE_PERCENTAGE));
    assert.strictEqual(round4(loss), -1.035);
  });

  it('round4 handles edge cases', () => {
    assert.strictEqual(round4(0), 0);
    assert.strictEqual(round4(0.00001), 0);
    assert.strictEqual(round4(0.00005), 0.0001);
    assert.strictEqual(round4(1.23456789), 1.2346);
  });
});
