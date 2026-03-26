import { Command } from 'commander';
import { DegenCoinFlip, loadKeypair } from '@degencoinflip/sdk';
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
      const keypair = loadKeypair();
      const sdk = new DegenCoinFlip({ keypair });
      const data = await sdk.balance();
      outputBalance(data);
    });
}
