"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuth = ensureAuth;
const fs_1 = require("fs");
const path_1 = require("path");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const api_1 = require("./api");
const output_1 = require("./output");
const AUTH_DIR = (0, path_1.join)(process.env.HOME ?? '~', '.config', 'dcf');
const AUTH_FILE = (0, path_1.join)(AUTH_DIR, 'auth.json');
function loadCache() {
    try {
        return JSON.parse((0, fs_1.readFileSync)(AUTH_FILE, 'utf-8'));
    }
    catch {
        return {};
    }
}
function saveCache(cache) {
    if (!(0, fs_1.existsSync)(AUTH_DIR))
        (0, fs_1.mkdirSync)(AUTH_DIR, { recursive: true });
    (0, fs_1.writeFileSync)(AUTH_FILE, JSON.stringify(cache, null, 2));
}
function isExpired(exp) {
    return Date.now() >= exp * 1000 - 60_000; // 1 min buffer
}
/**
 * Get a valid auth token for the given keypair.
 * Auto-authenticates if no cached token or expired.
 */
async function ensureAuth(keypair) {
    const walletId = keypair.publicKey.toBase58();
    const cache = loadCache();
    const cached = cache[walletId];
    if (cached && !isExpired(cached.exp)) {
        (0, output_1.verboseLog)(`Using cached auth token for ${walletId.slice(0, 8)}...`);
        return cached.idToken;
    }
    (0, output_1.verboseLog)(`Authenticating wallet ${walletId.slice(0, 8)}...`);
    // Get nonce
    const { nonce } = await (0, api_1.getNonce)(walletId);
    // Sign nonce with keypair
    const message = `I am signing my one-time nonce: ${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = tweetnacl_1.default.sign.detached(messageBytes, keypair.secretKey);
    const signatureBase64 = Buffer.from(signature).toString('base64');
    // Authorize
    const result = await (0, api_1.authorize)(walletId, signatureBase64);
    // Cache
    cache[walletId] = {
        idToken: result.idToken,
        exp: result.exp,
        username: result.username,
    };
    saveCache(cache);
    (0, output_1.verboseLog)(`Authenticated as ${result.username || walletId.slice(0, 8)}`);
    return result.idToken;
}
