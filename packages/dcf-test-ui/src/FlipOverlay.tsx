import React, { useState, useCallback } from 'react';
import { useDcf } from './provider';
import { formatSol } from './utils';

interface FlipOverlayProps {
  onClose: () => void;
}

export function FlipOverlay({ onClose }: FlipOverlayProps) {
  const { state, flip, dryRun } = useDcf();
  const { isFlipping, lastFlip, lastDryRun } = state;

  const [side, setSide] = useState<'H' | 'T'>('H');
  const [amount, setAmount] = useState(0.001);

  const handleFlip = useCallback(() => {
    if (isFlipping) return;
    flip(side, amount).catch(() => {});
  }, [flip, side, amount, isFlipping]);

  // Trigger dryRun on mount and changes
  React.useEffect(() => {
    const timer = setTimeout(() => dryRun(side, amount), 200);
    return () => clearTimeout(timer);
  }, [side, amount, dryRun]);

  const showResult = lastFlip && !isFlipping;

  return (
    <div className="flip-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !isFlipping) onClose();
    }}>
      <div className="flip-modal">
        <div className="flip-header">
          <span>🪙 COIN TABLE</span>
          <button className="flip-close" onClick={onClose} disabled={isFlipping}>ESC</button>
        </div>

        {showResult ? (
          <div className="flip-result">
            <div className={`flip-result-amount ${lastFlip.result === 'WIN' ? 'win' : 'loss'}`}>
              {lastFlip.result === 'WIN' ? '+' : ''}{lastFlip.result === 'WIN' ? formatSol(lastFlip.payout, 3) : formatSol(-(lastFlip.bet + lastFlip.fee), 3)}
            </div>
            <div className="flip-result-label">
              {lastFlip.result === 'WIN' ? 'You won!' : 'You lost.'}
            </div>
            <button className="flip-btn" onClick={onClose}>Walk away</button>
          </div>
        ) : (
          <>
            <div className="flip-sides">
              <button
                className={`flip-side ${side === 'H' ? 'active' : ''}`}
                onClick={() => setSide('H')}
                disabled={isFlipping}
              >
                HEADS
              </button>
              <button
                className={`flip-side ${side === 'T' ? 'active' : ''}`}
                onClick={() => setSide('T')}
                disabled={isFlipping}
              >
                TAILS
              </button>
            </div>

            <div className="flip-amount-section">
              <div className="flip-amount-display">
                {formatSol(amount, 3)} SOL
              </div>
              <div className="flip-quickpicks">
                {[0.001, 0.01, 0.1, 0.5, 1].map(v => (
                  <button
                    key={v}
                    className={`flip-qp ${Math.abs(v - amount) < 0.0001 ? 'active' : ''}`}
                    onClick={() => setAmount(v)}
                    disabled={isFlipping}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {lastDryRun && (
              <div className="flip-cost">
                total: {formatSol(lastDryRun.total_cost, 3)} · win: {formatSol(lastDryRun.potential_win, 3)}
              </div>
            )}

            <button
              className="flip-btn primary"
              onClick={handleFlip}
              disabled={isFlipping}
            >
              {isFlipping ? 'FLIPPING...' : 'FLIP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
