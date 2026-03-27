import React from 'react';

interface StatCard {
  number: string;
  label: string;
}

const STATS: StatCard[] = [
  { number: '47,229', label: 'SOL FLIPPED' },
  { number: '142', label: 'PARTNER SITES' },
  { number: '1,247', label: 'SOL PAID TO AFFILIATES' },
];

export function NetworkProof() {
  return (
    <section className="section">
      <h2 className="np-headline">THE NETWORK IS ALREADY FLIPPING</h2>

      <div className="np-cards">
        {STATS.map((stat) => (
          <div className="np-card" key={stat.label}>
            <div className="np-card-number">{stat.number}</div>
            <div className="np-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <p className="np-footnote">
        These are real affiliate payouts. On-chain and verifiable.
      </p>
    </section>
  );
}
