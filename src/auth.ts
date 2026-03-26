import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { getNonce, authorize } from './api';
import { verboseLog } from './output';

const AUTH_DIR = join(process.env.HOME ?? '~', '.config', 'dcf');
const AUTH_FILE = join(AUTH_DIR, 'auth.json');

interface AuthCache {
  [walletId: string]: {
    idToken: string;
    exp: number;
    username: string;
  };
}

function loadCache(): AuthCache {
  try {
    return JSON.parse(readFileSync(AUTH_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(cache: AuthCache) {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });
  writeFileSync(AUTH_FILE, JSON.stringify(cache, null, 2));
}

function isExpired(exp: number): boolean {
  return Date.now() >= exp * 1000 - 60_000; // 1 min buffer
}

/**
 * Get a valid auth token for the given keypair.
 * Auto-authenticates if no cached token or expired.
 */
export async function ensureAuth(keypair: Keypair): Promise<string> {
  const walletId = keypair.publicKey.toBase58();
  const cache = loadCache();
  const cached = cache[walletId];

  if (cached && !isExpired(cached.exp)) {
    verboseLog(`Using cached auth token for ${walletId.slice(0, 8)}...`);
    return cached.idToken;
  }

  verboseLog(`Authenticating wallet ${walletId.slice(0, 8)}...`);

  // Get nonce
  const { nonce } = await getNonce(walletId);

  // Sign nonce with keypair
  const message = `I am signing my one-time nonce: ${nonce}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  const signatureBase64 = Buffer.from(signature).toString('base64');

  // Authorize
  const result = await authorize(walletId, signatureBase64);

  // Cache
  cache[walletId] = {
    idToken: result.idToken,
    exp: result.exp,
    username: result.username,
  };
  saveCache(cache);

  verboseLog(`Authenticated as ${result.username || walletId.slice(0, 8)}`);
  return result.idToken;
}
