'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DegenCoinFlip } from '../../../sdk/src/index';
import type { FlipResult } from '../../../sdk/src/types';

type Side = 'H' | 'T';
type Phase = 'idle' | 'flipping' | 'result';

const RPC_URL = 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com';
const API_URL = 'https://dev-api.degencoinflip.com/v2';
const DEVNET_AUTHORITY = 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8';

export function FlipCard() {
  const wallet = useWallet();
  const { publicKey, connected, signTransaction, signAllTransactions, signMessage } = wallet;
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [side, setSide] = useState<Side>('H');
  const [amount, setAmount] = useState('0.001');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<FlipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dcfRef = useRef<DegenCoinFlip | null>(null);

  useEffect(() => {
    if (connected && publicKey && signTransaction && signMessage) {
      dcfRef.current = new DegenCoinFlip({
        wallet: {
          publicKey,
          signTransaction: signTransaction as any,
          signAllTransactions: signAllTransactions as any,
          signMessage,
        },
        rpcUrl: RPC_URL,
        apiUrl: API_URL,
        authority: DEVNET_AUTHORITY,
      });
    } else {
      dcfRef.current = null;
    }
  }, [connected, publicKey, signTransaction, signAllTransactions, signMessage]);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    const bal = await connection.getBalance(publicKey);
    setBalance(bal / LAMPORTS_PER_SOL);
  }, [publicKey, connection]);

  useEffect(() => {
    refreshBalance();
    if (!publicKey) return;
    (window as any).__dcf_pubkey = publicKey.toBase58();
    const id = connection.onAccountChange(publicKey, (acc) => {
      setBalance(acc.lamports / LAMPORTS_PER_SOL);
    });
    return () => { connection.removeAccountChangeListener(id); };
  }, [publicKey, connection, refreshBalance]);

  const handleFlip = async () => {
    if (!dcfRef.current) return;
    setPhase('flipping');
    setResult(null);
    setError(null);

    try {
      const flipResult = await dcfRef.current.play(side, parseFloat(amount));
      setResult(flipResult);
      setPhase('result');
      refreshBalance();
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setPhase('idle');
    }
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setError(null);
  };

  const bet = parseFloat(amount) || 0;
  const canFlip = connected && dcfRef.current && bet >= 0.001 && bet <= 32 && (balance ?? 0) >= bet;

  if (!connected) {
    return (
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-wide mb-2">dcf</h1>
          <p className="text-black/60 text-sm font-light">connect wallet to play</p>
        </div>
        <WalletMultiButton style={{
          background: 'black',
          color: 'white',
          borderRadius: '12px',
          fontWeight: 500,
          fontSize: '14px',
          height: '44px',
          padding: '0 24px',
        }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] bg-white border border-black/10 rounded-2xl shadow-xl shadow-black/5 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-lg font-light tracking-wide">dcf</h1>
        <div className="text-right">
          <div className="text-sm font-light text-black/60">
            {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
          </div>
          <div className="text-sm font-light">
            {balance !== null ? `${balance.toFixed(4)} SOL` : '—'}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-light">
          {error}
        </div>
      )}

      {/* Flipping */}
      {phase === 'flipping' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border border-black/15 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '1.5s' }}>
            <div className="w-1 h-1 bg-black rounded-full" />
          </div>
          <p className="mt-6 text-sm font-light text-black/60">flipping on-chain...</p>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && result && (
        <div className="flex flex-col items-center py-12">
          <div className={`text-5xl font-extralight tracking-wider mb-4 ${result.result === 'WIN' ? 'text-emerald-600' : 'text-black/40'}`}>
            {result.result}
          </div>

          {result.result === 'WIN' && (
            <div className="text-lg font-light text-emerald-600 mb-2">
              +{result.payout} SOL
            </div>
          )}

          <div className="text-xs text-black/50 mb-4">
            {result.side === 'H' ? 'heads' : 'tails'} · {result.bet} SOL
          </div>

          {result.tx && (
            <a
              href={`https://solscan.io/tx/${result.claim_tx || result.tx}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-black/40 hover:text-black/60 transition-colors mb-8"
            >
              view on solscan
            </a>
          )}

          <button
            onClick={reset}
            className="w-full py-3 bg-black text-white text-sm font-medium rounded-xl hover:bg-black/90 transition-colors"
          >
            again
          </button>
        </div>
      )}

      {/* Idle */}
      {phase === 'idle' && (
        <div className="flex flex-col gap-6">
          <div className="flex gap-2">
            {(['H', 'T'] as Side[]).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  side === s
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black/60 hover:bg-black/10'
                }`}
              >
                {s === 'H' ? 'heads' : 'tails'}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.001"
              min="0.001"
              max="32"
              className="w-full bg-black/5 border border-black/10 rounded-xl py-3 px-4 text-sm font-light text-black placeholder-black/20 focus:outline-none focus:border-black/30 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0.001"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-black/40 font-light">
              SOL
            </span>
          </div>

          <div className="flex gap-1.5">
            {['0.001', '0.01', '0.1', '0.5'].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  amount === a
                    ? 'bg-black/15 text-black/80'
                    : 'bg-black/5 text-black/50 hover:bg-black/10'
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <button
            onClick={handleFlip}
            disabled={!canFlip}
            className="w-full py-3.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-black/90 disabled:bg-black/10 disabled:text-black/40 transition-all duration-200"
          >
            flip
          </button>

          <p className="text-center text-[11px] text-black/40 font-light">
            3.5% fee · devnet · real on-chain flips
          </p>
        </div>
      )}
    </div>
  );
}
