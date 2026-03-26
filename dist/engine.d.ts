import type { PlayOutput, DryRunOutput, ResumeOutput } from './output';
export declare function dryRun(side: string, amount: number, priorityFee?: number): Promise<DryRunOutput>;
export declare function resume(): Promise<ResumeOutput | null>;
export declare function play(side: string, amount: number, opts?: {
    noClaim?: boolean;
    priorityFee?: number;
    timeout?: number;
}): Promise<PlayOutput>;
