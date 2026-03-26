import bs58 from 'bs58';
import { VersionedTransaction } from '@solana/web3.js';
import { getRpcUrl, PRIORITY_LEVEL, MAX_MARKET_LAMPORTS, DEFAULT_PRIORITY_FEE_SOL } from './constants';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { verboseLog } from './logger';

export async function getPriorityFeeEstimate(
  transaction: VersionedTransaction,
  priorityLevel: string = PRIORITY_LEVEL,
): Promise<number> {
  const rpcUrl = getRpcUrl();
  verboseLog(`Estimating priority fee via Helius...`);

  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getPriorityFeeEstimate',
        params: [{
          transaction: bs58.encode(transaction.serialize()),
          options: { priority_level: priorityLevel },
        }],
      }),
    });

    const data = await res.json();
    const estimate = data?.result?.priorityFeeEstimate ?? 0;
    const effectiveFee = Math.min(estimate, MAX_MARKET_LAMPORTS);
    const adjustedSol = effectiveFee / LAMPORTS_PER_SOL;

    verboseLog(`Priority fee estimate: ${adjustedSol} SOL`);
    return adjustedSol <= 0 ? DEFAULT_PRIORITY_FEE_SOL : adjustedSol;
  } catch (e) {
    verboseLog(`Priority fee estimation failed, using default`);
    return DEFAULT_PRIORITY_FEE_SOL;
  }
}
