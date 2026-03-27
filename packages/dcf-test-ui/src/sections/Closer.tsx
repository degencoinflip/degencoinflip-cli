import React from 'react';

export function Closer() {
  return (
    <section className="section dark closer">
      <span className="section-label">04 / Ship it</span>
      <h1 className="closer-title">Games. Bots. Agents. CLI.</h1>
      <h1 className="closer-title closer-accent">One SDK.</h1>
      <div className="code-block closer-code">
        <div className="code-comment"># install</div>
        <div className="code-line">npm i <span className="code-string">@degencoinflip/sdk</span></div>
        <div className="code-divider" />
        <div className="code-line"><span className="code-keyword">const</span> dcf = <span className="code-keyword">new</span> <span className="code-type">DegenCoinFlip</span>({'{'} wallet {'}'});</div>
        <div className="code-line"><span className="code-keyword">const</span> flip = <span className="code-keyword">await</span> dcf.play(<span className="code-string">'H'</span>, amount);</div>
        <div className="code-line"><span className="code-keyword">if</span> (flip.result === <span className="code-string">'WIN'</span>) doSomethingAmazing();</div>
      </div>
      <div className="closer-links">
        <a href="https://github.com/degencoinflip/degencoinflip-cli" className="closer-github">github.com/degencoinflip/degencoinflip-cli</a>
        <span className="closer-npm">@degencoinflip/sdk</span>
      </div>
      <a href="https://github.com/degencoinflip/degencoinflip-cli" className="closer-cta">Start building</a>
    </section>
  );
}
