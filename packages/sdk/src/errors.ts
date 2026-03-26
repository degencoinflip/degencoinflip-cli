export class DcfError extends Error {
  constructor(
    message: string,
    public readonly hint?: string,
    public readonly exitCode: number = 1,
  ) {
    super(message);
    this.name = 'DcfError';
  }

  format(): string {
    let msg = `error: ${this.message}`;
    if (this.hint) msg += `\n  ${this.hint}`;
    return msg;
  }
}

export const Errors = {
  noKeypair: () => new DcfError(
    'no keypair found',
    'set DCF_KEYPAIR=/path/to/keypair.json or use solana-keygen new',
  ),

  insufficientBalance: (need: number, have: number) => new DcfError(
    `insufficient balance — need ${need.toFixed(4)} SOL, have ${have.toFixed(4)} SOL`,
    'dcf balance                          # check your balance',
  ),

  invalidSide: (side: string) => new DcfError(
    `invalid side "${side}" — must be H (heads) or T (tails)`,
    'dcf play H 1                         # example usage',
  ),

  invalidAmount: (amount: number, min: number, max: number) => new DcfError(
    `${amount} SOL is out of range`,
    `min ${min} SOL · max ${max} SOL · up to 3 decimals`,
  ),

  depositFailed: (detail?: string) => new DcfError(
    `deposit transaction failed${detail ? ` — ${detail}` : ''}`,
    'dcf play                             # resume if stuck',
  ),

  claimFailed: (detail?: string) => new DcfError(
    `claim transaction failed${detail ? ` — ${detail}` : ''}`,
    'dcf play                             # retry claim',
  ),

  timeout: (seconds: number) => new DcfError(
    `timed out after ${seconds}s`,
    'dcf play                             # resume',
  ),

  authFailed: (detail?: string) => new DcfError(
    `authentication failed${detail ? ` — ${detail}` : ''}`,
  ),

  apiFailed: (method: string, detail?: string) => new DcfError(
    `API call ${method} failed${detail ? ` — ${detail}` : ''}`,
  ),

  nothingToResume: () => new DcfError(
    'nothing to resume — no stuck state',
    'dcf play H 1                         # start a new flip',
  ),
} as const;
