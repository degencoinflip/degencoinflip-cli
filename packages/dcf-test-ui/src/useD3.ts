import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Bridge hook: React owns state, D3 owns the DOM inside the <g> ref.
 * Re-runs renderFn when deps change.
 */
export function useD3(
  renderFn: (selection: d3.Selection<SVGGElement, unknown, null, undefined>) => void,
  deps: unknown[],
) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    if (ref.current) {
      renderFn(d3.select(ref.current));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
