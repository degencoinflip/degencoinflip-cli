import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDcf } from '../provider';
import { solscanTx } from '../utils';
import { connectPhantom } from '../components/WalletButton';

const AMOUNTS = [0.001, 0.01, 0.1] as const;

type HighlightedLines = Set<number>;

export function CodeDemo() {
  const { state, flip, dryRun, connectWallet } = useDcf();
  const { isFlipping, lastFlip, sdk } = state;

  const [side, setSide] = useState<'H' | 'T'>('H');
  const [amount, setAmount] = useState<number>(0.001);
  const [showResult, setShowResult] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<HighlightedLines>(new Set());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connected = !!sdk;

  // Show result for 5s after flip completes
  useEffect(() => {
    if (lastFlip && !isFlipping) {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [lastFlip, isFlipping]);

  // Highlight relevant code lines during and after flip
  useEffect(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }

    if (isFlipping) {
      // Highlight the play call (comment + invocation)
      setHighlightedLines(new Set([5, 6]));
    } else if (showResult && lastFlip) {
      // Highlight the result lines (comment + console.logs)
      setHighlightedLines(new Set([8, 9, 10, 11]));
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedLines(new Set());
      }, 5000);
    } else {
      setHighlightedLines(new Set());
    }

    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [isFlipping, showResult, lastFlip]);

  const handleFlip = useCallback(() => {
    if (!connected || isFlipping) return;
    flip(side, amount).catch(() => {});
  }, [connected, isFlipping, flip, side, amount]);

  const handleConnect = useCallback(() => {
    connectPhantom(connectWallet).catch(e => console.error(e));
  }, [connectWallet]);

  const handleDryRun = useCallback(() => {
    if (!connected) return;
    dryRun(side, amount);
  }, [connected, dryRun, side, amount]);

  // Run a dry run when side or amount changes
  useEffect(() => {
    handleDryRun();
  }, [handleDryRun]);

  return (
    <section className="section dark">
      <div className="section-label">THE CODE</div>

      <h2 className="section-headline">3 lines. Any app.</h2>

      <div className="split-screen">
        <CodePanel highlightedLines={highlightedLines} />
        <DemoPanel
          connected={connected}
          side={side}
          setSide={setSide}
          amount={amount}
          setAmount={setAmount}
          isFlipping={isFlipping}
          lastFlip={lastFlip}
          showResult={showResult}
          onFlip={handleFlip}
          onConnect={handleConnect}
        />
      </div>
    </section>
  );
}

// --- Code Panel ---

interface CodePanelProps {
  highlightedLines: HighlightedLines;
}

interface CodeLine {
  num: number;
  tokens: React.ReactNode;
}

function buildCodeLines(): CodeLine[] {
  return [
    {
      num: 1,
      tokens: (
        <>
          <span className="code-keyword">import</span>{' '}
          {'{ '}
          <span className="code-type">DegenCoinFlip</span>
          {' }'} <span className="code-keyword">from</span>{' '}
          <span className="code-string">'@degencoinflip/sdk'</span>;
        </>
      ),
    },
    { num: 2, tokens: '' },
    {
      num: 3,
      tokens: (
        <>
          <span className="code-keyword">const</span> dcf ={' '}
          <span className="code-keyword">new</span>{' '}
          <span className="code-type">DegenCoinFlip</span>
          {'({ wallet });'}
        </>
      ),
    },
    { num: 4, tokens: '' },
    {
      num: 5,
      tokens: <span className="code-comment">// pick a side and amount</span>,
    },
    {
      num: 6,
      tokens: (
        <>
          <span className="code-keyword">const</span> result ={' '}
          <span className="code-keyword">await</span> dcf.play(
          <span className="code-string">'H'</span>,{' '}
          <span className="code-string">0.001</span>);
        </>
      ),
    },
    { num: 7, tokens: '' },
    {
      num: 8,
      tokens: <span className="code-comment">// result</span>,
    },
    {
      num: 9,
      tokens: (
        <>
          console.log(result.result);{'  '}
          <span className="code-comment">// 'WIN' or 'LOSS'</span>
        </>
      ),
    },
    {
      num: 10,
      tokens: (
        <>
          console.log(result.payout);{'  '}
          <span className="code-comment">// 0.002</span>
        </>
      ),
    },
    {
      num: 11,
      tokens: (
        <>
          console.log(result.tx);{'      '}
          <span className="code-comment">// 'solscan.io/tx/...'</span>
        </>
      ),
    },
  ];
}

