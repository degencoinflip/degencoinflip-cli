import React, { useState, useCallback, useEffect } from 'react';
import { useDcf } from '../provider';
import { solscanTx } from '../utils';
import { connectPhantom } from '../components/WalletButton';

interface HeroCoinProps {
  connected: boolean;
}

const HERO_AMOUNT = 0.001;
const COIN_IMG = 'https://d3omtvnlh9xgzy.cloudfront.net/core/logo-default.png';

export function HeroCoin({ connected }: HeroCoinProps) {
  const { state, flip, connectWallet } = useDcf();
  const { isFlipping, lastFlip } = state;

  const [side, setSide] = useState<'H' | 'T'>('H');
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (lastFlip && !isFlipping) {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastFlip, isFlipping]);

  const handleFlip = useCallback(() => {
    if (!connected || isFlipping) return;
    flip(side, HERO_AMOUNT).catch(() => {});
  }, [connected, isFlipping, flip, side]);

  const handleConnect = useCallback(() => {
    connectPhantom(connectWallet).catch(e => console.error(e));
  }, [connectWallet]);

  return (
    <section className="section hero-section">
      <div className="hero-tagline-top">#1 MOST TRUSTED PLACE TO FLIP</div>

      <div className="hero-coin-wrapper">
        <div
          className={`hero-coin-img ${isFlipping ? 'flipping' : ''}`}
          onClick={connected ? handleFlip : handleConnect}
          style={{ cursor: 'pointer' }}
        >
          <img src={COIN_IMG} alt="DCF Coin" width={200} height={200} />
        </div>

        {/* Side toggle */}
        <div className="hero-side-toggle">
          <button
            className={`hero-side-btn ${side === 'H' ? 'active' : ''}`}
            onClick={() => !isFlipping && setSide('H')}
            disabled={isFlipping}
          >
            HEADS
          </button>
          <button
            className={`hero-side-btn ${side === 'T' ? 'active' : ''}`}
            onClick={() => !isFlipping && setSide('T')}
            disabled={isFlipping}
          >
            TAILS
          </button>
        </div>

        <div className="hero-amount">{HERO_AMOUNT} SOL</div>

        {!connected ? (
          <button className="hero-connect-btn" onClick={handleConnect}>
            Select Wallet
          </button>
        ) : (
          <button
            className="hero-flip-btn"
            onClick={handleFlip}
            disabled={isFlipping}
          >
            <img src="https://d3omtvnlh9xgzy.cloudfront.net/buttons/double-or-nothing.png" alt="Flip" />
          </button>
        )}

        {showResult && lastFlip && !isFlipping && (
          <div className="hero-result">
            <div className={`hero-result-text ${lastFlip.result === 'WIN' ? 'result-win' : 'result-loss'}`}>
              {lastFlip.result === 'WIN'
                ? `YOU WON +${lastFlip.payout.toFixed(3)} SOL`
                : `YOU LOST -${(lastFlip.bet + lastFlip.fee).toFixed(3)} SOL`}
            </div>
            <a
              className="hero-solscan"
              href={solscanTx(lastFlip.claim_tx ?? lastFlip.tx)}
              target="_blank"
              rel="noopener noreferrer"
            >
              view on solscan →
            </a>
          </div>
        )}
      </div>

      <div className="hero-tagline">click the coin. real SOL moves.</div>

      {/* Scroll indicator */}
      <div className="hero-scroll-hint">↓ scroll to see the SDK</div>
    </section>
  );
}
