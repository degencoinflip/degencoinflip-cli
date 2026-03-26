"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHistory = registerHistory;
const sdk_1 = require("@degencoinflip/sdk");
const output_1 = require("./output");
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
        const keypair = (0, sdk_1.loadKeypair)();
        const sdk = new sdk_1.DegenCoinFlip({ keypair });
        const data = await sdk.history({
            limit: opts.limit,
            since: opts.since,
        });
        (0, output_1.outputHistory)(data);
    });
}
