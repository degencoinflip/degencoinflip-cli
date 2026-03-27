import React from 'react';

const CARDS = [
  {
    icon: '\u{1F9E9}',
    title: 'Drop-In Components',
    desc: 'Pre-built flip UI. Plug in your wallet, your colors, your logo. Ship same-day.',
  },
  {
    icon: '\u{1F4CA}',
    title: 'Your Dashboard',
    desc: 'Real-time earnings, flip history, player analytics. Know your numbers.',
  },
  {
    icon: '\u{1F4B0}',
    title: 'Automatic Payouts',
    desc: 'Your affiliate cut hits your wallet every flip. No invoices, no waiting, no minimum.',
  },
  {
    icon: '\u{1F3E0}',
    title: 'The House Always Pays',
    desc: 'DCF handles escrow, randomness, and settlement. You never touch player funds.',
  },
];

export function Toolkit() {
  return (
    <section className="section dark">
      <span className="section-label">04</span>

      <h2 className="section-headline-dark">OPEN IN A WEEKEND. RUN FOREVER.</h2>

      <div className="toolkit-grid">
        {CARDS.map((card) => (
          <div className="toolkit-card" key={card.title}>
            <div className="toolkit-icon">{card.icon}</div>
            <div className="toolkit-title">{card.title}</div>
            <div className="toolkit-desc">{card.desc}</div>
          </div>
        ))}
      </div>

      <div className="code-block">
        <div className="code-line">
          <span className="code-keyword">import</span>
          <span> {'{ '}</span>
          <span className="code-type">DegenCoinFlip</span>
          <span>{' }'} </span>
          <span className="code-keyword">from</span>
          <span className="code-string"> '@degencoinflip/sdk'</span>
          <span>;</span>
        </div>
        <div className="code-line">&nbsp;</div>
        <div className="code-line">
          <span className="code-keyword">const</span>
          <span> dcf = </span>
          <span className="code-keyword">new</span>
          <span> </span>
          <span className="code-type">DegenCoinFlip</span>
          <span>{'({'}</span>
        </div>
        <div className="code-line">
          <span>  wallet,</span>
        </div>
        <div className="code-line code-highlight-gold">
          <span>  affiliateId: </span>
          <span className="code-string">'YOUR_WALLET'</span>
          <span>,</span>
        </div>
        <div className="code-line">
          <span>{'});'}</span>
        </div>
        <div className="code-line">&nbsp;</div>
        <div className="code-line">
          <span className="code-keyword">const</span>
          <span> result = </span>
          <span className="code-keyword">await</span>
          <span> dcf.</span>
          <span className="code-type">play</span>
          <span>(</span>
          <span className="code-string">'H'</span>
          <span>, </span>
          <span className="code-type">0.1</span>
          <span>);</span>
        </div>
        <div className="code-line">
          <span>console.</span>
          <span className="code-type">log</span>
          <span>(result.result);  </span>
          <span className="code-comment">{'// \'WIN\' or \'LOSS\''}</span>
        </div>
        <div className="code-line">
          <span>console.</span>
          <span className="code-type">log</span>
          <span>(result.payout);  </span>
          <span className="code-comment">{'// 0.2'}</span>
        </div>
      </div>
    </section>
  );
}
