"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAuth = ensureAuth;
const api_1 = require("./api");
const logger_1 = require("./logger");
// In-memory auth cache (works in both Node and browser)
const memoryCache = {};
function loadCache() {
    // Try filesystem cache (Node.js only)
    try {
        const fs = require('fs');
        const { join } = require('path');
        const authFile = join(process.env.HOME ?? '~', '.config', 'dcf', 'auth.json');
        return JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    }
    catch {
        // Browser or file not found — use memory cache
        return { ...memoryCache };
    }
}
function saveCache(cache) {
    // Always update memory cache
    Object.assign(memoryCache, cache);
    // Try filesystem (Node.js only, silently skip in browser)
    try {
        const fs = require('fs');
        const { join } = require('path');
        const authDir = join(process.env.HOME ?? '~', '.config', 'dcf');
        const authFile = join(authDir, 'auth.json');
        if (!fs.existsSync(authDir))
            fs.mkdirSync(authDir, { recursive: true });
        fs.writeFileSync(authFile, JSON.stringify(cache, null, 2));
    }
    catch {
        // Browser — memory cache only
    }
}
function isExpired(exp) {
    return Date.now() >= exp * 1000 - 60_000; // 1 min buffer
}
/**
 * Get a valid auth token.
 * Accepts either a Keypair (CLI/agents) or a WalletAdapter (browser wallets).
 */
async function ensureAuth(keypairOrWallet) {
    // Determine wallet ID
    const walletId = keypairOrWallet.publicKey
        ? (typeof keypairOrWallet.publicKey === 'string'
            ? keypairOrWallet.publicKey
            : keypairOrWallet.publicKey.toBase58())
        : keypairOrWallet.publicKey?.toBase58();
    const cache = loadCache();
    const cached = cache[walletId];
    if (cached && !isExpired(cached.exp)) {
        (0, logger_1.verboseLog)(`Using cached auth token for ${walletId.slice(0, 8)}...`);
        return cached.idToken;
    }
    (0, logger_1.verboseLog)(`Authenticating wallet ${walletId.slice(0, 8)}...`);
    const { nonce } = await (0, api_1.getNonce)(walletId);
    const message = `I am signing my one-time nonce: ${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    let signatureBase64;
    if (keypairOrWallet.secretKey) {
        // Keypair — sign with nacl
        const nacl = require('tweetnacl');
        const signature = nacl.sign.detached(messageBytes, keypairOrWallet.secretKey);
        signatureBase64 = Buffer.from(signature).toString('base64');
    }
    else if (keypairOrWallet.signMessage) {
        // Wallet adapter — use signMessage
        const signed = await keypairOrWallet.signMessage(messageBytes);
        const sigBytes = signed.signature || signed;
        signatureBase64 = (typeof Buffer !== 'undefined')
            ? Buffer.from(sigBytes).toString('base64')
            : btoa(String.fromCharCode(...sigBytes));
    }
    else {
        throw new Error('Wallet must support signMessage for authentication');
    }
    const result = await (0, api_1.authorize)(walletId, signatureBase64);
    cache[walletId] = {
        idToken: result.idToken,
        exp: result.exp,
        username: result.username,
    };
    saveCache(cache);
    (0, logger_1.verboseLog)(`Authenticated as ${result.username || walletId.slice(0, 8)}`);
    return result.idToken;
}
