import React from 'react';
import { useDcf } from './provider';
import { truncateAddress, formatSol } from './utils';

export function HUD() {
  const { state, disconnect } = useDcf();
  const { walletAddress, balance, lastDryRun, isDemo } = state;
  const displayBalance = balance?.balance ?? lastDryRun?.balance ?? 0;

  return (
    <div className="hud">
      <div className="hud-left">
        {isDemo && <span className="hud-badge">DEVNET</span>}
        <span className="hud-balance">{formatSol(displayBalance)} SOL</span>
      </div>
      <div className="hud-right">
        <span className="hud-addr">{walletAddress ? truncateAddress(walletAddress) : ''}</span>
        <button className="hud-disconnect" onClick={disconnect}>×</button>
      </div>
    </div>
  );
}
