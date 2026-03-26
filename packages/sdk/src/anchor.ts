import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction, Transaction } from '@solana/web3.js';
import { PROGRAM_ID, getRpcUrl } from './constants';
import { IDL } from './idl';
import { Errors } from './errors';
import type { WalletAdapter } from './types';

// Wallet wrapper that signs transactions with a Keypair
class KeypairWallet implements Wallet {
  constructor(readonly payer: Keypair) {}
  get publicKey() { return this.payer.publicKey; }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (tx instanceof VersionedTransaction) {
      tx.sign([this.payer]);
    } else if (tx instanceof Transaction) {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    for (const tx of txs) {
      await this.signTransaction(tx);
    }
    return txs;
  }
}

// Wallet wrapper that delegates signing to a browser wallet adapter (Phantom, Solflare, etc.)
class AdapterWallet implements Wallet {
  readonly payer: Keypair; // dummy — adapter wallets don't expose keypair
  private readonly adapter: WalletAdapter;

  constructor(adapter: WalletAdapter) {
    this.adapter = adapter;
    // Anchor's Wallet interface requires a `payer` Keypair, but we never use it for signing.
    // Create a dummy keypair with the correct public key bytes (signing goes through the adapter).
    this.payer = Keypair.generate(); // unused, adapter signs
  }

  get publicKey(): PublicKey {
    const pk = this.adapter.publicKey;
    return pk instanceof PublicKey ? pk : new PublicKey(pk.toBase58());
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    return this.adapter.signTransaction(tx);
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    return this.adapter.signAllTransactions(txs);
  }
}

let _connection: Connection | null = null;
let _wallet: Wallet | null = null;
let _provider: AnchorProvider | null = null;
let _program: Program | null = null;
let _directKeypair: Keypair | null = null;
let _walletAdapter: any = null;

/** Set a keypair directly (bypasses file loading) */
export function setKeypair(kp: Keypair) {
  _directKeypair = kp;
}

/** Set a browser wallet adapter (Phantom, Solflare, etc.) */
export function setWalletAdapter(adapter: any) {
  _walletAdapter = adapter;
}

/** Get the active wallet adapter, if one was set */
export function getWalletAdapter(): any {
  return _walletAdapter;
}

export function loadKeypair(keypairPath?: string): Keypair {
  const path = keypairPath
    ?? process.env.DCF_KEYPAIR
    ?? (typeof process !== 'undefined' && process.env?.HOME ? `${process.env.HOME}/.config/solana/id.json` : '');

  if (!path) throw Errors.noKeypair();

  try {
    const fs = require('fs');
    const raw = fs.readFileSync(path, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(secretKey);
  } catch (e: any) {
    if (e.code === 'ENOENT' || e.code === 'MODULE_NOT_FOUND') throw Errors.noKeypair();
    throw Errors.noKeypair();
  }
}

export function getConnection(rpcUrl?: string): Connection {
  if (!_connection) {
    _connection = new Connection(rpcUrl ?? getRpcUrl(), 'confirmed');
  }
  return _connection;
}

export function getWallet(keypairPath?: string): any {
  if (_walletAdapter) return _walletAdapter;
  if (!_wallet) {
    const kp = _directKeypair ?? loadKeypair(keypairPath);
    _wallet = new KeypairWallet(kp);
  }
  return _wallet;
}

export function getProvider(keypairPath?: string, rpcUrl?: string): AnchorProvider {
  if (!_provider) {
    const connection = getConnection(rpcUrl);
    if (_walletAdapter) {
      // Wallet adapter already implements signTransaction — use it directly
      _provider = new AnchorProvider(connection, _walletAdapter as any, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });
    } else {
      const wallet = getWallet(keypairPath);
      _provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      });
    }
  }
  return _provider;
}

export function getProgram(keypairPath?: string, rpcUrl?: string): Program {
  if (!_program) {
    const provider = getProvider(keypairPath, rpcUrl);
    _program = new Program(IDL as any, PROGRAM_ID, provider);
  }
  return _program;
}

export async function getBalance(keypairPath?: string, rpcUrl?: string): Promise<number> {
  const connection = getConnection(rpcUrl);
  const wallet = getWallet(keypairPath);
  const balance = await connection.getBalance(wallet.publicKey, 'processed');
  return balance / LAMPORTS_PER_SOL;
}

// Reset cached instances (for testing or config changes)
export function resetClients() {
  _connection = null;
  _wallet = null;
  _provider = null;
  _program = null;
  _walletAdapter = null;
}
