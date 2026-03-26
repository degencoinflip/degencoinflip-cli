"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReward = claimReward;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("./anchor");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const output_1 = require("./output");
const MAX_MARKET_LAMPORTS_CLAIM = 1_000_000;
function makeMemo(id, amount, side) {
    return Buffer.from(`id=${id} amount=${amount} side=${side}`, 'utf-8');
}
async function claimReward(id = 'claim', amount = 0, side = 'H', priorityFee = constants_1.DEFAULT_PRIORITY_FEE_SOL) {
    const program = (0, anchor_1.getProgram)();
    const provider = (0, anchor_1.getProvider)();
    const player = provider.wallet.publicKey;
    const authority = (0, constants_1.getAuthorityId)();
    const [houseState] = await (0, pda_1.findHouseState)();
    const [rewardsAccount] = await (0, pda_1.findRewardsAccount)(player);
    (0, output_1.verboseLog)(`Building reveal tx...`);
    try {
        // Use .methods API (coral-xyz/anchor 0.30+)
        const instruction = await program.methods
            .reveal()
            .accounts({
            degenerate: player,
            initializer: constants_1.INITIALIZER_ID,
            authority,
            coldHouse: constants_1.COLD_HOUSE_ID,
            houseState,
            rewardsAccount,
            systemProgram: web3_js_1.SystemProgram.programId,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
            .instruction();
        const { connection } = provider;
        const { value: { blockhash } } = await connection.getLatestBlockhashAndContext();
        const memoIx = new web3_js_1.TransactionInstruction({
            keys: [{ pubkey: player, isSigner: true, isWritable: true }],
            data: makeMemo(id, amount, side),
            programId: constants_1.MEMO_PROGRAM_ID,
        });
        const priorityFeeLamports = priorityFee * web3_js_1.LAMPORTS_PER_SOL;
        const computePriceIx = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: Math.round(priorityFeeLamports === 0 ? (MAX_MARKET_LAMPORTS_CLAIM + 1) : (priorityFeeLamports + 1)),
        });
        const computeLimitIx = web3_js_1.ComputeBudgetProgram.setComputeUnitLimit({
            units: 60_000,
        });
        const instructions = [memoIx, computePriceIx, computeLimitIx, instruction];
        const messageV0 = new web3_js_1.TransactionMessage({
            payerKey: player,
            recentBlockhash: blockhash,
            instructions,
        }).compileToLegacyMessage();
        const versionedTx = new web3_js_1.VersionedTransaction(messageV0);
        const txes = await provider.sendAll([{ tx: versionedTx }]);
        const signature = txes[0];
        (0, output_1.verboseLog)(`Claim tx: ${signature}`);
        return signature;
    }
    catch (e) {
        throw errors_1.Errors.claimFailed(e?.message ?? String(e));
    }
}
