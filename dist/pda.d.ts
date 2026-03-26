import { PublicKey } from '@solana/web3.js';
export declare function findHouseTreasury(initializer?: PublicKey, authority?: PublicKey, coldHouse?: PublicKey): Promise<[PublicKey, number]>;
export declare function findHouseState(initializer?: PublicKey, authority?: PublicKey, coldHouse?: PublicKey): Promise<[PublicKey, number]>;
export declare function findDegenerateAccount(player: PublicKey, initializer?: PublicKey, authority?: PublicKey, coldHouse?: PublicKey): Promise<[PublicKey, number]>;
export declare function findRewardsAccount(player: PublicKey, initializer?: PublicKey, authority?: PublicKey, coldHouse?: PublicKey): Promise<[PublicKey, number]>;
