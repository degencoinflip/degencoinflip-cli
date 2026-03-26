"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DegenCoinFlip = exports.findRewardsAccount = exports.findDegenerateAccount = exports.findHouseState = exports.findHouseTreasury = exports.COLD_HOUSE_ID = exports.INITIALIZER_ID = exports.PROGRAM_ID = exports.FEE_PERCENTAGE = exports.MAX_DEPOSIT_SOL = exports.MIN_DEPOSIT_SOL = exports.resetClients = exports.getProgram = exports.getProvider = exports.getWallet = exports.getConnection = exports.getWalletAdapter = exports.setWalletAdapter = exports.setKeypair = exports.loadKeypair = exports.Errors = exports.DcfError = void 0;
const web3_js_1 = require("@solana/web3.js");
const engine_1 = require("./engine");
const anchor_1 = require("./anchor");
const auth_1 = require("./auth");
const pda_1 = require("./pda");
const constants_1 = require("./constants");
const logger_1 = require("./logger");
// Re-export error class
var errors_1 = require("./errors");
Object.defineProperty(exports, "DcfError", { enumerable: true, get: function () { return errors_1.DcfError; } });
Object.defineProperty(exports, "Errors", { enumerable: true, get: function () { return errors_1.Errors; } });
// Re-export utilities for advanced usage
var anchor_2 = require("./anchor");
Object.defineProperty(exports, "loadKeypair", { enumerable: true, get: function () { return anchor_2.loadKeypair; } });
Object.defineProperty(exports, "setKeypair", { enumerable: true, get: function () { return anchor_2.setKeypair; } });
Object.defineProperty(exports, "setWalletAdapter", { enumerable: true, get: function () { return anchor_2.setWalletAdapter; } });
Object.defineProperty(exports, "getWalletAdapter", { enumerable: true, get: function () { return anchor_2.getWalletAdapter; } });
Object.defineProperty(exports, "getConnection", { enumerable: true, get: function () { return anchor_2.getConnection; } });
Object.defineProperty(exports, "getWallet", { enumerable: true, get: function () { return anchor_2.getWallet; } });
Object.defineProperty(exports, "getProvider", { enumerable: true, get: function () { return anchor_2.getProvider; } });
Object.defineProperty(exports, "getProgram", { enumerable: true, get: function () { return anchor_2.getProgram; } });
Object.defineProperty(exports, "resetClients", { enumerable: true, get: function () { return anchor_2.resetClients; } });
var constants_2 = require("./constants");
Object.defineProperty(exports, "MIN_DEPOSIT_SOL", { enumerable: true, get: function () { return constants_2.MIN_DEPOSIT_SOL; } });
Object.defineProperty(exports, "MAX_DEPOSIT_SOL", { enumerable: true, get: function () { return constants_2.MAX_DEPOSIT_SOL; } });
Object.defineProperty(exports, "FEE_PERCENTAGE", { enumerable: true, get: function () { return constants_2.FEE_PERCENTAGE; } });
Object.defineProperty(exports, "PROGRAM_ID", { enumerable: true, get: function () { return constants_2.PROGRAM_ID; } });
Object.defineProperty(exports, "INITIALIZER_ID", { enumerable: true, get: function () { return constants_2.INITIALIZER_ID; } });
Object.defineProperty(exports, "COLD_HOUSE_ID", { enumerable: true, get: function () { return constants_2.COLD_HOUSE_ID; } });
var pda_2 = require("./pda");
Object.defineProperty(exports, "findHouseTreasury", { enumerable: true, get: function () { return pda_2.findHouseTreasury; } });
Object.defineProperty(exports, "findHouseState", { enumerable: true, get: function () { return pda_2.findHouseState; } });
Object.defineProperty(exports, "findDegenerateAccount", { enumerable: true, get: function () { return pda_2.findDegenerateAccount; } });
Object.defineProperty(exports, "findRewardsAccount", { enumerable: true, get: function () { return pda_2.findRewardsAccount; } });
/**
 * Degen Coin Flip SDK.
 *
 * ```typescript
 * const dcf = new DegenCoinFlip({ keypair });
 * const result = await dcf.play('H', 1.0);
 * ```
 */
