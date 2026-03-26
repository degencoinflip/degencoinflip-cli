import { Command } from 'commander';
import { DegenCoinFlip, loadKeypair } from '@degencoinflip/sdk';
import { outputHistory } from './output';

export function registerHistory(program: Command) {
  program
    .command('history')
    .description('Show recent flip history')
    .option('-l, --limit <n>', 'Number of flips to show', parseInt, 10)
    .option('--since <duration>', 'Time window (e.g., 24h, 7d)', '24h')
    .addHelpText('after', `
Examples:
  dcf history             Last 10 flips
  dcf history --limit 50  Last 50 flips
  dcf history --since 7d  Flips from last 7 days
`)
    .action(async (opts: Record<string, unknown>) => {
      const keypair = loadKeypair();
      const sdk = new DegenCoinFlip({ keypair });
      const data = await sdk.history({
        limit: opts.limit as number,
        since: opts.since as string,
      });
      outputHistory(data);
    });
}
