import React from 'react';
import * as d3 from 'd3';
import { useD3 } from './useD3';
import { useDcf } from './provider';

interface HistoryProps {
  x: number;
  y: number;
}

export function History({ x, y }: HistoryProps) {
  const { state } = useDcf();
  const { history } = state;
  const flips = history?.flips?.slice(0, 5) ?? [];

  const ref = useD3((g) => {
    // Summary line
    const summary = history?.summary;
    const sumText = g.selectAll<SVGTextElement, null>('.summary').data([null]);
    sumText.enter()
      .append('text')
      .attr('class', 'summary')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 11)
      .attr('font-weight', 300)
      .attr('fill', '#999')
      .merge(sumText)
      .text(summary && summary.total > 0
        ? `${summary.wins}W · ${summary.losses}L · ${summary.win_rate} · ${summary.net_pnl >= 0 ? '+' : ''}${summary.net_pnl.toFixed(3)} SOL`
        : '');

    // Flip entries
    type FlipEntry = { time: string; side: string; bet: number; result: string; payout: number; _key: string };
    const data: FlipEntry[] = flips.map((f, i) => ({ ...f, _key: `${f.time}-${f.side}-${i}` }));

    const entries = g.selectAll<SVGTextElement, FlipEntry>('.flip-entry')
      .data(data, (d) => d._key);

    // Enter
    entries.enter()
      .append('text')
      .attr('class', 'flip-entry')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 10)
      .attr('font-weight', 300)
      .attr('opacity', 0)
      .attr('y', (_, i) => 24 + i * 18 + 5)
      .merge(entries)
      .transition()
      .duration(400)
      .delay((_, i) => i * 50)
      .attr('y', (_, i) => 24 + i * 18)
      .attr('opacity', (_, i) => 1 - i * 0.12)
      .attr('fill', d => d.result === 'WIN' ? '#16a34a' : '#dc2626')
      .text(d => {
        const payout = d.result === 'WIN' ? `+${d.payout.toFixed(3)}` : `-${d.bet.toFixed(3)}`;
        return `${d.time}  ${d.side}  ${d.bet.toFixed(3)}  ${d.result}  ${payout}`;
      });

    // Exit
    entries.exit()
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .remove();

  }, [flips, history]);

  return <g ref={ref} transform={`translate(${x}, ${y})`} />;
}
