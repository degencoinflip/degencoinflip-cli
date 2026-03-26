"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistory = registerHistory;
const anchor_1 = require("./anchor");
const auth_1 = require("./auth");
const output_1 = require("./output");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const output_2 = require("./output");
function registerHistory(program) {
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
        .action(async (opts) => {
        const keypair = (0, anchor_1.getWallet)().payer;
        const walletId = keypair.publicKey.toBase58();
        const token = await (0, auth_1.ensureAuth)(keypair);
        const limit = opts.limit;
        const startTime = parseStartTime(opts.since);
        const endTime = new Date().toISOString();
        const url = `${(0, constants_1.getApiUrl)()}/coinFlips/walletHistory?walletId=${walletId}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
        (0, output_2.verboseLog)(`GET ${url}`);
        const res = await fetch(url, { headers: { Authorization: token } });
        if (!res.ok) {
            throw errors_1.Errors.apiFailed('history', `${res.status}`);
        }
        const json = await res.json();
        const flips = json?.payload ?? json?.data?.payload ?? json ?? [];
        const flipArray = Array.isArray(flips) ? flips : [];
        const formatted = flipArray.slice(0, limit).map((f) => ({
            time: formatTimeAgo(f.createdAt || f.created_at),
            side: f.side ?? '?',
            bet: f.amount ?? 0,
            result: f.won ? 'WIN' : 'LOSS',
            payout: f.won ? (f.amount ?? 0) * 2 : 0,
        }));
        const wins = formatted.filter(f => f.result === 'WIN').length;
        const losses = formatted.length - wins;
        const netPnl = formatted.reduce((sum, f) => {
            return sum + (f.result === 'WIN' ? f.bet : -(f.bet * (1 + constants_1.FEE_PERCENTAGE)));
        }, 0);
        (0, output_1.outputHistory)({
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
function parseStartTime(since) {
    const now = Date.now();
    const match = since.match(/^(\d+)(h|d|m)$/);
    if (!match)
        return new Date(now - 24 * 3600_000).toISOString();
    const [, num, unit] = match;
    const ms = parseInt(num) * (unit === 'h' ? 3600_000 : unit === 'd' ? 86400_000 : 60_000);
    return new Date(now - ms).toISOString();
}
function formatTimeAgo(dateStr) {
    if (!dateStr)
        return '?';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diff / 60_000);
    if (mins < 1)
        return 'now';
    if (mins < 60)
        return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}
