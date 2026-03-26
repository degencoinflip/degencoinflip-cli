"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKeypair = setKeypair;
exports.setWalletAdapter = setWalletAdapter;
exports.getWalletAdapter = getWalletAdapter;
exports.loadKeypair = loadKeypair;
exports.getConnection = getConnection;
exports.getWallet = getWallet;
exports.getProvider = getProvider;
exports.getProgram = getProgram;
exports.getBalance = getBalance;
exports.resetClients = resetClients;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
const idl_1 = require("./idl");
const errors_1 = require("./errors");
// Wallet wrapper that signs transactions with a Keypair
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
// Wallet wrapper that delegates signing to a browser wallet adapter (Phantom, Solflare, etc.)
class AdapterWallet {
    payer; // dummy — adapter wallets don't expose keypair
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
        // Anchor's Wallet interface requires a `payer` Keypair, but we never use it for signing.
        // Create a dummy keypair with the correct public key bytes (signing goes through the adapter).
        this.payer = web3_js_1.Keypair.generate(); // unused, adapter signs
    }
    get publicKey() {
        const pk = this.adapter.publicKey;
        return pk instanceof web3_js_1.PublicKey ? pk : new web3_js_1.PublicKey(pk.toBase58());
    }
    async signTransaction(tx) {
        return this.adapter.signTransaction(tx);
    }
    async signAllTransactions(txs) {
        return this.adapter.signAllTransactions(txs);
    }
}
let _connection = null;
let _wallet = null;
let _provider = null;
let _program = null;
let _directKeypair = null;
let _walletAdapter = null;
/** Set a keypair directly (bypasses file loading) */
function setKeypair(kp) {
    _directKeypair = kp;
}
/** Set a browser wallet adapter (Phantom, Solflare, etc.) */
function setWalletAdapter(adapter) {
    _walletAdapter = adapter;
}
/** Get the active wallet adapter, if one was set */
function getWalletAdapter() {
    return _walletAdapter;
}
function loadKeypair(keypairPath) {
    const path = keypairPath
        ?? process.env.DCF_KEYPAIR
        ?? (typeof process !== 'undefined' && process.env?.HOME ? `${process.env.HOME}/.config/solana/id.json` : '');
    if (!path)
        throw errors_1.Errors.noKeypair();
    try {
        const fs = require('fs');
        const raw = fs.readFileSync(path, 'utf-8');
        const secretKey = Uint8Array.from(JSON.parse(raw));
        return web3_js_1.Keypair.fromSecretKey(secretKey);
    }
    catch (e) {
        if (e.code === 'ENOENT' || e.code === 'MODULE_NOT_FOUND')
            throw errors_1.Errors.noKeypair();
        throw errors_1.Errors.noKeypair();
    }
}
function getConnection(rpcUrl) {
    if (!_connection) {
        _connection = new web3_js_1.Connection(rpcUrl ?? (0, constants_1.getRpcUrl)(), 'confirmed');
    }
    return _connection;
}
function getWallet(keypairPath) {
    if (_walletAdapter)
        return _walletAdapter;
    if (!_wallet) {
        const kp = _directKeypair ?? loadKeypair(keypairPath);
        _wallet = new KeypairWallet(kp);
    }
    return _wallet;
}
function getProvider(keypairPath, rpcUrl) {
    if (!_provider) {
        const connection = getConnection(rpcUrl);
        if (_walletAdapter) {
            // Wallet adapter already implements signTransaction — use it directly
            _provider = new anchor_1.AnchorProvider(connection, _walletAdapter, {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
            });
        }
        else {
            const wallet = getWallet(keypairPath);
            _provider = new anchor_1.AnchorProvider(connection, wallet, {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
            });
        }
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
    _walletAdapter = null;
}
