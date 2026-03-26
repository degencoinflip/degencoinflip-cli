"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBalance = registerBalance;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("./anchor");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
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
        const wallet = (0, anchor_1.getWallet)();
        const connection = (0, anchor_1.getConnection)();
        const player = wallet.publicKey;
        const walletId = player.toBase58();
        const [rewardsPda] = await (0, pda_1.findRewardsAccount)(player);
        const [degeneratePda] = await (0, pda_1.findDegenerateAccount)(player);
        const [balanceLamports, rewardsLamports, degenerateLamports] = await Promise.all([
            connection.getBalance(player, 'processed'),
            connection.getBalance(rewardsPda, 'processed'),
            connection.getBalance(degeneratePda, 'processed'),
        ]);
        const balanceSol = balanceLamports / web3_js_1.LAMPORTS_PER_SOL;
        const rewardsSol = rewardsLamports / web3_js_1.LAMPORTS_PER_SOL;
        const depositSol = degenerateLamports / web3_js_1.LAMPORTS_PER_SOL;
        const hasPendingReward = rewardsSol >= constants_1.IGNOREABLE_AMOUNT_SOL;
        const hasPendingFlip = depositSol >= constants_1.IGNOREABLE_AMOUNT_SOL;
        const round4 = (n) => Math.round(n * 10000) / 10000;
        const state = hasPendingReward ? 'PENDING_REWARD'
            : hasPendingFlip ? 'PENDING_FLIP'
                : 'IDLE';
        (0, output_1.outputBalance)({
            wallet: walletId,
            balance: round4(balanceSol),
            state,
            ready: !hasPendingFlip,
            ...(hasPendingReward && {
                pending_reward: round4(rewardsSol),
                note: 'Run dcf play to auto-claim, or dcf play H 1 to claim and play',
            }),
            ...(hasPendingFlip && {
                pending_deposit: round4(depositSol),
                note: 'Flip in progress — will auto-resolve on next play',
            }),
        });
    });
}
