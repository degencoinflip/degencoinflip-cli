"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPriorityFeeEstimate = getPriorityFeeEstimate;
const bs58_1 = __importDefault(require("bs58"));
const constants_1 = require("./constants");
const web3_js_1 = require("@solana/web3.js");
const logger_1 = require("./logger");
async function getPriorityFeeEstimate(transaction, priorityLevel = constants_1.PRIORITY_LEVEL) {
    const rpcUrl = (0, constants_1.getRpcUrl)();
    (0, logger_1.verboseLog)(`Estimating priority fee via Helius...`);
    try {
        const res = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: '1',
                method: 'getPriorityFeeEstimate',
                params: [{
                        transaction: bs58_1.default.encode(transaction.serialize()),
                        options: { priority_level: priorityLevel },
                    }],
            }),
        });
        const data = await res.json();
        const estimate = data?.result?.priorityFeeEstimate ?? 0;
        const effectiveFee = Math.min(estimate, constants_1.MAX_MARKET_LAMPORTS);
        const adjustedSol = effectiveFee / web3_js_1.LAMPORTS_PER_SOL;
        (0, logger_1.verboseLog)(`Priority fee estimate: ${adjustedSol} SOL`);
        return adjustedSol <= 0 ? constants_1.DEFAULT_PRIORITY_FEE_SOL : adjustedSol;
    }
    catch (e) {
        (0, logger_1.verboseLog)(`Priority fee estimation failed, using default`);
        return constants_1.DEFAULT_PRIORITY_FEE_SOL;
    }
}
