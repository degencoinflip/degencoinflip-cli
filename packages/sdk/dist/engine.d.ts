import type { FlipResult, DryRunResult, ResumeResult, PlayOptions } from './types';
export declare function dryRun(side: string, amount: number, priorityFee?: number): Promise<DryRunResult>;
export declare function resume(): Promise<ResumeResult | null>;
export declare function play(side: string, amount: number, opts?: PlayOptions): Promise<FlipResult>;
