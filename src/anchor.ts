import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, LAMPORTS_PER_SOL, VersionedTransaction, Transaction } from '@solana/web3.js';
import { readFileSync } from 'fs';
import { PROGRAM_ID, getRpcUrl } from './constants';
import { IDL } from './idl';
import { Errors } from './errors';

// Wallet wrapper that actually signs transactions with the Keypair
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

let _connection: Connection | null = null;
let _wallet: KeypairWallet | null = null;
let _provider: AnchorProvider | null = null;
let _program: Program | null = null;

export function loadKeypair(keypairPath?: string): Keypair {
  const path = keypairPath
    ?? process.env.DCF_KEYPAIR
    ?? `${process.env.HOME}/.config/solana/id.json`;

  try {
    const raw = readFileSync(path, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(raw));
    return Keypair.fromSecretKey(secretKey);
  } catch (e: any) {
    if (e.code === 'ENOENT') throw Errors.noKeypair();
    throw new Error(`Failed to load keypair from ${path}: ${e.message}`);
  }
}

export function getConnection(rpcUrl?: string): Connection {
  if (!_connection) {
    _connection = new Connection(rpcUrl ?? getRpcUrl(), 'confirmed');
  }
  return _connection;
}

export function getWallet(keypairPath?: string): KeypairWallet {
  if (!_wallet) {
    _wallet = new KeypairWallet(loadKeypair(keypairPath));
  }
  return _wallet;
}

export function getProvider(keypairPath?: string, rpcUrl?: string): AnchorProvider {
  if (!_provider) {
    const connection = getConnection(rpcUrl);
    const wallet = getWallet(keypairPath);
    _provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    });
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
}
