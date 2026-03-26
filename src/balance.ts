import { Command } from 'commander';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getWallet, getConnection } from './anchor';
import { findDegenerateAccount, findRewardsAccount } from './pda';
import { IGNOREABLE_AMOUNT_SOL } from './constants';
import { outputBalance } from './output';

export function registerBalance(program: Command) {
  program
    .command('balance')
    .description('Check SOL balance and game state')
    .addHelpText('after', `
Examples:
  dcf balance             Show balance and pending state
`)
    .action(async () => {
      const wallet = getWallet();
      const connection = getConnection();
      const player = wallet.publicKey;
      const walletId = player.toBase58();

      const [rewardsPda] = await findRewardsAccount(player);
      const [degeneratePda] = await findDegenerateAccount(player);

      const [balanceLamports, rewardsLamports, degenerateLamports] = await Promise.all([
        connection.getBalance(player, 'processed'),
        connection.getBalance(rewardsPda, 'processed'),
        connection.getBalance(degeneratePda, 'processed'),
      ]);

      const balanceSol = balanceLamports / LAMPORTS_PER_SOL;
      const rewardsSol = rewardsLamports / LAMPORTS_PER_SOL;
      const depositSol = degenerateLamports / LAMPORTS_PER_SOL;

      const hasPendingReward = rewardsSol >= IGNOREABLE_AMOUNT_SOL;
      const hasPendingFlip = depositSol >= IGNOREABLE_AMOUNT_SOL;

      const round4 = (n: number) => Math.round(n * 10000) / 10000;

      const state = hasPendingReward ? 'PENDING_REWARD'
        : hasPendingFlip ? 'PENDING_FLIP'
        : 'IDLE';

      outputBalance({
        wallet: walletId,
        balance: round4(balanceSol),
        state,
        ready: !hasPendingFlip,
        ...(hasPendingReward && {
          pending_reward: round4(rewardsSol),
          note: 'Run dcf play to auto-claim, or dcf play H 1 to claim and play',
        }),
        ...(hasPendingFlip && {
          pending_deposit: round4(depositSol),
          note: 'Flip in progress — will auto-resolve on next play',
        }),
      });
    });
}
