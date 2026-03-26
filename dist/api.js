"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonce = getNonce;
exports.authorize = authorize;
exports.getCoinFlip = getCoinFlip;
exports.getCoinFlipById = getCoinFlipById;
exports.createCoinFlip = createCoinFlip;
exports.processCoinFlipWithMemo = processCoinFlipWithMemo;
const constants_1 = require("./constants");
const errors_1 = require("./errors");
const output_1 = require("./output");
async function request(method, path, body, headers = {}) {
    const url = `${(0, constants_1.getApiUrl)()}${path}`;
    (0, output_1.verboseLog)(`${method} ${url}`);
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw errors_1.Errors.apiFailed(`${method} ${path}`, `${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    return json?.payload ?? json?.data?.payload ?? json;
}
// --- Auth ---
async function getNonce(walletId, referral) {
    let path = `/wallets/${walletId}/nonce?x=gn`;
    if (referral?.length)
        path += `&referral=${referral}`;
    return request('GET', path);
}
async function authorize(walletId, signatureBase64) {
    const url = `${(0, constants_1.getApiUrl)()}/authorize`;
    (0, output_1.verboseLog)(`POST ${url}`);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Signature-Encoding': 'base64',
        },
        body: JSON.stringify({ walletId, signature: signatureBase64 }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw errors_1.Errors.authFailed(`${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    return json?.data?.payload ?? json?.payload ?? json;
}
// --- Coin Flip ---
async function getCoinFlip(token) {
    return request('GET', '/coinFlips', undefined, { Authorization: token });
}
async function getCoinFlipById(id, token) {
    return request('GET', `/coinFlips/${id}`, undefined, { Authorization: token });
}
async function createCoinFlip(coinFlip, token) {
    const url = `${(0, constants_1.getApiUrl)()}/coinFlips`;
    const body = JSON.stringify(coinFlip);
    (0, output_1.verboseLog)(`POST ${url} body=${body}`);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        (0, output_1.verboseLog)(`Response ${res.status}: ${text}`);
        throw errors_1.Errors.apiFailed('createCoinFlip', `${res.status} ${text.slice(0, 500)}`);
    }
    const json = await res.json();
    return json?.data?.payload ?? json?.payload ?? json;
}
async function processCoinFlipWithMemo(id, signature, token) {
    const url = `${(0, constants_1.getApiUrl)()}/coinFlips/${id}`;
    (0, output_1.verboseLog)(`POST ${url}`);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token },
        body: JSON.stringify({ signature }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw errors_1.Errors.apiFailed('processCoinFlip', `${res.status} ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    return json?.data?.payload ?? json?.payload ?? json;
}
