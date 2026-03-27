import React, { useState, useEffect } from 'react';

const SKINS = [
  {
    name: 'NeonFlip',
    bg: '#0a0014',
    accent: '#ff2d92',
    accent2: '#00e5ff',
    coinBg: '#1a0028',
    coinBorder: '#ff2d92',
    btnBg: '#ff2d92',
    btnText: '#fff',
    text: '#fff',
    secondary: '#ff2d9288',
    font: "'JetBrains Mono', monospace",
  },
  {
    name: 'CoinHaus',
    bg: '#ffffff',
    accent: '#111',
    accent2: '#666',
    coinBg: '#f5f5f5',
    coinBorder: '#ddd',
    btnBg: '#111',
    btnText: '#fff',
    text: '#111',
    secondary: '#999',
    font: "'Inter', sans-serif",
  },
  {
    name: 'FlipGod',
    bg: '#1a1200',
    accent: '#ffd700',
    accent2: '#ffaa00',
    coinBg: '#2a1e00',
    coinBorder: '#ffd700',
    btnBg: '#ffd700',
    btnText: '#000',
    text: '#ffd700',
    secondary: '#ffd70088',
    font: "'JetBrains Mono', monospace",
  },
  {
    name: 'SolFlips',
    bg: '#0f0f1a',
    accent: '#8b5cf6',
    accent2: '#6d28d9',
    coinBg: '#1a1a2e',
    coinBorder: '#8b5cf6',
    btnBg: '#8b5cf6',
    btnText: '#fff',
    text: '#e2e8f0',
    secondary: '#8b5cf688',
    font: "'Inter', sans-serif",
  },
];

export default function UIGallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % SKINS.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    if (index === activeIndex) return;
    setFade(false);
    setTimeout(() => {
      setActiveIndex(index);
      setFade(true);
    }, 300);
  };

  const skin = SKINS[activeIndex];

  return (
    <section className="section dark">
      <span className="section-label">04</span>
      <h2 className="section-headline-gold">YOUR BRAND. YOUR RULES.</h2>

      {/* Mockup card */}
      <div
        className="gallery-card"
        style={{
          background: skin.bg,
          fontFamily: skin.font,
          opacity: fade ? 1 : 0,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 2, color: skin.secondary, textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>
          {skin.name}
        </div>

        {/* Coin */}
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: skin.coinBg,
            border: `2px solid ${skin.coinBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 22,
            fontWeight: 700,
            color: skin.accent,
          }}
        >
          H
        </div>

        {/* Heads / Tails toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: skin.accent,
              borderBottom: `2px solid ${skin.accent}`,
              paddingBottom: 4,
            }}
          >
            HEADS
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: skin.secondary,
              paddingBottom: 4,
            }}
          >
            TAILS
          </span>
        </div>

        {/* Amount */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 600,
            color: skin.text,
            marginBottom: 20,
          }}
        >
          0.1 SOL
        </div>

        {/* Flip button */}
        <button
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 0',
            borderRadius: 8,
            border: 'none',
            background: skin.btnBg,
            color: skin.btnText,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 1,
            cursor: 'pointer',
            fontFamily: skin.font,
          }}
        >
          FLIP
        </button>

        {/* Result text */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 16,
            fontSize: 14,
            fontWeight: 600,
            color: skin.accent,
          }}
        >
          WIN +0.2
        </div>
      </div>

      {/* Dots */}
      <div className="gallery-dots">
        {SKINS.map((_, i) => (
          <button
            key={i}
            className={`gallery-dot${i === activeIndex ? ' active' : ''}`}
            onClick={() => handleDotClick(i)}
            aria-label={`Show ${SKINS[i].name} skin`}
          />
        ))}
      </div>

      <p className="gallery-tagline">
        Same SDK. Same escrow. Same on-chain randomness. Your personality.
      </p>
    </section>
  );
}
