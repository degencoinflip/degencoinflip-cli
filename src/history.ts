import { Command } from 'commander';
import { getWallet } from './anchor';
import { ensureAuth } from './auth';
import { outputHistory } from './output';
import { getApiUrl, FEE_PERCENTAGE } from './constants';
import { Errors } from './errors';
import { verboseLog } from './output';

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
      const keypair = getWallet().payer;
      const walletId = keypair.publicKey.toBase58();
      const token = await ensureAuth(keypair);

      const limit = opts.limit as number;
      const startTime = parseStartTime(opts.since as string);
      const endTime = new Date().toISOString();
      const url = `${getApiUrl()}/coinFlips/walletHistory?walletId=${walletId}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
      verboseLog(`GET ${url}`);

      const res = await fetch(url, { headers: { Authorization: token } });

      if (!res.ok) {
        throw Errors.apiFailed('history', `${res.status}`);
      }

      const json = await res.json();
      const flips = json?.payload ?? json?.data?.payload ?? json ?? [];
      const flipArray = Array.isArray(flips) ? flips : [];

      const formatted = flipArray.slice(0, limit).map((f: Record<string, unknown>) => ({
        time: formatTimeAgo(f.createdAt as string || f.created_at as string),
        side: (f.side as string) ?? '?',
        bet: (f.amount as number) ?? 0,
        result: f.won ? 'WIN' : 'LOSS',
        payout: f.won ? ((f.amount as number) ?? 0) * 2 : 0,
      }));

      const wins = formatted.filter(f => f.result === 'WIN').length;
      const losses = formatted.length - wins;
      const netPnl = formatted.reduce((sum, f) => {
        return sum + (f.result === 'WIN' ? f.bet : -(f.bet * (1 + FEE_PERCENTAGE)));
      }, 0);

      outputHistory({
        flips: formatted,
        summary: {
          total: formatted.length,
          wins,
          losses,
          net_pnl: Math.round(netPnl * 1000) / 1000,
          win_rate: formatted.length > 0 ? `${Math.round((wins / formatted.length) * 100)}%` : '0%',
        },
      });
    });
}

function parseStartTime(since: string): string {
  const now = Date.now();
  const match = since.match(/^(\d+)(h|d|m)$/);
  if (!match) return new Date(now - 24 * 3600_000).toISOString();

  const [, num, unit] = match;
  const ms = parseInt(num) * (unit === 'h' ? 3600_000 : unit === 'd' ? 86400_000 : 60_000);
  return new Date(now - ms).toISOString();
}

function formatTimeAgo(dateStr: string | undefined): string {
  if (!dateStr) return '?';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
