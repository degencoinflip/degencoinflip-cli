"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFormat = setFormat;
exports.setQuiet = setQuiet;
exports.setVerbose = setVerbose;
exports.isVerbose = isVerbose;
exports.output = output;
exports.outputPlay = outputPlay;
exports.outputDryRun = outputDryRun;
exports.outputResume = outputResume;
exports.outputBalance = outputBalance;
exports.outputHistory = outputHistory;
exports.log = log;
exports.verboseLog = verboseLog;
let explicitFormat = null;
let quiet = false;
let verbose = false;
function setFormat(f) { explicitFormat = f; }
function setQuiet(q) { quiet = q; }
function setVerbose(v) { verbose = v; }
function isVerbose() { return verbose; }
function shouldUseHuman() {
    if (quiet)
        return false;
    if (explicitFormat === 'json' || explicitFormat === 'compact')
        return false;
    if (explicitFormat === 'table')
        return true;
    // Default to human. Only use JSON if explicitly piped (isTTY === false)
    if (process.stdout.isTTY === false)
        return false;
    return true;
}
function getJsonMode() {
    if (explicitFormat === 'compact' || quiet)
        return 'compact';
    return 'pretty';
}
// --- Generic output (fallback) ---
function output(data) {
    if (shouldUseHuman()) {
        outputKeyValue(data);
    }
    else {
        outputJson(data);
    }
}
function outputJson(data) {
    if (getJsonMode() === 'compact') {
        console.log(JSON.stringify(data));
    }
    else {
        console.log(JSON.stringify(data, null, 2));
    }
}
function outputKeyValue(data) {
    const maxKeyLen = Math.max(...Object.keys(data).map(k => k.length));
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null)
            continue;
        console.log(`  ${key.padEnd(maxKeyLen)}  ${value}`);
    }
}
function outputPlay(data) {
    if (shouldUseHuman()) {
        console.log('');
        console.log(`  ${data.result}  →  ${data.balance_after} SOL`);
        console.log('');
    }
    else {
        outputJson(data);
    }
}
function outputDryRun(data) {
    if (shouldUseHuman()) {
        console.log('');
        console.log('  Dry run — no SOL spent');
        console.log('');
        console.log(`  Bet         ${data.bet} SOL`);
        console.log(`  Fee         ${data.fee} SOL`);
        console.log(`  Priority    ${data.priority_fee} SOL`);
        console.log(`  Total cost  ${data.total_cost} SOL`);
        console.log(`  If you win  ${data.potential_win} SOL`);
        console.log(`  Balance     ${data.balance} SOL ${data.can_play ? '✓' : '✗ insufficient'}`);
        console.log('');
    }
    else {
        outputJson(data);
    }
}
function outputResume(data) {
    if (shouldUseHuman()) {
        if (!data.resumed) {
            console.log('');
            console.log('  No stuck state — ready to play');
            console.log('  dcf play H 1');
            console.log('');
        }
        else {
            console.log('');
            console.log('  Recovered stuck flip');
            console.log('');
            console.log(`  Previous state  ${data.previous_state}`);
            console.log(`  Result          ${data.result}`);
            if (data.payout)
                console.log(`  Claimed         ${data.payout} SOL`);
            if (data.claim_tx)
                console.log(`  Tx              https://solscan.io/tx/${data.claim_tx}`);
            console.log('');
        }
    }
    else {
        outputJson(data);
    }
}
function outputBalance(data) {
    if (shouldUseHuman()) {
        const stateLabel = data.state === 'IDLE' ? 'IDLE — ready to play'
            : data.state === 'PENDING_REWARD' ? `PENDING_REWARD — ${data.pending_reward} SOL to claim`
                : `PENDING_FLIP — ${data.pending_deposit} SOL in escrow`;
        console.log('');
        console.log(`  Wallet   ${data.wallet}`);
        console.log(`  Balance  ${data.balance} SOL`);
        console.log(`  State    ${stateLabel}`);
        if (data.note)
            console.log(`  Hint     ${data.note}`);
        console.log('');
    }
    else {
        outputJson(data);
    }
}
function outputHistory(data) {
    if (shouldUseHuman()) {
        console.log('  TIME       SIDE  BET      RESULT  PAYOUT');
        for (const f of data.flips) {
            const time = f.time.padEnd(9);
            const side = f.side.padEnd(4);
            const bet = String(f.bet).padEnd(7);
            const result = f.result.padEnd(6);
            const payout = String(f.payout);
            console.log(`  ${time}  ${side}  ${bet}  ${result}  ${payout}`);
        }
        const s = data.summary;
        const pnlStr = s.net_pnl >= 0 ? `+${s.net_pnl}` : `${s.net_pnl}`;
        console.log('');
        console.log(`  ${s.total} flips | ${s.wins}W ${s.losses}L | ${pnlStr} SOL | ${s.win_rate}`);
    }
    else {
        outputJson(data);
    }
}
// --- Logging (always stderr) ---
function log(msg) {
    if (!quiet)
        console.error(msg);
}
function verboseLog(msg) {
    if (verbose && !quiet)
        console.error(`[verbose] ${msg}`);
}