function CodePanel({ highlightedLines }: CodePanelProps) {
  const lines = buildCodeLines();

  return (
    <div className="code-panel">
      <pre>
        <code>
          {lines.map((line) => (
            <div
              key={line.num}
              className={`code-line ${highlightedLines.has(line.num) ? 'code-highlight' : ''}`}
            >
              {line.tokens || '\u00A0'}
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// --- Demo Panel ---

interface DemoPanelProps {
  connected: boolean;
  side: 'H' | 'T';
  setSide: (s: 'H' | 'T') => void;
  amount: number;
  setAmount: (a: number) => void;
  isFlipping: boolean;
  lastFlip: { result: string; payout: number; bet: number; fee: number; tx: string; claim_tx?: string } | null;
  showResult: boolean;
  onFlip: () => void;
  onConnect: () => void;
}

const COIN_IMG = 'https://d3omtvnlh9xgzy.cloudfront.net/core/logo-default.png';
const FLIP_BTN_IMG = 'https://d3omtvnlh9xgzy.cloudfront.net/buttons/double-or-nothing.png';

function DemoPanel({
  connected,
  side,
  setSide,
  amount,
  setAmount,
  isFlipping,
  lastFlip,
  showResult,
  onFlip,
  onConnect,
}: DemoPanelProps) {
  return (
    <div className="demo-panel">
      <div className="demo-content">
        {/* Coin image */}
        <div className={`demo-coin ${isFlipping ? 'flipping' : ''}`}>
          <img src={COIN_IMG} alt="DCF" width={120} height={120} />
        </div>

        {/* Side picker */}
        <div className="demo-side-picker">
          <button
            className={`demo-side-btn ${side === 'H' ? 'active' : ''}`}
            onClick={() => !isFlipping && setSide('H')}
            disabled={isFlipping}
          >
            HEADS
          </button>
          <button
            className={`demo-side-btn ${side === 'T' ? 'active' : ''}`}
            onClick={() => !isFlipping && setSide('T')}
            disabled={isFlipping}
          >
            TAILS
          </button>
        </div>

        {/* Amount display + quick picks */}
        <div className="demo-amount-section">
          <div className="demo-amount-display">{amount} SOL</div>
          <div className="demo-quick-picks">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                className={`demo-quick-pick ${amount === a ? 'active' : ''}`}
                onClick={() => !isFlipping && setAmount(a)}
                disabled={isFlipping}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Flip button — branded */}
        {connected ? (
          <button
            className="demo-flip-btn-img"
            onClick={onFlip}
            disabled={isFlipping}
          >
            <img src={FLIP_BTN_IMG} alt={isFlipping ? 'Flipping...' : 'Flip'} />
          </button>
        ) : (
          <button className="demo-connect-btn" onClick={onConnect}>Select Wallet</button>
        )}

        {/* Result area */}
        {showResult && lastFlip && !isFlipping && (
          <div className="demo-result">
            <div className={`demo-result-text ${lastFlip.result === 'WIN' ? 'result-win' : 'result-loss'}`}>
              {lastFlip.result === 'WIN'
                ? `YOU WON +${lastFlip.payout.toFixed(3)} SOL`
                : `YOU LOST -${(lastFlip.bet + lastFlip.fee).toFixed(3)} SOL`}
            </div>
            <a
              className="demo-solscan"
              href={solscanTx(lastFlip.claim_tx ?? lastFlip.tx)}
              target="_blank"
              rel="noopener noreferrer"
            >
              view on solscan →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
