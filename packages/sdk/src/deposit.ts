import {
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { getWalletAdapter, getProvider, getProgram, getConnection } from './anchor';
import { findHouseTreasury, findHouseState, findDegenerateAccount, findRewardsAccount } from './pda';
import { INITIALIZER_ID, COLD_HOUSE_ID, getAuthorityId, MEMO_PROGRAM_ID, DEFAULT_PRIORITY_FEE_SOL } from './constants';
import { getPriorityFeeEstimate } from './helius';
import { Errors } from './errors';
import { verboseLog } from './logger';

function makeMemo(id: string, amount: number, side: string): Buffer {
  return Buffer.from(`id=${id} amount=${amount} side=${side}`, 'utf-8');
}

function customRound(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Build an unsigned deposit (participate) transaction.
 * Returns a VersionedTransaction that has NOT been signed or sent.
 */
export async function buildDepositTransaction(
  id: string,
  amount: number,
  side: string,
  priorityFee?: number,
): Promise<VersionedTransaction> {
  const program = getProgram();
  const provider = getProvider();
  const player = provider.wallet.publicKey;
  const authority = getAuthorityId();

  const [houseTreasury] = await findHouseTreasury();
  const [houseState] = await findHouseState();
  const [degenerateAccount] = await findDegenerateAccount(player);
  const [rewardsAccount] = await findRewardsAccount(player);

  const lamports = new BN(Math.round(customRound(amount) * LAMPORTS_PER_SOL));

  verboseLog(`Building participate tx: ${amount} SOL, side ${side}`);

  try {
    const instruction = await program.methods
      .participate(lamports)
      .accounts({
        degenerate: player,
        initializer: INITIALIZER_ID,
        authority,
        coldHouse: COLD_HOUSE_ID,
        houseTreasury,
        houseState,
        degenerateAccount,
        rewardsAccount,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .instruction();

    const { connection } = provider;
    const { value: { blockhash } } = await connection.getLatestBlockhashAndContext();

    const memoInstruction = new TransactionInstruction({
      keys: [{ pubkey: player, isSigner: true, isWritable: true }],
      data: makeMemo(id, amount, side),
      programId: MEMO_PROGRAM_ID,
    });

    // Estimate priority fee if not provided
    let fee = priorityFee ?? 0;
    if (!fee) {
      try {
        const tempMsg = new TransactionMessage({
          payerKey: player,
          recentBlockhash: blockhash,
          instructions: [memoInstruction, instruction],
        }).compileToLegacyMessage();
        const tempTx = new VersionedTransaction(tempMsg);
        fee = await getPriorityFeeEstimate(tempTx);
      } catch {
        fee = DEFAULT_PRIORITY_FEE_SOL;
      }
    }

    verboseLog(`Priority fee: ${fee} SOL`);

    const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: Math.round((fee * LAMPORTS_PER_SOL) + 1),
    });

    const instructions = [memoInstruction, computeBudgetIx, instruction];

    const messageV0 = new TransactionMessage({
      payerKey: player,
      recentBlockhash: blockhash,
      instructions,
    }).compileToLegacyMessage();

    return new VersionedTransaction(messageV0);
  } catch (e: any) {
    throw Errors.depositFailed(e?.message ?? String(e));
  }
}

export async function depositSol(
  id: string,
  amount: number,
  side: string,
  priorityFee?: number,
): Promise<string> {
  try {
    const versionedTx = await buildDepositTransaction(id, amount, side, priorityFee);

    const walletAdapter = getWalletAdapter();
    if (walletAdapter) {
      // Browser wallet adapter path
      const conn = getConnection();
      const signedTx = await walletAdapter.signTransaction(versionedTx);
      const rawTx = signedTx.serialize();
      const signature = await conn.sendRawTransaction(rawTx, { skipPreflight: true });
      await conn.confirmTransaction(signature, 'confirmed');
      verboseLog(`Deposit tx: ${signature}`);
      return signature;
    } else {
      // Keypair path (existing code)
      const provider = getProvider();
      const txes = await provider.sendAll([{ tx: versionedTx }]);
      const signature = txes[0];
      verboseLog(`Deposit tx: ${signature}`);
      return signature;
    }
  } catch (e: any) {
    throw Errors.depositFailed(e?.message ?? String(e));
  }
}
