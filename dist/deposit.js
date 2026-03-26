"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositSol = depositSol;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("@coral-xyz/anchor");
const anchor_2 = require("./anchor");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
const helius_1 = require("./helius");
const errors_1 = require("./errors");
const output_1 = require("./output");
function makeMemo(id, amount, side) {
    return Buffer.from(`id=${id} amount=${amount} side=${side}`, 'utf-8');
}
function customRound(n) {
    return Math.round(n * 1000) / 1000;
}
async function depositSol(id, amount, side, priorityFee) {
    const program = (0, anchor_2.getProgram)();
    const provider = (0, anchor_2.getProvider)();
    const player = provider.wallet.publicKey;
    const authority = (0, constants_1.getAuthorityId)();
    const [houseTreasury] = await (0, pda_1.findHouseTreasury)();
    const [houseState] = await (0, pda_1.findHouseState)();
    const [degenerateAccount] = await (0, pda_1.findDegenerateAccount)(player);
    const [rewardsAccount] = await (0, pda_1.findRewardsAccount)(player);
    const lamports = new anchor_1.BN(Math.round(customRound(amount) * web3_js_1.LAMPORTS_PER_SOL));
    (0, output_1.verboseLog)(`Building participate tx: ${amount} SOL, side ${side}`);
    try {
        // Use .methods API (coral-xyz/anchor 0.30+)
        const instruction = await program.methods
            .participate(lamports)
            .accounts({
            degenerate: player,
            initializer: constants_1.INITIALIZER_ID,
            authority,
            coldHouse: constants_1.COLD_HOUSE_ID,
            houseTreasury,
            houseState,
            degenerateAccount,
            rewardsAccount,
            systemProgram: web3_js_1.SystemProgram.programId,
            instructions: web3_js_1.SYSVAR_INSTRUCTIONS_PUBKEY,
        })
            .instruction();
        const { connection } = provider;
        const { value: { blockhash } } = await connection.getLatestBlockhashAndContext();
        const memoInstruction = new web3_js_1.TransactionInstruction({
            keys: [{ pubkey: player, isSigner: true, isWritable: true }],
            data: makeMemo(id, amount, side),
            programId: constants_1.MEMO_PROGRAM_ID,
        });
        // Estimate priority fee if not provided
        let fee = priorityFee ?? 0;
        if (!fee) {
            try {
                const tempMsg = new web3_js_1.TransactionMessage({
                    payerKey: player,
                    recentBlockhash: blockhash,
                    instructions: [memoInstruction, instruction],
                }).compileToLegacyMessage();
                const tempTx = new web3_js_1.VersionedTransaction(tempMsg);
                fee = await (0, helius_1.getPriorityFeeEstimate)(tempTx);
            }
            catch {
                fee = constants_1.DEFAULT_PRIORITY_FEE_SOL;
            }
        }
        (0, output_1.verboseLog)(`Priority fee: ${fee} SOL`);
        const computeBudgetIx = web3_js_1.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: Math.round((fee * web3_js_1.LAMPORTS_PER_SOL) + 1),
        });
        const instructions = [memoInstruction, computeBudgetIx, instruction];
        const messageV0 = new web3_js_1.TransactionMessage({
            payerKey: player,
            recentBlockhash: blockhash,
            instructions,
        }).compileToLegacyMessage();
        const versionedTx = new web3_js_1.VersionedTransaction(messageV0);
        const txes = await provider.sendAll([{ tx: versionedTx }]);
        const signature = txes[0];
        (0, output_1.verboseLog)(`Deposit tx: ${signature}`);
        return signature;
    }
    catch (e) {
        throw errors_1.Errors.depositFailed(e?.message ?? String(e));
    }
}
