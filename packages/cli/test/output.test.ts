import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

// We need to test the output module's formatting logic
// Import after potentially setting up mocks
describe('CLI output', () => {
  let captured: string[];
  let origLog: typeof console.log;
  let origError: typeof console.error;
  let origIsTTY: boolean | undefined;

  beforeEach(() => {
    captured = [];
    origLog = console.log;
    origError = console.error;
    origIsTTY = process.stdout.isTTY;
    console.log = (...args: any[]) => { captured.push(args.join(' ')); };
    console.error = (...args: any[]) => { /* suppress stderr */ };
  });

  afterEach(() => {
    console.log = origLog;
    console.error = origError;
    Object.defineProperty(process.stdout, 'isTTY', { value: origIsTTY, writable: true });
  });

  describe('outputPlay', () => {
    it('outputs human-readable result on TTY', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputPlay, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputPlay({
        result: 'WIN',
        side: 'H',
        bet: 1,
        fee: 0.035,
        payout: 2,
        profit: 1,
        balance_before: 5,
        balance_after: 6,
        tx: 'abc123',
        explorer: 'https://solscan.io/tx/abc123',
      });

      const output = captured.join('\n');
      assert.match(output, /WIN/);
      assert.match(output, /6 SOL/);
    });

    it('outputs JSON when format is json', async () => {
      const { outputPlay, setFormat } = await import('../src/output');
      setFormat('json' as any);

      outputPlay({
        result: 'LOSS',
        side: 'T',
        bet: 0.5,
        fee: 0.0175,
        payout: 0,
        profit: -0.5,
        balance_before: 5,
        balance_after: 4.5,
        tx: 'def456',
        explorer: 'https://solscan.io/tx/def456',
      });

      // Should be valid JSON
      const jsonStr = captured.find(s => s.includes('"result"'));
      assert(jsonStr, 'Should output JSON');
      const parsed = JSON.parse(jsonStr!);
      assert.strictEqual(parsed.result, 'LOSS');
      assert.strictEqual(parsed.bet, 0.5);
    });
  });

  describe('outputDryRun', () => {
    it('shows cost breakdown on TTY', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputDryRun, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputDryRun({
        dry_run: true,
        side: 'H',
        bet: 1,
        fee: 0.035,
        priority_fee: 0.0001,
        total_cost: 1.0351,
        potential_win: 2,
        balance: 5,
        can_play: true,
      });

      const output = captured.join('\n');
      assert.match(output, /Dry run/);
      assert.match(output, /1 SOL/);
      assert.match(output, /0.035 SOL/);
    });
  });

  describe('outputBalance', () => {
    it('shows wallet and state on TTY', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputBalance, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputBalance({
        wallet: 'abc123def456',
        balance: 5.1234,
        state: 'IDLE',
        ready: true,
      });

      const output = captured.join('\n');
      assert.match(output, /abc123def456/);
      assert.match(output, /5.1234 SOL/);
      assert.match(output, /IDLE/);
    });
  });

  describe('outputHistory', () => {
    it('shows table header and summary on TTY', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputHistory, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputHistory({
        flips: [
          { time: '5m ago', side: 'H', bet: 1, result: 'WIN', payout: 2 },
          { time: '10m ago', side: 'T', bet: 0.5, result: 'LOSS', payout: 0 },
        ],
        summary: { total: 2, wins: 1, losses: 1, net_pnl: 0.483, win_rate: '50%' },
      });

      const output = captured.join('\n');
      assert.match(output, /TIME/);
      assert.match(output, /SIDE/);
      assert.match(output, /2 flips/);
      assert.match(output, /1W 1L/);
      assert.match(output, /50%/);
    });
  });

  describe('outputResume', () => {
    it('shows "no stuck state" when not resumed', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputResume, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputResume({ resumed: false, state: 'IDLE', message: 'No stuck state' });

      const output = captured.join('\n');
      assert.match(output, /No stuck state|ready to play/);
    });

    it('shows recovery info when resumed', async () => {
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true });
      const { outputResume, setFormat } = await import('../src/output');
      setFormat('table' as any);

      outputResume({
        resumed: true,
        previous_state: 'PENDING_REWARD',
        result: 'WIN',
        payout: 2,
        claim_tx: 'claim-tx-123',
      });

      const output = captured.join('\n');
      assert.match(output, /Recovered/);
      assert.match(output, /PENDING_REWARD/);
      assert.match(output, /WIN/);
    });
  });
});
