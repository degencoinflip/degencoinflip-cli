import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { getProgram, getProvider } from './anchor';
import { findHouseState, findRewardsAccount } from './pda';
import { INITIALIZER_ID, COLD_HOUSE_ID, getAuthorityId, MEMO_PROGRAM_ID, DEFAULT_PRIORITY_FEE_SOL } from './constants';
import { Errors } from './errors';
import { verboseLog } from './output';

const MAX_MARKET_LAMPORTS_CLAIM = 1_000_000;

function makeMemo(id: string, amount: number, side: string): Buffer {
  return Buffer.from(`id=${id} amount=${amount} side=${side}`, 'utf-8');
}

export async function claimReward(
  id: string = 'claim',
  amount: number = 0,
  side: string = 'H',
  priorityFee: number = DEFAULT_PRIORITY_FEE_SOL,
): Promise<string> {
  const program = getProgram();
  const provider = getProvider();
  const player = provider.wallet.publicKey;
  const authority = getAuthorityId();

  const [houseState] = await findHouseState();
  const [rewardsAccount] = await findRewardsAccount(player);

  verboseLog(`Building reveal tx...`);

  try {
    // Use .methods API (coral-xyz/anchor 0.30+)
    const instruction = await program.methods
      .reveal()
      .accounts({
        degenerate: player,
        initializer: INITIALIZER_ID,
        authority,
        coldHouse: COLD_HOUSE_ID,
        houseState,
        rewardsAccount,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    const { connection } = provider;
    const { value: { blockhash } } = await connection.getLatestBlockhashAndContext();

    const memoIx = new TransactionInstruction({
      keys: [{ pubkey: player, isSigner: true, isWritable: true }],
      data: makeMemo(id, amount, side),
      programId: MEMO_PROGRAM_ID,
    });

    const priorityFeeLamports = priorityFee * LAMPORTS_PER_SOL;
    const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.round(
        priorityFeeLamports === 0 ? (MAX_MARKET_LAMPORTS_CLAIM + 1) : (priorityFeeLamports + 1),
      ),
    });

    const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
      units: 60_000,
    });

    const instructions = [memoIx, computePriceIx, computeLimitIx, instruction];

    const messageV0 = new TransactionMessage({
      payerKey: player,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage();

    const versionedTx = new VersionedTransaction(messageV0);
    const txes = await provider.sendAll([{ tx: versionedTx }]);
    const signature = txes[0];

    verboseLog(`Claim tx: ${signature}`);
    return signature;
  } catch (e: any) {
    throw Errors.claimFailed(e?.message ?? String(e));
  }
}
