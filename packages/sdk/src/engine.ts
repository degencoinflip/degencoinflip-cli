import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getBalance, getWallet, getWalletAdapter, getConnection } from './anchor';
import { ensureAuth } from './auth';
import { detectState } from './resume';
import { depositSol } from './deposit';
import { buildDepositTransaction } from './deposit';
import { claimReward } from './claim';
import { buildClaimTransaction } from './claim';
import { createCoinFlip, processCoinFlipWithMemo, getCoinFlip, playFlip } from './api';
import { findRewardsAccount } from './pda';
import { FEE_PERCENTAGE, FLAT_FEE_LAMPORTS, DEFAULT_PRIORITY_FEE_SOL } from './constants';
import { Errors } from './errors';
import { log, verboseLog } from './logger';
import type { FlipResult, DryRunResult, ResumeResult, PlayOptions } from './types';

function solscanTx(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

/** Get the appropriate auth target — wallet adapter if set, otherwise keypair via payer */
function getAuthTarget() {
  const wallet = getWallet();
  return wallet.payer ? wallet.payer : wallet; // keypair.payer for KeypairWallet, adapter for WalletAdapter
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}


function totalCost(amount: number, priorityFee: number): number {
  return amount + (amount * FEE_PERCENTAGE) + (FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL) + priorityFee;
}

export async function dryRun(side: string, amount: number, priorityFee: number = DEFAULT_PRIORITY_FEE_SOL): Promise<DryRunResult> {
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

export async function resume(): Promise<ResumeResult | null> {
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
    const token = await ensureAuth(getAuthTarget());

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

/**
 * 1-popup flow: builds both deposit and claim transactions, signs them in a
 * single `signAllTransactions` call (one wallet popup), then sends them
 * sequentially. Only used when a wallet adapter with `signAllTransactions` is
 * available — keypair wallets continue to use the existing multi-step flow.
 */
async function playOnePopup(
  side: string,
  amount: number,
  opts: PlayOptions = {},
): Promise<FlipResult> {
  const { noClaim = false, priorityFee, timeout = 120_000 } = opts;
  const walletAdapter = getWalletAdapter();
  const walletId = typeof walletAdapter.publicKey === 'string'
    ? walletAdapter.publicKey
    : walletAdapter.publicKey.toBase58();

  // 1. Check balance
  const balanceBefore = await getBalance();
  const cost = totalCost(amount, priorityFee ?? DEFAULT_PRIORITY_FEE_SOL);
  if (balanceBefore < cost) {
    throw Errors.insufficientBalance(cost, balanceBefore);
  }

  // 2. Resolve stuck state (may require a separate popup if claiming)
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

  // 3. Generate flip ID client-side
  const flipId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : require('crypto').randomUUID();

  // 4. Build both transactions (unsigned)
  const depositTx = await buildDepositTransaction(flipId, amount, side, priorityFee);
  const claimTx = await buildClaimTransaction(flipId, amount, side, priorityFee);

  // 5. Sign both at once — 1 POPUP
  log(`Flipping ${side === 'H' ? 'Heads' : 'Tails'} for ${amount} SOL...`);
  const [signedDeposit, signedClaim] = await walletAdapter.signAllTransactions([depositTx, claimTx]);

  // 6. Send deposit
  const connection = getConnection();
  const depositSig = await connection.sendRawTransaction(signedDeposit.serialize(), { skipPreflight: true });
  await connection.confirmTransaction(depositSig, 'confirmed');
  verboseLog(`Deposit tx: ${depositSig}`);

  // 7. Call /flips/play (no JWT — deposit signature is proof)
  const flipResult = await playFlip({
    wallet_id: walletId,
    side,
    amount,
    deposit_signature: depositSig,
    flip_id: flipId,
  });
  const won = flipResult?.won === true;
  const payout = won ? amount * 2 : 0;

  // 8. If won, submit pre-signed claim
  let claimTxSig: string | undefined;
  if (won && !noClaim) {
    verboseLog('Won! Submitting pre-signed claim...');
    // Wait for consensus to settle (rewards PDA must be funded)
    await waitForReward(timeout);
    claimTxSig = await connection.sendRawTransaction(signedClaim.serialize(), { skipPreflight: true });
    await connection.confirmTransaction(claimTxSig, 'confirmed');
    verboseLog(`Claim tx: ${claimTxSig}`);
  }

  // 9. Final balance
  const balanceAfter = await getBalance();
  const fee = round4(amount * FEE_PERCENTAGE + FLAT_FEE_LAMPORTS / LAMPORTS_PER_SOL);

  return {
    result: won ? 'WIN' : 'LOSS',
    side,
    bet: amount,
    fee,
    payout,
    profit: won ? amount : -amount,
    balance_before: round4(balanceBefore),
    balance_after: round4(balanceAfter),
    tx: depositSig,
    claim_tx: claimTxSig,
    flip_id: flipId,
    explorer: solscanTx(claimTxSig ?? depositSig),
  };
}

export async function play(
  side: string,
  amount: number,
  opts: PlayOptions = {},
): Promise<FlipResult> {
  // 1-popup flow for browser wallets with signAllTransactions
  const walletAdapter = getWalletAdapter();
  if (walletAdapter?.signAllTransactions) {
    return playOnePopup(side, amount, opts);
  }

  // Keypair flow: deposit on-chain → POST /flips/play → claim if won
  const { noClaim = false, priorityFee, timeout = 120_000 } = opts;
  const walletId = getWallet().publicKey.toBase58();

  // 1. Check balance
  const balanceBefore = await getBalance();
  const cost = totalCost(amount, priorityFee ?? DEFAULT_PRIORITY_FEE_SOL);
  if (balanceBefore < cost) {
    throw Errors.insufficientBalance(cost, balanceBefore);
  }

  // 2. Resolve stuck state
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

  // 3. Generate flip ID client-side
  const flipId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : require('crypto').randomUUID();

  // 4. Deposit on-chain
  log(`Flipping ${side === 'H' ? 'Heads' : 'Tails'} for ${amount} SOL...`);
  const depositTx = await depositSol(flipId, amount, side, priorityFee);

  // 5. Call /flips/play (no JWT — deposit signature is proof)
  verboseLog('Submitting to /flips/play...');
  const result = await playFlip({
    wallet_id: walletId,
    side,
    amount,
    deposit_signature: depositTx,
    flip_id: flipId,
  });

  // 6. Determine outcome
  const won = result?.won === true;
  const payout = won ? amount * 2 : 0;

  // 7. Claim if won
  let claimTx: string | undefined;
  if (won && !noClaim) {
    verboseLog('You won! Claiming reward...');
    await waitForReward(timeout);
    claimTx = await claimReward(flipId, amount, side, priorityFee);
  }

  // 8. Final balance
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
