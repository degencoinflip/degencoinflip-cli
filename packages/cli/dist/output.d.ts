export type Format = 'json' | 'table' | 'compact';
export declare function setFormat(f: Format): void;
export declare function setQuiet(q: boolean): void;
export declare function setVerbose(v: boolean): void;
export declare function isVerbose(): boolean;
export declare function output(data: Record<string, unknown>): void;
export interface PlayOutput {
    result: 'WIN' | 'LOSS';
    side: string;
    bet: number;
    fee: number;
    payout: number;
    profit: number;
    balance_before: number;
    balance_after: number;
    tx: string;
    claim_tx?: string;
    flip_id?: string;
    explorer: string;
}
export declare function outputPlay(data: PlayOutput): void;
export interface DryRunOutput {
    dry_run: true;
    side: string;
    bet: number;
    fee: number;
    priority_fee: number;
    total_cost: number;
    potential_win: number;
    balance: number;
    can_play: boolean;
}
export declare function outputDryRun(data: DryRunOutput): void;
export interface ResumeOutput {
    resumed: boolean;
    previous_state?: string;
    result?: string;
    payout?: number;
    claim_tx?: string;
    state?: string;
    message?: string;
}
export declare function outputResume(data: ResumeOutput): void;
export interface BalanceOutput {
    wallet: string;
    balance: number;
    state: string;
    ready: boolean;
    pending_reward?: number;
    pending_deposit?: number;
    note?: string;
}
export declare function outputBalance(data: BalanceOutput): void;
export interface HistoryOutput {
    flips: Array<{
        time: string;
        side: string;
        bet: number;
        result: string;
        payout: number;
    }>;
    summary: {
        total: number;
        wins: number;
        losses: number;
        net_pnl: number;
        win_rate: string;
    };
}
export declare function outputHistory(data: HistoryOutput): void;
export declare function log(msg: string): void;
export declare function verboseLog(msg: string): void;
