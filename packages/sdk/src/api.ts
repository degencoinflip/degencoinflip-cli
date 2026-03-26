import { getApiUrl } from './constants';
import { Errors } from './errors';
import { verboseLog } from './logger';

async function request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<any> {
  const url = `${getApiUrl()}${path}`;
  verboseLog(`${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Errors.apiFailed(`${method} ${path}`, `${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.payload ?? json?.data?.payload ?? json;
}

// --- Auth ---

export async function getNonce(walletId: string, referral?: string): Promise<{ nonce: string }> {
  let path = `/wallets/${walletId}/nonce?x=gn`;
  if (referral?.length) path += `&referral=${referral}`;
  return request('GET', path);
}

export async function authorize(walletId: string, signatureBase64: string): Promise<{
  username: string;
  idToken: string;
  exp: number;
  status: string;
}> {
  const url = `${getApiUrl()}/authorize`;
  verboseLog(`POST ${url}`);

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
    throw Errors.authFailed(`${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.data?.payload ?? json?.payload ?? json;
}

// --- Coin Flip ---

export async function getCoinFlip(token: string): Promise<any> {
  return request('GET', '/coinFlips', undefined, { Authorization: token });
}

export async function getCoinFlipById(id: string, token: string): Promise<any> {
  return request('GET', `/coinFlips/${id}`, undefined, { Authorization: token });
}

export async function createCoinFlip(
  coinFlip: { side: string; amount: number; mode?: string; isMobile?: boolean },
  token: string,
): Promise<any> {
  const url = `${getApiUrl()}/coinFlips`;
  const body = JSON.stringify(coinFlip);
  verboseLog(`POST ${url} body=${body}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '(no body)');
    verboseLog(`Response ${res.status}: ${text}`);
    throw Errors.apiFailed('createCoinFlip', `${res.status} ${text.slice(0, 500)}`);
  }

  const json = await res.json();
  return json?.data?.payload ?? json?.payload ?? json;
}

export async function processCoinFlipWithMemo(id: string, signature: string, token: string): Promise<any> {
  const url = `${getApiUrl()}/coinFlips/${id}`;
  verboseLog(`POST ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ signature }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Errors.apiFailed('processCoinFlip', `${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.data?.payload ?? json?.payload ?? json;
}
