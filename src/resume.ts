import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getConnection, getWallet } from './anchor';
import { findDegenerateAccount, findRewardsAccount } from './pda';
import { IGNOREABLE_AMOUNT_SOL } from './constants';
import { verboseLog } from './output';

export type GameState =
  | { state: 'IDLE' }
  | { state: 'PENDING_REWARD'; rewardSol: number }
  | { state: 'PENDING_FLIP'; depositSol: number }

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
