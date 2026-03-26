export type GameState = {
    state: 'IDLE';
} | {
    state: 'PENDING_REWARD';
    rewardSol: number;
} | {
    state: 'PENDING_FLIP';
    depositSol: number;
};
/**
 * Detect stuck game state by checking on-chain PDA balances.
 */
export declare function detectState(): Promise<GameState>;
