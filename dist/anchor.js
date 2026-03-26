"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadKeypair = loadKeypair;
exports.getConnection = getConnection;
exports.getWallet = getWallet;
exports.getProvider = getProvider;
exports.getProgram = getProgram;
exports.getBalance = getBalance;
exports.resetClients = resetClients;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const fs_1 = require("fs");
const constants_1 = require("./constants");
const idl_1 = require("./idl");
const errors_1 = require("./errors");
// Wallet wrapper that actually signs transactions with the Keypair
class KeypairWallet {
    payer;
    constructor(payer) {
        this.payer = payer;
    }
    get publicKey() { return this.payer.publicKey; }
    async signTransaction(tx) {
        if (tx instanceof web3_js_1.VersionedTransaction) {
            tx.sign([this.payer]);
        }
        else if (tx instanceof web3_js_1.Transaction) {
            tx.partialSign(this.payer);
        }
        return tx;
    }
    async signAllTransactions(txs) {
        for (const tx of txs) {
            await this.signTransaction(tx);
        }
        return txs;
    }
}
let _connection = null;
let _wallet = null;
let _provider = null;
let _program = null;
function loadKeypair(keypairPath) {
    const path = keypairPath
        ?? process.env.DCF_KEYPAIR
        ?? `${process.env.HOME}/.config/solana/id.json`;
    try {
        const raw = (0, fs_1.readFileSync)(path, 'utf-8');
        const secretKey = Uint8Array.from(JSON.parse(raw));
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    }
    catch (e) {
        if (e.code === 'ENOENT')
            throw errors_1.Errors.noKeypair();
        throw new Error(`Failed to load keypair from ${path}: ${e.message}`);
    }
}
function getConnection(rpcUrl) {
    if (!_connection) {
        _connection = new web3_js_1.Connection(rpcUrl ?? (0, constants_1.getRpcUrl)(), 'confirmed');
    }
    return _connection;
}
function getWallet(keypairPath) {
    if (!_wallet) {
        _wallet = new KeypairWallet(loadKeypair(keypairPath));
    }
    return _wallet;
}
function getProvider(keypairPath, rpcUrl) {
    if (!_provider) {
        const connection = getConnection(rpcUrl);
        const wallet = getWallet(keypairPath);
        _provider = new anchor_1.AnchorProvider(connection, wallet, {
            commitment: 'confirmed',
            preflightCommitment: 'confirmed',
        });
    }
    return _provider;
}
function getProgram(keypairPath, rpcUrl) {
    if (!_program) {
        const provider = getProvider(keypairPath, rpcUrl);
        _program = new anchor_1.Program(idl_1.IDL, constants_1.PROGRAM_ID, provider);
    }
    return _program;
}
async function getBalance(keypairPath, rpcUrl) {
    const connection = getConnection(rpcUrl);
    const wallet = getWallet(keypairPath);
    const balance = await connection.getBalance(wallet.publicKey, 'processed');
    return balance / web3_js_1.LAMPORTS_PER_SOL;
}
// Reset cached instances (for testing or config changes)
function resetClients() {
    _connection = null;
    _wallet = null;
    _provider = null;
    _program = null;
}
