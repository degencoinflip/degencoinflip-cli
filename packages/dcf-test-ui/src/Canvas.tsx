import React, { useState, useCallback } from 'react';
import { useDcf } from './provider';
import { Balance } from './Balance';
import { Coin } from './Coin';
import { Amount } from './Amount';
import { History } from './History';
import { solscanTx } from './utils';

const W = 800;
const H = 700;

export function Canvas() {
  const { state, flip } = useDcf();
  const { lastFlip, isFlipping } = state;

  const [side, setSide] = useState<'H' | 'T'>('H');
  const [amount, setAmount] = useState(0.001);

  const toggleSide = useCallback(() => {
    setSide(s => s === 'H' ? 'T' : 'H');
  }, []);

  const handleFlip = useCallback(() => {
    if (isFlipping) return;
    flip(side, amount).catch(() => {});
  }, [flip, side, amount, isFlipping]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100vw', height: '100vh', display: 'block' }}
    >
      {/* Background */}
      <rect width={W} height={H} fill="#fafafa" />

      {/* Balance + wallet info */}
      <Balance x={W / 2} y={60} />

      {/* Coin */}
      <Coin
        x={W / 2}
        y={240}
        side={side}
        onToggleSide={toggleSide}
        onFlip={handleFlip}
      />

      {/* Side labels under coin */}
      <g transform={`translate(${W / 2}, 340)`}>
        <text
          className="clickable"
          textAnchor="end"
          x={-20}
          y={0}
          fontFamily="'Inter', sans-serif"
          fontSize={11}
          fontWeight={side === 'H' ? 600 : 400}
          fill={side === 'H' ? '#111' : '#bbb'}
          letterSpacing="0.05em"
          onClick={() => !isFlipping && setSide('H')}
          style={{ cursor: 'pointer' }}
        >
          HEADS
        </text>
        <text
          className="clickable"
          textAnchor="start"
          x={20}
          y={0}
          fontFamily="'Inter', sans-serif"
          fontSize={11}
          fontWeight={side === 'T' ? 600 : 400}
          fill={side === 'T' ? '#111' : '#bbb'}
          letterSpacing="0.05em"
          onClick={() => !isFlipping && setSide('T')}
          style={{ cursor: 'pointer' }}
        >
          TAILS
        </text>
      </g>

      {/* Amount + cost */}
      <Amount
        x={W / 2}
        y={390}
        amount={amount}
        onAmountChange={setAmount}
        side={side}
      />

      {/* Flip button — rect handles all clicks */}
      <g transform={`translate(${W / 2}, 510)`}>
        <rect
          className="clickable"
          x={-60}
          y={-20}
          width={120}
          height={40}
          rx={8}
          fill={isFlipping ? '#e5e5e5' : '#111'}
          opacity={isFlipping ? 0.5 : 1}
          onClick={handleFlip}
          style={{ cursor: isFlipping ? 'not-allowed' : 'pointer' }}
        />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          y={0}
          fontFamily="'Inter', sans-serif"
          fontSize={13}
          fontWeight={500}
          fill={isFlipping ? '#999' : '#fff'}
          letterSpacing="0.1em"
          style={{ pointerEvents: 'none' }}
        >
          {isFlipping ? 'FLIPPING' : 'FLIP'}
        </text>
      </g>

      {/* Result — show below button after flip */}
      {lastFlip && !isFlipping && (
        <g transform={`translate(${W / 2}, 580)`}>
          <text
            textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace"
            fontSize={36}
            fontWeight={200}
            fill={lastFlip.result === 'WIN' ? '#16a34a' : '#dc2626'}
            y={0}
          >
            {lastFlip.result === 'WIN' ? '+' : ''}{lastFlip.result === 'WIN' ? lastFlip.payout.toFixed(3) : (-lastFlip.bet - lastFlip.fee).toFixed(3)}
          </text>
          <text
            textAnchor="middle"
            fontFamily="'Inter', sans-serif"
            fontSize={11}
            fontWeight={400}
            fill="#999"
            y={24}
          >
            {lastFlip.result === 'WIN' ? 'You won.' : 'You lost.'}
          </text>
          <a href={solscanTx(lastFlip.claim_tx ?? lastFlip.tx)} target="_blank" rel="noopener">
            <text
              textAnchor="middle"
              fontFamily="'Inter', sans-serif"
              fontSize={10}
              fontWeight={400}
              fill="#60a5fa"
              y={42}
              style={{ cursor: 'pointer' }}
            >
              view transaction
            </text>
          </a>
        </g>
      )}

      {/* History trail */}
      <History x={W / 2} y={640} />

      {/* Disclaimer */}
      <text
        textAnchor="middle"
        x={W / 2}
        y={H - 12}
        fontFamily="'Inter', sans-serif"
        fontSize={9}
        fill="#ccc"
        letterSpacing="0.05em"
      >
        burner wallets only
      </text>
    </svg>
  );
}
