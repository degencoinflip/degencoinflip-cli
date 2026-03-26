"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dryRun = dryRun;
exports.resume = resume;
exports.play = play;
const web3_js_1 = require("@solana/web3.js");
const anchor_1 = require("./anchor");
const auth_1 = require("./auth");
const resume_1 = require("./resume");
const deposit_1 = require("./deposit");
const deposit_2 = require("./deposit");
const claim_1 = require("./claim");
const claim_2 = require("./claim");
const api_1 = require("./api");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
function solscanTx(sig) {
    return `https://solscan.io/tx/${sig}`;
}
/** Get the appropriate auth target — wallet adapter if set, otherwise keypair via payer */
function getAuthTarget() {
    const wallet = (0, anchor_1.getWallet)();
    return wallet.payer ? wallet.payer : wallet; // keypair.payer for KeypairWallet, adapter for WalletAdapter
}
function round4(n) {
    return Math.round(n * 10000) / 10000;
}
function totalCost(amount, priorityFee) {
    return amount + (amount * constants_1.FEE_PERCENTAGE) + (constants_1.FLAT_FEE_LAMPORTS / web3_js_1.LAMPORTS_PER_SOL) + priorityFee;
}
async function dryRun(side, amount, priorityFee = constants_1.DEFAULT_PRIORITY_FEE_SOL) {
    const balance = await (0, anchor_1.getBalance)();
    const fee = amount * constants_1.FEE_PERCENTAGE + constants_1.FLAT_FEE_LAMPORTS / web3_js_1.LAMPORTS_PER_SOL;
    const cost = totalCost(amount, priorityFee);
    return {
        dry_run: true,
        side,
        bet: amount,
        fee: round4(fee),
        priority_fee: priorityFee,
        total_cost: round4(cost),
        potential_win: amount * 2,
        balance: round4(balance),
        can_play: balance >= cost,
    };
}
async function resume() {
    const state = await (0, resume_1.detectState)();
    if (state.state === 'IDLE')
        return null;
    if (state.state === 'PENDING_REWARD') {
        (0, logger_1.log)(`Claiming pending reward of ${state.rewardSol.toFixed(4)} SOL...`);
        const claimTx = await (0, claim_1.claimReward)();
        return {
            resumed: true,
            previous_state: 'PENDING_REWARD',
            result: 'WIN',
            payout: state.rewardSol,
            claim_tx: claimTx,
        };
    }
    if (state.state === 'PENDING_FLIP') {
        (0, logger_1.log)(`Pending flip detected (${state.depositSol.toFixed(4)} SOL in escrow). Waiting for resolution...`);
        const token = await (0, auth_1.ensureAuth)(getAuthTarget());
        try {
            const flip = await (0, api_1.getCoinFlip)(token);
            if (flip?.status === 'FINALIZED' || flip?.status === 'COMPLETED') {
                const won = flip.won === true;
                if (won) {
                    const claimTx = await (0, claim_1.claimReward)(flip.id, flip.amount, flip.side);
                    return {
                        resumed: true,
                        previous_state: 'PENDING_FLIP',
                        result: 'WIN',
                        payout: flip.amount * 2,
                        claim_tx: claimTx,
                    };
                }
                return { resumed: true, previous_state: 'PENDING_FLIP', result: 'LOSS', payout: 0 };
            }
        }
        catch {
            // Backend may not have the flip
        }
        return { resumed: true, previous_state: 'PENDING_FLIP', result: 'UNKNOWN', payout: 0 };
    }
    return null;
}
/**
 * 1-popup flow: builds both deposit and claim transactions, signs them in a
 * single `signAllTransactions` call (one wallet popup), then sends them
 * sequentially. Only used when a wallet adapter with `signAllTransactions` is
 * available — keypair wallets continue to use the existing multi-step flow.
 */
