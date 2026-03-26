"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectState = detectState;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("./anchor");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
const output_1 = require("./output");
/**
 * Detect stuck game state by checking on-chain PDA balances.
 */
async function detectState() {
    const connection = (0, anchor_1.getConnection)();
    const player = (0, anchor_1.getWallet)().publicKey;
    const [rewardsPda] = await (0, pda_1.findRewardsAccount)(player);
    const [degeneratePda] = await (0, pda_1.findDegenerateAccount)(player);
    const [rewardsBalance, degenerateBalance] = await Promise.all([
        connection.getBalance(rewardsPda, 'processed'),
        connection.getBalance(degeneratePda, 'processed'),
    ]);
    const rewardsSol = rewardsBalance / web3_js_1.LAMPORTS_PER_SOL;
    const depositSol = degenerateBalance / web3_js_1.LAMPORTS_PER_SOL;
    (0, output_1.verboseLog)(`Rewards PDA: ${rewardsSol} SOL, Degenerate PDA: ${depositSol} SOL`);
    if (rewardsSol >= constants_1.IGNOREABLE_AMOUNT_SOL) {
        return { state: 'PENDING_REWARD', rewardSol: rewardsSol };
    }
    if (depositSol >= constants_1.IGNOREABLE_AMOUNT_SOL) {
        return { state: 'PENDING_FLIP', depositSol };
    }
    return { state: 'IDLE' };
}
