import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID, SEEDS, INITIALIZER_ID, COLD_HOUSE_ID, getAuthorityId } from './constants';

export async function findHouseTreasury(
  initializer: PublicKey = INITIALIZER_ID,
  authority: PublicKey = getAuthorityId(),
  coldHouse: PublicKey = COLD_HOUSE_ID,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from(SEEDS.HOUSE_TREASURY), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()],
    PROGRAM_ID,
  );
}

export async function findHouseState(
  initializer: PublicKey = INITIALIZER_ID,
  authority: PublicKey = getAuthorityId(),
  coldHouse: PublicKey = COLD_HOUSE_ID,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from(SEEDS.HOUSE_STATE), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()],
    PROGRAM_ID,
  );
}

export async function findDegenerateAccount(
  player: PublicKey,
  initializer: PublicKey = INITIALIZER_ID,
  authority: PublicKey = getAuthorityId(),
  coldHouse: PublicKey = COLD_HOUSE_ID,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from(SEEDS.DEGENERATE), player.toBuffer(), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()],
    PROGRAM_ID,
  );
}

export async function findRewardsAccount(
  player: PublicKey,
  initializer: PublicKey = INITIALIZER_ID,
  authority: PublicKey = getAuthorityId(),
  coldHouse: PublicKey = COLD_HOUSE_ID,
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from(SEEDS.REWARDS), player.toBuffer(), initializer.toBuffer(), authority.toBuffer(), coldHouse.toBuffer()],
    PROGRAM_ID,
  );
}