class DegenCoinFlip {
    keypair;
    _walletAdapter;
    affiliateId;
    constructor(opts) {
        // Set env vars from options (consumed by anchor.ts, constants.ts)
        if (opts.rpcUrl)
            process.env.DCF_RPC_URL = opts.rpcUrl;
        if (opts.apiUrl)
            process.env.DCF_API_URL = opts.apiUrl;
        if (opts.authority)
            process.env.DCF_AUTHORITY = opts.authority;
        // Reset cached clients first
        (0, anchor_1.resetClients)();
        // Load keypair or wallet adapter
        if (opts.keypair) {
            this.keypair = opts.keypair;
            (0, anchor_1.setKeypair)(this.keypair);
        }
        else if (opts.wallet) {
            // Browser wallet adapter
            (0, anchor_1.setWalletAdapter)(opts.wallet);
            this._walletAdapter = opts.wallet;
        }
        else {
            this.keypair = (0, anchor_1.loadKeypair)();
            (0, anchor_1.setKeypair)(this.keypair);
        }
        this.affiliateId = opts.affiliateId;
    }
    /** Get the wallet public key */
    get walletId() {
        if (this._walletAdapter) {
            const pk = this._walletAdapter.publicKey;
            return typeof pk === 'string' ? pk : pk.toBase58();
        }
        return this.keypair.publicKey.toBase58();
    }
    /**
     * Play a coin flip.
     * Handles everything: auth, state recovery, deposit, wait, claim.
     */
    async play(side, amount, opts) {
        return (0, engine_1.play)(side, amount, {
            noClaim: opts?.noClaim,
            priorityFee: opts?.priorityFee,
            timeout: opts?.timeout,
        });
    }
    /**
     * Preview flip costs without playing.
     */
    async dryRun(side, amount, priorityFee) {
        return (0, engine_1.dryRun)(side, amount, priorityFee);
    }
    /**
     * Check wallet balance and game state.
     */
    async balance() {
        const connection = (0, anchor_1.getConnection)();
        const wallet = (0, anchor_1.getWallet)();
        const player = wallet.publicKey;
        const [rewardsPda] = await (0, pda_1.findRewardsAccount)(player);
        const [degeneratePda] = await (0, pda_1.findDegenerateAccount)(player);
        const [balanceLamports, rewardsLamports, degenerateLamports] = await Promise.all([
            connection.getBalance(player, 'processed'),
            connection.getBalance(rewardsPda, 'processed'),
            connection.getBalance(degeneratePda, 'processed'),
        ]);
        const round4 = (n) => Math.round(n * 10000) / 10000;
        const balanceSol = balanceLamports / web3_js_1.LAMPORTS_PER_SOL;
        const rewardsSol = rewardsLamports / web3_js_1.LAMPORTS_PER_SOL;
        const depositSol = degenerateLamports / web3_js_1.LAMPORTS_PER_SOL;
        const hasPendingReward = rewardsSol >= constants_1.IGNOREABLE_AMOUNT_SOL;
        const hasPendingFlip = depositSol >= constants_1.IGNOREABLE_AMOUNT_SOL;
        const state = hasPendingReward ? 'PENDING_REWARD'
            : hasPendingFlip ? 'PENDING_FLIP'
                : 'IDLE';
        const result = {
            wallet: player.toBase58(),
            balance: round4(balanceSol),
            state,
            ready: !hasPendingFlip,
        };
        if (hasPendingReward) {
            result.pending_reward = round4(rewardsSol);
            result.note = 'Run dcf.play() to auto-claim, or dcf.resume() to claim only';
        }
        if (hasPendingFlip) {
            result.pending_deposit = round4(depositSol);
            result.note = 'Flip in progress — will auto-resolve on next play()';
        }
        return result;
    }
    /**
     * Get flip history.
     */
    async history(opts) {
        const limit = opts?.limit ?? 10;
        const since = opts?.since ?? '24h';
        const token = await (0, auth_1.ensureAuth)(this._walletAdapter || this.keypair);
        const walletId = this.walletId;
        const startTime = parseStartTime(since);
        const endTime = new Date().toISOString();
        const url = `${(0, constants_1.getApiUrl)()}/coinFlips/walletHistory?walletId=${walletId}&startTime=${startTime}&endTime=${endTime}&limit=${limit}`;
        const res = await fetch(url, { headers: { Authorization: token } });
        if (!res.ok)
            throw new Error(`History API failed: ${res.status}`);
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
        return {
            flips: formatted,
            summary: {
                total: formatted.length,
                wins,
                losses,
                net_pnl: Math.round(netPnl * 1000) / 1000,
                win_rate: formatted.length > 0 ? `${Math.round((wins / formatted.length) * 100)}%` : '0%',
            },
        };
    }
    /**
     * Resume any stuck game state.
     */
    async resume() {
        return (0, engine_1.resume)();
    }
    /** Set verbose logging */
    setVerbose(v) { (0, logger_1.setVerbose)(v); }
    /** Set quiet mode */
    setQuiet(q) { (0, logger_1.setQuiet)(q); }
}
exports.DegenCoinFlip = DegenCoinFlip;
// --- Helpers ---
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
