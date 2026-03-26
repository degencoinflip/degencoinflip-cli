"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBalance = registerBalance;
const sdk_1 = require("@degencoinflip/sdk");
const output_1 = require("./output");
function registerBalance(program) {
    program
        .command('balance')
        .description('Check SOL balance and game state')
        .addHelpText('after', `
Examples:
  dcf balance             Show balance and pending state
`)
        .action(async () => {
        const keypair = (0, sdk_1.loadKeypair)();
        const sdk = new sdk_1.DegenCoinFlip({ keypair });
        const data = await sdk.balance();
        (0, output_1.outputBalance)(data);
    });
}