async function playOnePopup(side, amount, opts = {}) {
    const { noClaim = false, priorityFee, timeout = 120_000 } = opts;
    const walletAdapter = (0, anchor_1.getWalletAdapter)();
    const walletId = typeof walletAdapter.publicKey === 'string'
        ? walletAdapter.publicKey
        : walletAdapter.publicKey.toBase58();
    // 1. Check balance
    const balanceBefore = await (0, anchor_1.getBalance)();
    const cost = totalCost(amount, priorityFee ?? constants_1.DEFAULT_PRIORITY_FEE_SOL);
    if (balanceBefore < cost) {
        throw errors_1.Errors.insufficientBalance(cost, balanceBefore);
    }
    // 2. Resolve stuck state (may require a separate popup if claiming)
    const stuck = await (0, resume_1.detectState)();
    if (stuck.state === 'PENDING_REWARD') {
        (0, logger_1.log)(`Auto-claiming pending reward of ${stuck.rewardSol.toFixed(4)} SOL...`);
        await (0, claim_1.claimReward)();
    }
    else if (stuck.state === 'PENDING_FLIP') {
        (0, logger_1.log)(`Pending flip in escrow — waiting for resolution...`);
        await sleep(3000);
        const state2 = await (0, resume_1.detectState)();
        if (state2.state === 'PENDING_REWARD') {
            await (0, claim_1.claimReward)();
        }
        else if (state2.state !== 'IDLE') {
            throw errors_1.Errors.depositFailed('Previous flip still pending. Try again in a moment or run: dcf play');
        }
    }
    // 3. Generate flip ID client-side
    const flipId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : require('crypto').randomUUID();
    // 4. Build both transactions (unsigned)
    const depositTx = await (0, deposit_2.buildDepositTransaction)(flipId, amount, side, priorityFee);
    const claimTx = await (0, claim_2.buildClaimTransaction)(flipId, amount, side, priorityFee);
    // 5. Sign both at once — 1 POPUP
    (0, logger_1.log)(`Flipping ${side === 'H' ? 'Heads' : 'Tails'} for ${amount} SOL...`);
    const [signedDeposit, signedClaim] = await walletAdapter.signAllTransactions([depositTx, claimTx]);
    // 6. Send deposit
    const connection = (0, anchor_1.getConnection)();
    const depositSig = await connection.sendRawTransaction(signedDeposit.serialize(), { skipPreflight: true });
    await connection.confirmTransaction(depositSig, 'confirmed');
    (0, logger_1.verboseLog)(`Deposit tx: ${depositSig}`);
    // 7. Call /flips/play (no JWT — deposit signature is proof)
    const apiUrl = (0, constants_1.getApiUrl)();
    (0, logger_1.verboseLog)(`POST ${apiUrl}/flips/play`);
    const res = await fetch(`${apiUrl}/flips/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wallet_id: walletId,
            side,
            amount,
            deposit_signature: depositSig,
            flip_id: flipId,
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw errors_1.Errors.apiFailed('flips/play', `${res.status} ${text.slice(0, 200)}`);
    }
    const result = await res.json();
    const flipResult = result?.payload ?? result;
    const won = flipResult?.won === true;
    const payout = won ? amount * 2 : 0;
    // 8. If won, submit pre-signed claim
    let claimTxSig;
    if (won && !noClaim) {
        (0, logger_1.verboseLog)('Won! Submitting pre-signed claim...');
        // Wait for consensus to settle (rewards PDA must be funded)
        await waitForReward(timeout);
        claimTxSig = await connection.sendRawTransaction(signedClaim.serialize(), { skipPreflight: true });
        await connection.confirmTransaction(claimTxSig, 'confirmed');
        (0, logger_1.verboseLog)(`Claim tx: ${claimTxSig}`);
    }
    // 9. Final balance
    const balanceAfter = await (0, anchor_1.getBalance)();
    const fee = round4(amount * constants_1.FEE_PERCENTAGE + constants_1.FLAT_FEE_LAMPORTS / web3_js_1.LAMPORTS_PER_SOL);
    return {
        result: won ? 'WIN' : 'LOSS',
        side,
        bet: amount,
        fee,
        payout,
        profit: won ? amount : -amount,
        balance_before: round4(balanceBefore),
        balance_after: round4(balanceAfter),
        tx: depositSig,
        claim_tx: claimTxSig,
        flip_id: flipId,
        explorer: solscanTx(claimTxSig ?? depositSig),
    };
}
async function play(side, amount, opts = {}) {
    // 1-popup flow for browser wallets with signAllTransactions
    const walletAdapter = (0, anchor_1.getWalletAdapter)();
    if (walletAdapter?.signAllTransactions) {
        return playOnePopup(side, amount, opts);
    }
    // Existing multi-step flow for keypair (0 popups) or adapters without signAll
    const { noClaim = false, priorityFee, timeout = 120_000 } = opts;
    // 1. Auth
    const token = await (0, auth_1.ensureAuth)(getAuthTarget());
    (0, logger_1.verboseLog)('Authenticated');
    // 2. Check balance
    const balanceBefore = await (0, anchor_1.getBalance)();
    const cost = totalCost(amount, priorityFee ?? constants_1.DEFAULT_PRIORITY_FEE_SOL);
    if (balanceBefore < cost) {
        throw errors_1.Errors.insufficientBalance(cost, balanceBefore);
    }
    // 3. Resolve stuck state
    const stuck = await (0, resume_1.detectState)();
    if (stuck.state === 'PENDING_REWARD') {
        (0, logger_1.log)(`Auto-claiming pending reward of ${stuck.rewardSol.toFixed(4)} SOL...`);
        await (0, claim_1.claimReward)();
    }
    else if (stuck.state === 'PENDING_FLIP') {
        (0, logger_1.log)(`Pending flip in escrow — waiting for resolution...`);
        await sleep(3000);
        const state2 = await (0, resume_1.detectState)();
        if (state2.state === 'PENDING_REWARD') {
            await (0, claim_1.claimReward)();
        }
        else if (state2.state !== 'IDLE') {
            throw errors_1.Errors.depositFailed('Previous flip still pending. Try again in a moment or run: dcf play');
        }
    }
    // 4. Create flip (backend)
    (0, logger_1.verboseLog)('Creating flip...');
    const flip = await (0, api_1.createCoinFlip)({ side, amount }, token);
    const flipId = flip?.id ?? '';
    (0, logger_1.verboseLog)(`Flip created: ${flipId}`);
    // 5. Deposit on-chain
    (0, logger_1.log)(`Flipping ${side === 'H' ? 'Heads' : 'Tails'} for ${amount} SOL...`);
    const depositTx = await (0, deposit_1.depositSol)(flipId, amount, side, priorityFee);
    // 6. Process flip (submit signature to backend)
    (0, logger_1.verboseLog)('Submitting deposit signature to backend...');
    const result = await (0, api_1.processCoinFlipWithMemo)(flipId, depositTx, token);
    // 7. Determine outcome
    const won = result?.won === true;
    const payout = won ? amount * 2 : 0;
    // 8. Claim if won
    let claimTx;
    if (won && !noClaim) {
        (0, logger_1.verboseLog)('You won! Claiming reward...');
        await waitForReward(timeout);
        claimTx = await (0, claim_1.claimReward)(flipId, amount, side, priorityFee);
    }
    // 9. Final balance
    const balanceAfter = await (0, anchor_1.getBalance)();
    const fee = round4(amount * constants_1.FEE_PERCENTAGE + constants_1.FLAT_FEE_LAMPORTS / web3_js_1.LAMPORTS_PER_SOL);
    const profit = won ? amount : -amount;
    return {
        result: won ? 'WIN' : 'LOSS',
        side,
        bet: amount,
        fee,
        payout,
        profit,
        balance_before: round4(balanceBefore),
        balance_after: round4(balanceAfter),
        tx: depositTx,
        claim_tx: claimTx,
        flip_id: flipId,
        explorer: solscanTx(claimTx ?? depositTx),
    };
}
async function waitForReward(timeoutMs) {
    const start = Date.now();
    const connection = (0, anchor_1.getConnection)();
    const player = (0, anchor_1.getWallet)().publicKey;
    const [rewardsPda] = await (0, pda_1.findRewardsAccount)(player);
    while (Date.now() - start < timeoutMs) {
        const balance = await connection.getBalance(rewardsPda, 'processed');
        if (balance > 0)
            return;
        await sleep(2000);
    }
    throw errors_1.Errors.timeout(Math.round(timeoutMs / 1000));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
