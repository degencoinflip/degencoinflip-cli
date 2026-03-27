import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDcf } from '../provider';
import { truncateAddress } from '../utils';

// Phantom injects onto window
declare global {
  interface Window {
    solana?: any;
  }
}

export const DEVNET_RPC = 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com';
export const DEVNET_API = 'https://dev-api.degencoinflip.com/v2';
export const DEVNET_AUTHORITY = 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8';

/** Shared Phantom connect helper */
export async function connectPhantom(connectWallet: any) {
  if (!window.solana?.isPhantom) {
    window.open('https://phantom.app/', '_blank');
    return;
  }
  const resp = await window.solana.connect();
  const adapter = {
    publicKey: resp.publicKey,
    signTransaction: (tx: any) => window.solana.signTransaction(tx),
    signAllTransactions: (txs: any) => window.solana.signAllTransactions(txs),
  };
  await connectWallet(adapter, DEVNET_RPC, DEVNET_API, DEVNET_AUTHORITY);
}

export function WalletButton() {
  const { state, connectWallet, disconnect } = useDcf();
  const [showDropdown, setShowDropdown] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      window.open('https://phantom.app/', '_blank');
      return;
    }

    setConnecting(true);
    try {
      const resp = await window.solana.connect();
      const adapter = {
        publicKey: resp.publicKey,
        signTransaction: (tx: any) => window.solana.signTransaction(tx),
        signAllTransactions: (txs: any) => window.solana.signAllTransactions(txs),
      };
      await connectWallet(adapter, DEVNET_RPC, DEVNET_API, DEVNET_AUTHORITY);
    } catch (e: any) {
      console.error('Phantom connect failed:', e);
    } finally {
      setConnecting(false);
    }
  }, [connectWallet]);

  const handleClick = useCallback(() => {
    if (state.sdk && state.walletAddress) {
      setShowDropdown((prev) => !prev);
    } else {
      handleConnect();
    }
  }, [state.sdk, state.walletAddress, handleConnect]);

  const handleDisconnect = useCallback(() => {
    setShowDropdown(false);
    disconnect();
  }, [disconnect]);

  const isConnected = !!state.sdk && !!state.walletAddress;
  const displayBalance = (state.balance?.balance ?? state.lastDryRun?.balance ?? 0).toFixed(4);

  return (
    <>
      <button ref={buttonRef} className="wallet-btn" onClick={handleClick} disabled={connecting}>
        <span className={`wallet-dot ${isConnected ? '' : 'disconnected'}`} />
        {connecting
          ? 'Connecting...'
          : isConnected
            ? <>
                <span className="wallet-balance">{displayBalance} SOL</span>
                <span className="wallet-sep">·</span>
                {truncateAddress(state.walletAddress!)}
              </>
            : 'Connect'}
      </button>
      {showDropdown && isConnected && (
        <div ref={dropdownRef} className="wallet-dropdown">
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      )}
    </>
  );
}
