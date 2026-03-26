import React from 'react';

export function Closer() {
  return (
    <section className="section dark closer">
      <span className="section-label">05</span>
      <h1 className="closer-title">OPEN YOUR DOORS</h1>

      <div className="closer-steps">
        <div className="closer-step">
          <span className="closer-step-num">1</span>
          <code>npm i @degencoinflip/sdk</code>
        </div>
        <div className="closer-step">
          <span className="closer-step-num">2</span>
          <code>affiliateWallet: 'YOUR_WALLET'</code>
        </div>
        <div className="closer-step">
          <span className="closer-step-num">3</span>
          <span>Every flip. Automatically.</span>
        </div>
      </div>

      <a href="https://github.com/degencoinflip/degencoinflip-cli" className="closer-cta">Start Building</a>

      <div className="closer-links">
        <a href="https://github.com/degencoinflip/degencoinflip-cli">GitHub</a>
        <a href="https://discord.gg/degencoinflip">Discord</a>
      </div>

      <div className="closer-final">Free to integrate. You earn when your players flip. That's the whole deal.</div>
    </section>
  );
}
