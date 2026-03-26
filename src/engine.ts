import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getBalance, getWallet, getConnection } from './anchor';
import { ensureAuth } from './auth';
import { detectState } from './resume';
import { depositSol } from './deposit';
import { claimReward } from './claim';
import { createCoinFlip, processCoinFlipWithMemo, getCoinFlip } from './api';
import { findRewardsAccount } from './pda';
import { FEE_PERCENTAGE, FLAT_FEE_LAMPORTS, DEFAULT_PRIORITY_FEE_SOL } from './constants';
import { Errors } from './errors';
import { log, verboseLog } from './output';
import type { PlayOutput, DryRunOutput, ResumeOutput } from './output';

function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}


function totalCost(amount: number, priorityFee: number): number {
  return amount + (amount * FEE_PERCENTAGE) + (FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL) + priorityFee;
}

export async function dryRun(side: string, amount: number, priorityFee: number = DEFAULT_PRIORITY_FEE_SOL): Promise<DryRunOutput> {
  const balance = await getBalance();
  const fee = amount * FEE_PERCENTAGE + FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL;
  const cost = totalCost(amount, priorityFee);

  return {
    dry_run: true,
    side,
    bet: amount,
    fee: round4(fee),
    priority_fee: priorityFee,
    total_cost: round4(cost),
    potential_win: amount * 2,
    balance: round4(balance),
    can_play: balance >= cost,
  };
}

export async function resume(): Promise<ResumeOutput | null> {
  const state = await detectState();

  if (state.state === 'IDLE') return null;

  if (state.state === 'PENDING_REWARD') {
    log(`Claiming pending reward of ${state.rewardSol.toFixed(4)} SOL...`);
    const claimTx = await claimReward();
    return {
      resumed: true,
      previous_state: 'PENDING_REWARD',
      result: 'WIN',
      payout: state.rewardSol,
      claim_tx: claimTx,
    };
  }

  if (state.state === 'PENDING_FLIP') {
    log(`Pending flip detected (${state.depositSol.toFixed(4)} SOL in escrow). Waiting for resolution...`);
    const keypair = getWallet().payer;
    const token = await ensureAuth(keypair);

    try {
      const flip = await getCoinFlip(token);
      if (flip?.status === 'FINALIZED' || flip?.status === 'COMPLETED') {
        const won = flip.won === true;
        if (won) {
          const claimTx = await claimReward(flip.id, flip.amount, flip.side);
          return {
            resumed: true,
            previous_state: 'PENDING_FLIP',
            result: 'WIN',
            payout: flip.amount * 2,
            claim_tx: claimTx,
          };
        }
        return { resumed: true, previous_state: 'PENDING_FLIP', result: 'LOSS', payout: 0 };
      }
    } catch {
      // Backend may not have the flip
    }

    return { resumed: true, previous_state: 'PENDING_FLIP', result: 'UNKNOWN', payout: 0 };
  }

  return null;
}

export async function play(
  side: string,
  amount: number,
  opts: { noClaim?: boolean; priorityFee?: number; timeout?: number } = {},
): Promise<PlayOutput> {
  const { noClaim = false, priorityFee, timeout = 120_000 } = opts;
  const keypair = getWallet().payer;

  // 1. Auth
  const token = await ensureAuth(keypair);
  verboseLog('Authenticated');

  // 2. Check balance
  const balanceBefore = await getBalance();
  const cost = totalCost(amount, priorityFee ?? DEFAULT_PRIORITY_FEE_SOL);
  if (balanceBefore < cost) {
    throw Errors.insufficientBalance(cost, balanceBefore);
  }

  // 3. Resolve stuck state
  const stuck = await detectState();
  if (stuck.state === 'PENDING_REWARD') {
    log(`Auto-claiming pending reward of ${stuck.rewardSol.toFixed(4)} SOL...`);
    await claimReward();
  } else if (stuck.state === 'PENDING_FLIP') {
    log(`Pending flip in escrow — waiting for resolution...`);
    await sleep(3000);
    const state2 = await detectState();
    if (state2.state === 'PENDING_REWARD') {
      await claimReward();
    } else if (state2.state !== 'IDLE') {
      throw Errors.depositFailed('Previous flip still pending. Try again in a moment or run: dcf play');
    }
  }

  // 4. Create flip (backend)
  verboseLog('Creating flip...');
  const flip = await createCoinFlip({ side, amount }, token);
  const flipId: string = flip?.id ?? '';
  verboseLog(`Flip created: ${flipId}`);

  // 5. Deposit on-chain
  log(`Flipping ${side === 'H' ? 'Heads' : 'Tails'} for ${amount} SOL...`);
  const depositTx = await depositSol(flipId, amount, side, priorityFee);

  // 6. Process flip (submit signature to backend)
  verboseLog('Submitting deposit signature to backend...');
  const result = await processCoinFlipWithMemo(flipId, depositTx, token);

  // 7. Determine outcome
  const won = result?.won === true;
  const payout = won ? amount * 2 : 0;

  // 8. Claim if won
  let claimTx: string | undefined;
  if (won && !noClaim) {
    verboseLog('You won! Claiming reward...');
    await waitForReward(timeout);
    claimTx = await claimReward(flipId, amount, side, priorityFee);
  }

  // 9. Final balance
  const balanceAfter = await getBalance();
  const fee = round4(amount * FEE_PERCENTAGE + FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL);
  const profit = won ? amount : -amount;

  return {
    result: won ? 'WIN' : 'LOSS',
    side,
    bet: amount,
    fee,
    payout,
    profit,
    balance_before: round4(balanceBefore),
    balance_after: round4(balanceAfter),
    tx: depositTx,
    claim_tx: claimTx,
    flip_id: flipId,
    explorer: solscanTx(claimTx ?? depositTx),
  };
}

async function waitForReward(timeoutMs: number): Promise<void> {
  const start = Date.now();
  const connection = getConnection();
  const player = getWallet().publicKey;
  const [rewardsPda] = await findRewardsAccount(player);

  while (Date.now() - start < timeoutMs) {
    const balance = await connection.getBalance(rewardsPda, 'processed');
    if (balance > 0) return;
    await sleep(2000);
  }

  throw Errors.timeout(Math.round(timeoutMs / 1000));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
