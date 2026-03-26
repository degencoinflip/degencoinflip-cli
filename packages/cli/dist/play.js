"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlay = registerPlay;
const sdk_1 = require("@degencoinflip/sdk");
const sdk_2 = require("@degencoinflip/sdk");
const output_1 = require("./output");
function registerPlay(program) {
    program
        .command('play [side] [amount]')
        .description('Flip a coin. With no args: resume stuck state.')
        .option('--no-claim', 'Don\'t auto-claim on win')
        .option('--priority-fee <sol>', 'Priority fee in SOL', parseFloat)
        .option('--dry-run', 'Show cost breakdown without playing')
        .option('--timeout <ms>', 'Max wait for result in ms', parseInt, 120000)
        .addHelpText('after', `
Examples:
  dcf play H 1            Flip heads for 1 SOL
  dcf play T 0.5          Flip tails for 0.5 SOL
  dcf play H 1 --dry-run  Preview costs without playing
  dcf play                Resume a stuck flip

Bets: 0.001–32 SOL (up to 3 decimal places). 3.5% fee per flip.
Use --dry-run to see full cost breakdown.
`)
        .action(async (sideArg, amountArg, opts) => {
        const keypair = (0, sdk_1.loadKeypair)();
        const sdk = new sdk_1.DegenCoinFlip({ keypair });
        // No args = resume mode
        if (!sideArg && !amountArg) {
            const result = await sdk.resume();
            (0, output_1.outputResume)(result ?? { resumed: false, state: 'IDLE', message: 'No stuck state. Ready to play: dcf play H 1' });
            return;
        }
        // Validate side
        const side = sideArg?.toUpperCase();
        if (side !== 'H' && side !== 'T') {
            throw sdk_1.Errors.invalidSide(sideArg ?? '');
        }
        // Validate amount
        const amount = parseFloat(amountArg ?? '');
        if (isNaN(amount) || amount < sdk_2.MIN_DEPOSIT_SOL || amount > sdk_2.MAX_DEPOSIT_SOL) {
            throw sdk_1.Errors.invalidAmount(amount, sdk_2.MIN_DEPOSIT_SOL, sdk_2.MAX_DEPOSIT_SOL);
        }
        const decimals = (amountArg ?? '').split('.')[1];
        if (decimals && decimals.length > 3) {
            throw sdk_1.Errors.invalidAmount(amount, sdk_2.MIN_DEPOSIT_SOL, sdk_2.MAX_DEPOSIT_SOL);
        }
        // Dry run
        if (opts.dryRun) {
            const result = await sdk.dryRun(side, amount, opts.priorityFee);
            (0, output_1.outputDryRun)(result);
            return;
        }
        // Play
        const result = await sdk.play(side, amount, {
            noClaim: opts.claim === false,
            priorityFee: opts.priorityFee,
            timeout: opts.timeout,
        });
        (0, output_1.outputPlay)(result);
    });
}
