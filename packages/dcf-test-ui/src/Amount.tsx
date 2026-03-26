import React, { useRef, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { useD3 } from './useD3';
import { useDcf } from './provider';
import { formatSol } from './utils';

interface AmountProps {
  x: number;
  y: number;
  amount: number;
  onAmountChange: (amount: number) => void;
  side: 'H' | 'T';
}

// Log scale: fine control at low end
const amountScale = d3.scaleLog().domain([0.001, 32]).range([0, 400]).clamp(true);

const QUICK_PICKS = [0.1, 0.5, 1, 5, 10, 32];

export function Amount({ x, y, amount, onAmountChange, side }: AmountProps) {
  const { state, dryRun } = useDcf();
  const { lastDryRun, isFlipping } = state;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced dryRun
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dryRun(side, amount);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [amount, side, dryRun]);

  const ref = useD3((g) => {
    // --- Amount display (draggable) ---
    const amtText = g.selectAll<SVGTextElement, null>('.amt-value').data([null]);
    const amtEnter = amtText.enter()
      .append('text')
      .attr('class', 'amt-value draggable')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 20)
      .attr('font-weight', 300)
      .attr('fill', '#111');

    const amtMerge = amtEnter.merge(amtText);
    amtMerge.text(`${formatSol(amount, 3)} SOL`);

    // Drag behavior on amount text
    const dragBehavior = d3.drag<SVGTextElement, null>()
      .on('drag', (event) => {
        if (isFlipping) return;
        const currentPx = amountScale(amount);
        const newPx = currentPx + event.dx;
        const newAmount = amountScale.invert(newPx);
        const snapped = Math.round(newAmount * 1000) / 1000;
        const clamped = Math.max(0.001, Math.min(32, snapped));
        onAmountChange(clamped);
      });

    amtMerge.call(dragBehavior as any);

    // --- "drag to change" hint ---
    const hintText = g.selectAll<SVGTextElement, null>('.amt-hint').data([null]);
    hintText.enter()
      .append('text')
      .attr('class', 'amt-hint')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 22)
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', 9)
      .attr('font-weight', 400)
      .attr('fill', '#bbb')
      .attr('letter-spacing', '0.05em')
      .text('drag to change');

    // --- Total cost ---
    const costText = g.selectAll<SVGTextElement, null>('.cost').data([null]);
    costText.enter()
      .append('text')
      .attr('class', 'cost')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 46)
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 11)
      .attr('font-weight', 300)
      .attr('fill', '#999')
      .merge(costText)
      .text(lastDryRun
        ? `total: ${formatSol(lastDryRun.total_cost, 3)}  ·  win: ${formatSol(lastDryRun.potential_win, 3)}`
        : '');

    // --- Quick pick buttons ---
    const picks = g.selectAll<SVGGElement, number>('.qp')
      .data(QUICK_PICKS, (d) => String(d));

    const pickEnter = picks.enter()
      .append('g')
      .attr('class', 'qp clickable');

    const totalWidth = QUICK_PICKS.length * 50;
    const startX = -totalWidth / 2 + 25;

    pickEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 11)
      .attr('font-weight', 400)
      .on('click', (_event, d) => {
        if (!isFlipping) onAmountChange(d);
      })
      .on('mouseover', function () { d3.select(this).attr('fill', '#111'); })
      .on('mouseout', function (_, d) {
        d3.select(this).attr('fill', Math.abs(d - amount) < 0.001 ? '#111' : '#bbb');
      });

    pickEnter.merge(picks)
      .attr('transform', (_, i) => `translate(${startX + i * 50}, 72)`)
      .select('text')
      .text(d => d.toString())
      .attr('fill', d => Math.abs(d - amount) < 0.001 ? '#111' : '#bbb');

  }, [amount, lastDryRun, isFlipping, onAmountChange]);

  return <g ref={ref} transform={`translate(${x}, ${y})`} />;
}
