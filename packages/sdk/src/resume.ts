import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection, getWallet } from './anchor';
import { findDegenerateAccount, findRewardsAccount } from './pda';
import { IGNOREABLE_AMOUNT_SOL } from './constants';
import { verboseLog } from './logger';

export type GameState =
  | { state: 'IDLE' }
  | { state: 'PENDING_REWARD'; rewardSol: number }
  | { state: 'PENDING_FLIP'; depositSol: number }

export interface OrphanedDeposit {
  signature: string;
  flipId: string;
  amount: number;
  side: 'H' | 'T';
}

/**
 * Detect stuck game state by checking on-chain PDA balances.
 */
export async function detectState(): Promise<GameState> {
  const connection = getConnection();
  const player = getWallet().publicKey;

  const [rewardsPda] = await findRewardsAccount(player);
  const [degeneratePda] = await findDegenerateAccount(player);

  const [rewardsBalance, degenerateBalance] = await Promise.all([
    connection.getBalance(rewardsPda, 'processed'),
    connection.getBalance(degeneratePda, 'processed'),
  ]);

  const rewardsSol = rewardsBalance / LAMPORTS_PER_SOL;
  const depositSol = degenerateBalance / LAMPORTS_PER_SOL;

  verboseLog(`Rewards PDA: ${rewardsSol} SOL, Degenerate PDA: ${depositSol} SOL`);

  if (rewardsSol >= IGNOREABLE_AMOUNT_SOL) {
    return { state: 'PENDING_REWARD', rewardSol: rewardsSol };
  }

  if (depositSol >= IGNOREABLE_AMOUNT_SOL) {
    return { state: 'PENDING_FLIP', depositSol };
  }

  return { state: 'IDLE' };
}

/**
 * Scan the escrow PDA's recent transactions for an orphaned participate() deposit.
 * Queries the degenerate PDA directly (not the wallet) so we only see
 * flip-related txs — no noise from token transfers, SOL sends, etc.
 * Verifies the actual on-chain balance change matches the memo amount
 * (memo alone can be spoofed).
 */
export async function findOrphanedDeposit(): Promise<OrphanedDeposit | null> {
  const connection = getConnection();
  const player = getWallet().publicKey;
  const [degeneratePda] = await findDegenerateAccount(player);

  // Query the escrow PDA — only participate() and consensus() txs show up here
  const sigs = await connection.getSignaturesForAddress(degeneratePda, { limit: 10 });

  for (const sigInfo of sigs) {
    if (!sigInfo.memo) continue;

    const memoMatch = sigInfo.memo.match(/id=([0-9a-f-]{36})\s+amount=([\d.]+)\s+side=(H|T)/);
    if (!memoMatch) continue;

    const [, flipId, memoAmount, side] = memoMatch;

    // Fetch full parsed tx to verify actual balance change
    const tx = await connection.getParsedTransaction(sigInfo.signature, {
      maxSupportedTransactionVersion: 0,
    });
    if (!tx?.meta || tx.meta.err) continue;

    // Find the degenerate PDA in accountKeys and check pre/post balance
    const accounts = tx.transaction.message.accountKeys;
    const pdaKey = degeneratePda.toBase58();
    const pdaIndex = accounts.findIndex(
      a => (typeof a === 'string' ? a : a.pubkey.toBase58()) === pdaKey
    );
    if (pdaIndex === -1) continue;

    const balanceChangeLamports = tx.meta.postBalances[pdaIndex] - tx.meta.preBalances[pdaIndex];

    // Only consider deposits (positive balance change into escrow)
    // Consensus txs have negative balance change (funds leaving escrow)
    if (balanceChangeLamports <= 0) continue;

    const balanceChangeSol = balanceChangeLamports / LAMPORTS_PER_SOL;

    // Cross-verify: actual balance change must match memo amount
    const memoAmountNum = parseFloat(memoAmount);
    if (Math.abs(balanceChangeSol - memoAmountNum) > 0.0001) {
      verboseLog(`Memo amount ${memoAmount} doesn't match balance change ${balanceChangeSol} — skipping`);
      continue;
    }

    verboseLog(`Found orphaned deposit: sig=${sigInfo.signature.slice(0, 12)}... id=${flipId} amount=${memoAmountNum} side=${side}`);

    return {
      signature: sigInfo.signature,
      flipId,
      amount: memoAmountNum,
      side: side as 'H' | 'T',
    };
  }

  return null;
}
