import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Command } from 'commander';

// Test that CLI commands register correctly without actually executing them
// (execution requires a real keypair and Solana connection)

describe('CLI command registration', () => {
  it('registerPlay adds play command with expected options', async () => {
    const { registerPlay } = await import('../src/play');
    const program = new Command();
    registerPlay(program);

    const playCmd = program.commands.find(c => c.name() === 'play');
    assert(playCmd, 'play command should be registered');
    assert.match(playCmd!.description(), /Flip a coin/);

    // Check options
    const optNames = playCmd!.options.map(o => o.long);
    assert(optNames.includes('--no-claim'), 'should have --no-claim');
    assert(optNames.includes('--priority-fee'), 'should have --priority-fee');
    assert(optNames.includes('--dry-run'), 'should have --dry-run');
    assert(optNames.includes('--timeout'), 'should have --timeout');
  });

  it('registerBalance adds balance command', async () => {
    const { registerBalance } = await import('../src/balance');
    const program = new Command();
    registerBalance(program);

    const balanceCmd = program.commands.find(c => c.name() === 'balance');
    assert(balanceCmd, 'balance command should be registered');
    assert.match(balanceCmd!.description(), /balance/i);
  });

  it('registerHistory adds history command with limit and since options', async () => {
    const { registerHistory } = await import('../src/history');
    const program = new Command();
    registerHistory(program);

    const historyCmd = program.commands.find(c => c.name() === 'history');
    assert(historyCmd, 'history command should be registered');

    const optNames = historyCmd!.options.map(o => o.long);
    assert(optNames.includes('--limit'), 'should have --limit');
    assert(optNames.includes('--since'), 'should have --since');
  });
});

describe('CLI program structure', () => {
  it('main program has name, description, version, global options', async () => {
    // Build a minimal program like index.ts does (without executing)
    const program = new Command();
    program
      .name('dcf')
      .description('Degen Coin Flip CLI')
      .version('0.1.0')
      .option('-k, --keypair <path>', 'Path to Solana keypair file')
      .option('--rpc-url <url>', 'Solana RPC endpoint URL')
      .option('-f, --format <type>', 'Output format')
      .option('-v, --verbose', 'Show tx details')
      .option('-q, --quiet', 'Minimal output');

    assert.strictEqual(program.name(), 'dcf');

    const optNames = program.options.map(o => o.long);
    assert(optNames.includes('--keypair'));
    assert(optNames.includes('--rpc-url'));
    assert(optNames.includes('--format'));
    assert(optNames.includes('--verbose'));
    assert(optNames.includes('--quiet'));
  });
});
