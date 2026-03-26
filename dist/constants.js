"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_API_URL = exports.IGNOREABLE_AMOUNT_SOL = exports.PRIORITY_LEVEL = exports.MAX_MARKET_LAMPORTS = exports.DEFAULT_PRIORITY_FEE_SOL = exports.MAX_DEPOSIT_SOL = exports.MIN_DEPOSIT_SOL = exports.FLAT_FEE_LAMPORTS = exports.FEE_PERCENTAGE = exports.SEEDS = exports.DEFAULT_AUTHORITY = exports.MEMO_PROGRAM_ID = exports.COLD_HOUSE_ID = exports.INITIALIZER_ID = exports.PROGRAM_ID = void 0;
exports.getAuthorityId = getAuthorityId;
exports.getApiUrl = getApiUrl;
exports.getRpcUrl = getRpcUrl;
const web3_js_1 = require("@solana/web3.js");
// Program
exports.PROGRAM_ID = new web3_js_1.PublicKey('BmjJ85zsP2xHPesBKpmHYKt136gzeTtNbeVDcdfybHHT');
// Key accounts
exports.INITIALIZER_ID = new web3_js_1.PublicKey('h2oMkkgUF55mxMFeuUgVYwvEnpV5kRbvHVuDWMKDYFC');
exports.COLD_HOUSE_ID = new web3_js_1.PublicKey('i821bbVqQguuDLQp72gNWd52KBXBcEAQc4sVtZxWk4n');
exports.MEMO_PROGRAM_ID = new web3_js_1.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
// Default authority (overridable via DCF_AUTHORITY env var)
exports.DEFAULT_AUTHORITY = 'modn84SAs1ccUAmxtmRY85yPz44qixgGrUwi276WYy1';
function getAuthorityId() {
    return new web3_js_1.PublicKey(process.env.DCF_AUTHORITY ?? exports.DEFAULT_AUTHORITY);
}
// PDA seed strings
exports.SEEDS = {
    HOUSE_TREASURY: 'house_treasury',
    HOUSE_STATE: 'house_state',
    DEGENERATE: 'degenerate',
    REWARDS: 'rewards',
};
// Fee constants (match on-chain lib.rs)
exports.FEE_PERCENTAGE = 0.035;
exports.FLAT_FEE_LAMPORTS = 10_000;
exports.MIN_DEPOSIT_SOL = 0.001;
exports.MAX_DEPOSIT_SOL = 32;
// Priority fee defaults
exports.DEFAULT_PRIORITY_FEE_SOL = 0.0001;
exports.MAX_MARKET_LAMPORTS = 500_000;
exports.PRIORITY_LEVEL = 'VERYHIGH';
// Thresholds
exports.IGNOREABLE_AMOUNT_SOL = 0.001;
// API
exports.DEFAULT_API_URL = 'https://api.degencoinflip.com/v2';
function getApiUrl() {
    return process.env.DCF_API_URL ?? exports.DEFAULT_API_URL;
}
function getRpcUrl() {
    return process.env.DCF_RPC_URL ?? process.env.REACT_APP_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
}
