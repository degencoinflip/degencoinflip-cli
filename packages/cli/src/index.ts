import { Command } from 'commander';
import { registerPlay } from './play';
import { registerBalance } from './balance';
import { registerHistory } from './history';
import { setFormat, setQuiet, setVerbose, Format } from './output';
import { DcfError, DegenCoinFlip } from '@degencoinflip/sdk';

const program = new Command();

program
  .name('dcf')
  .description('Degen Coin Flip CLI — flip coins from the terminal')
  .version('0.1.0')
  .option('-k, --keypair <path>', 'Path to Solana keypair file')
  .option('--rpc-url <url>', 'Solana RPC endpoint URL')
  .option('-f, --format <type>', 'Output format: json, table, compact')
  .option('-v, --verbose', 'Show tx details and timing')
  .option('-q, --quiet', 'Minimal output')
  .hook('preAction', (_thisCommand, actionCommand) => {
    // Apply global opts from the root program
    const opts = program.opts();
    if (opts.format) setFormat(opts.format as Format);
    if (opts.quiet) setQuiet(true);
    if (opts.verbose) setVerbose(true);
    if (opts.keypair) process.env.DCF_KEYPAIR = opts.keypair;
    if (opts.rpcUrl) process.env.DCF_RPC_URL = opts.rpcUrl;
  })
  .addHelpText('after', `
Environment variables:
  DCF_KEYPAIR       Path to keypair file (default: ~/.config/solana/id.json)
  DCF_RPC_URL       Solana RPC endpoint
  DCF_PRIORITY_FEE  Default priority fee in SOL

Examples:
  dcf play H 1            Flip heads for 1 SOL
  dcf play T 0.5          Flip tails for 0.5 SOL
  dcf play                Resume a stuck flip
  dcf play H 1 --dry-run  Preview costs
  dcf balance             Check your balance
  dcf history             Recent flip results

Quick start:
  1. Create a keypair:  solana-keygen new
  2. Fund it with SOL
  3. dcf play H 1
`);

// Register commands
registerPlay(program);
registerBalance(program);
registerHistory(program);

// Also register 'resume' as an alias for 'play' with no args
program
  .command('resume')
  .description('Resume a stuck flip (alias for: dcf play)')
  .action(async (_opts: Record<string, unknown>, cmd: Command) => {
    const { outputResume } = await import('./output');
    const parent = cmd.parent!;
    const parentOpts = parent.opts();
    const keypair = parentOpts.keypair ?? process.env.DCF_KEYPAIR;

    const sdk = new DegenCoinFlip({
      keypair,
      ...(parentOpts.rpcUrl && { rpcUrl: parentOpts.rpcUrl }),
    });

    const result = await sdk.resume();
    outputResume(result ?? { resumed: false, state: 'IDLE', message: 'No stuck state. Ready to play: dcf play H 1' });
  });

// Error handling
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (e: any) {
    if (e instanceof DcfError) {
      console.error(e.format());
      process.exit(e.exitCode);
    }
    // Commander exits on its own for help/version
    if (e?.exitCode !== undefined) process.exit(e.exitCode);
    console.error(`error: ${e?.message ?? e}`);
    process.exit(1);
  }
}

main();
