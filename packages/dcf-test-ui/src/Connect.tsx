import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Keypair } from '@solana/web3.js';
import { useDcf } from './provider';

// Phantom / Solflare inject onto window
declare global {
  interface Window {
    solana?: any;
    solflare?: any;
  }
}

export function Connect() {
  const { connectKeypair, connectWallet, connectDemo } = useDcf();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragover, setDragover] = useState(false);
  const [hasPhantom, setHasPhantom] = useState(false);
  const [hasSolflare, setHasSolflare] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectStatus, setConnectStatus] = useState('');

  useEffect(() => {
    const check = () => {
      setHasPhantom(!!window.solana?.isPhantom);
      setHasSolflare(!!window.solflare?.isSolflare);
    };
    check();
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleDemo = useCallback(async () => {
    setConnecting(true);
    setConnectStatus('generating burner wallet...');
    try {
      setConnectStatus('airdropping 2 SOL on devnet...');
      await connectDemo();
    } catch (e: any) {
      console.error('Demo connect failed:', e);
    } finally {
      setConnecting(false);
      setConnectStatus('');
    }
  }, [connectDemo]);

  const handlePhantom = useCallback(async () => {
    if (!window.solana?.isPhantom) return;
    setConnecting(true);
    setConnectStatus('connecting phantom...');
    try {
      const resp = await window.solana.connect();
      const adapter = {
        publicKey: resp.publicKey,
        signTransaction: (tx: any) => window.solana.signTransaction(tx),
        signAllTransactions: (txs: any) => window.solana.signAllTransactions(txs),
      };
      // Connect to devnet for testing
      await connectWallet(adapter, 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com', 'https://dev-api.degencoinflip.com/v2', 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8');
    } catch (e: any) {
      console.error('Phantom connect failed:', e);
    } finally {
      setConnecting(false);
      setConnectStatus('');
    }
  }, [connectWallet]);

  const handleSolflare = useCallback(async () => {
    if (!window.solflare?.isSolflare) return;
    setConnecting(true);
    setConnectStatus('connecting solflare...');
    try {
      await window.solflare.connect();
      const adapter = {
        publicKey: window.solflare.publicKey,
        signTransaction: (tx: any) => window.solflare.signTransaction(tx),
        signAllTransactions: (txs: any) => window.solflare.signAllTransactions(txs),
      };
      // Connect to devnet for testing
      await connectWallet(adapter, 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com', 'https://dev-api.degencoinflip.com/v2', 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8');
    } catch (e: any) {
      console.error('Solflare connect failed:', e);
    } finally {
      setConnecting(false);
      setConnectStatus('');
    }
  }, [connectWallet]);

  const handleFile = useCallback(async (file: File) => {
    setConnecting(true);
    setConnectStatus('loading keypair...');
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const secretKey = Uint8Array.from(json);
      const keypair = Keypair.fromSecretKey(secretKey);
      // Connect to devnet by default for testing
      await connectKeypair(keypair, 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com', 'https://dev-api.degencoinflip.com/v2', 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8');
    } catch (e: any) {
      console.error('Keypair load failed:', e);
    } finally {
      setConnecting(false);
      setConnectStatus('');
    }
  }, [connectKeypair]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (connecting) {
    return (
      <div className="connect-overlay">
        <h1>{connectStatus || 'connecting...'}</h1>
      </div>
    );
  }

  return (
    <div className="connect-overlay">
      <h1>degen coin flip</h1>

      {/* Demo mode — one click to try */}
      <button className="connect-btn demo-btn" onClick={handleDemo}>
        Try Demo
        <span className="demo-sub">devnet + airdrop + flip</span>
      </button>

      <span className="connect-divider">or connect wallet</span>

      <div className="connect-buttons">
        <button
          className="connect-btn"
          onClick={handlePhantom}
          disabled={!hasPhantom}
        >
          <span className={`dot ${hasPhantom ? '' : 'unavailable'}`} />
          Phantom
        </button>

        <button
          className="connect-btn"
          onClick={handleSolflare}
          disabled={!hasSolflare}
        >
          <span className={`dot ${hasSolflare ? '' : 'unavailable'}`} />
          Solflare
        </button>
      </div>

      <div
        className={`drop-zone ${dragover ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
      >
        drop keypair.json or click to select
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={onFileSelect}
        />
      </div>

      <div className="disclaimer">burner wallets only</div>
    </div>
  );
}
