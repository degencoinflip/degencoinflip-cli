import React from 'react';
import * as d3 from 'd3';
import { useD3 } from './useD3';
import { useDcf } from './provider';
import { truncateAddress, formatSol } from './utils';

interface BalanceProps {
  x: number;
  y: number;
}

export function Balance({ x, y }: BalanceProps) {
  const { state, disconnect } = useDcf();
  const { walletAddress, balance, isDemo, lastDryRun } = state;
  // Use dryRun balance as fallback when balance() fails (e.g. devnet PDAs don't exist)
  const displayBalance = balance?.balance ?? lastDryRun?.balance ?? null;

  const ref = useD3((g) => {
    // Balance amount — interpolating number
    const balText = g.selectAll<SVGTextElement, null>('.bal-amount').data([null]);
    const balEnter = balText.enter()
      .append('text')
      .attr('class', 'bal-amount')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', '#111')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 28)
      .attr('font-weight', 300);

    const balMerge = balEnter.merge(balText);
    if (displayBalance !== null) {
      balMerge.transition()
        .duration(600)
        .tween('text', function () {
          const current = parseFloat(this.textContent || '0') || 0;
          const target = displayBalance;
          const i = d3.interpolateNumber(current, target);
          return (t: number) => {
            this.textContent = formatSol(i(t)) + ' SOL';
          };
        });
    }

    // Wallet address
    const addrText = g.selectAll<SVGTextElement, null>('.addr').data([null]);
    addrText.enter()
      .append('text')
      .attr('class', 'addr')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 30)
      .attr('fill', '#999')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('font-size', 12)
      .attr('font-weight', 400)
      .merge(addrText)
      .text(walletAddress ? truncateAddress(walletAddress) : '');

    // State badge
    const stateText = g.selectAll<SVGTextElement, null>('.state-badge').data([null]);
    stateText.enter()
      .append('text')
      .attr('class', 'state-badge')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 50)
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', 10)
      .attr('font-weight', 500)
      .attr('letter-spacing', '0.1em')
      .merge(stateText)
      .text(balance?.state ?? '')
      .attr('fill', balance?.state === 'IDLE' ? '#999'
        : balance?.state === 'PENDING_REWARD' ? '#16a34a'
        : '#ca8a04');

    // DEVNET badge
    const devnetText = g.selectAll<SVGTextElement, null>('.devnet-badge').data([null]);
    devnetText.enter()
      .append('text')
      .attr('class', 'devnet-badge')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', -22)
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', 9)
      .attr('font-weight', 600)
      .attr('letter-spacing', '0.15em')
      .merge(devnetText)
      .text(isDemo ? 'DEVNET' : '')
      .attr('fill', '#ca8a04');

    // Disconnect button
    const discText = g.selectAll<SVGTextElement, null>('.disconnect').data([null]);
    discText.enter()
      .append('text')
      .attr('class', 'disconnect clickable')
      .attr('text-anchor', 'middle')
      .attr('x', 0)
      .attr('y', 72)
      .attr('fill', '#bbb')
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-size', 10)
      .attr('font-weight', 400)
      .text('disconnect')
      .on('click', () => disconnect())
      .on('mouseover', function () { d3.select(this).attr('fill', '#666'); })
      .on('mouseout', function () { d3.select(this).attr('fill', '#bbb'); });

  }, [walletAddress, balance, isDemo, displayBalance]);

  return <g ref={ref} transform={`translate(${x}, ${y})`} />;
}
