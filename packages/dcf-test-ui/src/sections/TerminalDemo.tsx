import React, { useState, useEffect, useRef, useCallback } from 'react';

interface TerminalLine {
  text: string;
  type: 'command' | 'output' | 'json' | 'blank';
  delay: number;
}

const LINES: TerminalLine[] = [
  { text: '$ npm install @degencoinflip/sdk', type: 'command', delay: 400 },
  { text: '\u2713 added 5 packages', type: 'output', delay: 600 },
  { text: '', type: 'blank', delay: 400 },
  { text: '$ node', type: 'command', delay: 300 },
  { text: "> const { DegenCoinFlip } = require('@degencoinflip/sdk')", type: 'command', delay: 200 },
  { text: '> const dcf = new DegenCoinFlip({ keypair })', type: 'command', delay: 200 },
  { text: "> const result = await dcf.play('H', 0.001)", type: 'command', delay: 800 },
  { text: '', type: 'blank', delay: 200 },
  { text: '{', type: 'json', delay: 100 },
  { text: "  result: 'WIN',", type: 'json', delay: 100 },
  { text: "  side: 'H',", type: 'json', delay: 100 },
  { text: '  bet: 0.001,', type: 'json', delay: 100 },
  { text: '  payout: 0.002,', type: 'json', delay: 100 },
  { text: "  tx: '4xK2mN...9mPq',", type: 'json', delay: 100 },
  { text: "  explorer: 'https://solscan.io/tx/4xK2mN...9mPq'", type: 'json', delay: 100 },
  { text: '}', type: 'json', delay: 400 },
  { text: '', type: 'blank', delay: 200 },
  { text: '> ', type: 'command', delay: 0 },
];

const CHAR_SPEED = 50;

function colorizeJsonLine(text: string): React.ReactNode {
  const keyValueMatch = text.match(/^(\s*)([\w]+)(:\s*)(.+?)(,?)$/);
  if (keyValueMatch) {
    const [, indent, key, sep, value, comma] = keyValueMatch;
    return (
      <>
        <span>{indent}</span>
        <span className="td-json-key">{key}</span>
        <span>{sep}</span>
        <span className="td-json-value">{value}</span>
        <span>{comma}</span>
      </>
    );
  }
  return <span className="td-json-brace">{text}</span>;
}

export function TerminalDemo() {
  const [renderedLines, setRenderedLines] = useState<
    { text: string; type: string; typed: string }[]
  >([]);
  const [hasCompleted, setHasCompleted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cancelRef = useRef(false);
  const animatingRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, []);

  const runAnimation = useCallback(async () => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    cancelRef.current = false;
    setRenderedLines([]);
    setHasCompleted(false);

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        if (ms <= 0) { resolve(); return; }
        const id = setTimeout(resolve, ms);
        const check = setInterval(() => {
          if (cancelRef.current) {
            clearTimeout(id);
            clearInterval(check);
            resolve();
          }
        }, 50);
      });

    for (let i = 0; i < LINES.length; i++) {
      if (cancelRef.current) break;

      const line = LINES[i];

      if (line.type === 'command') {
        const chars = line.text.split('');
        setRenderedLines((prev) => [...prev, { text: line.text, type: line.type, typed: '' }]);
        scrollToBottom();

        for (let c = 0; c < chars.length; c++) {
          if (cancelRef.current) break;
          const partial = chars.slice(0, c + 1).join('');
          setRenderedLines((prev) => {
            const next = [...prev];
            next[next.length - 1] = { text: line.text, type: line.type, typed: partial };
            return next;
          });
          scrollToBottom();
          await sleep(CHAR_SPEED);
        }
      } else {
        setRenderedLines((prev) => [
          ...prev,
          { text: line.text, type: line.type, typed: line.text },
        ]);
        scrollToBottom();
      }

      if (line.delay > 0 && !cancelRef.current) {
        await sleep(line.delay);
      }
    }

    if (!cancelRef.current) {
      setHasCompleted(true);
    }
    animatingRef.current = false;
  }, [scrollToBottom]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            runAnimation();
          } else {
            cancelRef.current = true;
            animatingRef.current = false;
            setRenderedLines([]);
            setHasCompleted(false);
          }
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [runAnimation]);

  return (
    <section ref={sectionRef} className="section">
      <span className="section-label">03 / The Terminal</span>

      <div className="td-window">
        <div className="terminal-header">
          <span className="terminal-dot red" />
          <span className="terminal-dot yellow" />
          <span className="terminal-dot green" />
        </div>
        <div className="td-body" ref={bodyRef}>
          {renderedLines.map((line, i) => {
            const isLast = i === renderedLines.length - 1;
            const showCursor = isLast && !hasCompleted;

            if (line.type === 'blank') {
              return <div key={i} className="terminal-line">&nbsp;</div>;
            }

            if (line.type === 'json') {
              return (
                <div key={i} className="terminal-line td-line-json">
                  {colorizeJsonLine(line.typed)}
                </div>
              );
            }

            if (line.type === 'output') {
              return (
                <div key={i} className="terminal-line terminal-output">
                  {line.typed}
                </div>
              );
            }

            return (
              <div key={i} className="terminal-line terminal-input">
                {line.typed}
                {showCursor && <span className="terminal-cursor" />}
              </div>
            );
          })}
          {hasCompleted && (
            <div className="terminal-line terminal-input">
              {'> '}
              <span className="terminal-cursor" />
            </div>
          )}
        </div>
      </div>

      <p className="td-tagline">
        real SOL &middot; real blockchain &middot; 2 seconds
      </p>
    </section>
  );
}
