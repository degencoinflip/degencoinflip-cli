import React, { useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useD3 } from './useD3';
import { useDcf } from './provider';

interface CoinProps {
  x: number;
  y: number;
  side: 'H' | 'T';
  onToggleSide: () => void;
  onFlip: () => void;
}

export function Coin({ x, y, side, onToggleSide, onFlip }: CoinProps) {
  const { state } = useDcf();
  const { isFlipping, lastFlip } = state;

  // Result display: show payout on coin for 3s after flip
  const [showResult, setShowResult] = useState(false);

  const ref = useD3((g) => {
    const R = 80;

    // Outer ring — click to toggle side
    const ring = g.selectAll<SVGCircleElement, null>('.coin-ring').data([null]);
    ring.enter()
      .append('circle')
      .attr('class', 'coin-ring clickable')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', R)
      .attr('fill', 'none')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 2)
      .on('click', () => {
        if (!isFlipping) onToggleSide();
      })
      .merge(ring)
      .transition()
      .duration(200)
      .attr('stroke', isFlipping ? '#bbb' : '#ddd');

    // Inner circle — click to flip
    const inner = g.selectAll<SVGCircleElement, null>('.coin-inner').data([null]);
    inner.enter()
      .append('circle')
      .attr('class', 'coin-inner clickable')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', R - 15)
      .attr('fill', '#fff')
      .attr('stroke', '#e5e5e5')
      .attr('stroke-width', 1)
      .on('click', () => {
        if (!isFlipping) onFlip();
      })
      .on('mouseover', function () {
        if (!isFlipping) d3.select(this).transition().duration(150).attr('fill', '#f5f5f5');
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('fill', '#fff');
      })
      .merge(inner);

    // Coin face text
    const faceText = g.selectAll<SVGTextElement, null>('.coin-face').data([null]);
    const faceEnter = faceText.enter()
      .append('text')
      .attr('class', 'coin-face clickable')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('pointer-events', 'none');

    const faceMerge = faceEnter.merge(faceText);

    if (isFlipping) {
      faceMerge
        .attr('font-size', 24)
        .attr('font-weight', 200)
        .attr('fill', '#bbb')
        .text('...');

      g.transition()
        .duration(300)
        .attr('transform', `translate(${x}, ${y}) scale(0.95, 1)`)
        .transition()
        .duration(200)
        .attr('transform', `translate(${x}, ${y}) scale(1.02, 0.98)`)
        .transition()
        .duration(200)
        .attr('transform', `translate(${x}, ${y}) scale(0.98, 1.02)`)
        .transition()
        .duration(300)
        .attr('transform', `translate(${x}, ${y}) scale(1, 1)`);

    } else if (showResult && lastFlip) {
      const won = lastFlip.result === 'WIN';
      const amount = won ? lastFlip.payout : -(lastFlip.bet + lastFlip.fee);
      const sign = won ? '+' : '';
      faceMerge
        .attr('font-size', 22)
        .attr('font-weight', 300)
        .attr('fill', won ? '#16a34a' : '#dc2626')
        .text(`${sign}${amount.toFixed(3)}`);

      ring.transition().duration(400).attr('stroke', won ? '#16a34a' : '#dc2626');
    } else {
      faceMerge
        .attr('font-size', 40)
        .attr('font-weight', 200)
        .attr('fill', '#111')
        .text(side);
    }
  }, [side, isFlipping, lastFlip, showResult, x, y, onToggleSide, onFlip]);

  React.useEffect(() => {
    if (lastFlip && !isFlipping) {
      setShowResult(true);
      const timer = setTimeout(() => setShowResult(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastFlip, isFlipping]);

  return <g ref={ref} transform={`translate(${x}, ${y})`} />;
}
