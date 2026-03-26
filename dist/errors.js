"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = exports.DcfError = void 0;
class DcfError extends Error {
    hint;
    exitCode;
    constructor(message, hint, exitCode = 1) {
        super(message);
        this.hint = hint;
        this.exitCode = exitCode;
        this.name = 'DcfError';
    }
    format() {
        let msg = `error: ${this.message}`;
        if (this.hint)
            msg += `\n  ${this.hint}`;
        return msg;
    }
}
exports.DcfError = DcfError;
exports.Errors = {
    noKeypair: () => new DcfError('no keypair found', 'set DCF_KEYPAIR=/path/to/keypair.json or use solana-keygen new'),
    insufficientBalance: (need, have) => new DcfError(`insufficient balance — need ${need.toFixed(4)} SOL, have ${have.toFixed(4)} SOL`, 'dcf balance                          # check your balance'),
    invalidSide: (side) => new DcfError(`invalid side "${side}" — must be H (heads) or T (tails)`, 'dcf play H 1                         # example usage'),
    invalidAmount: (amount, min, max) => new DcfError(`${amount} SOL is out of range`, `min ${min} SOL · max ${max} SOL · up to 3 decimals`),
    depositFailed: (detail) => new DcfError(`deposit transaction failed${detail ? ` — ${detail}` : ''}`, 'dcf play                             # resume if stuck'),
    claimFailed: (detail) => new DcfError(`claim transaction failed${detail ? ` — ${detail}` : ''}`, 'dcf play                             # retry claim'),
    timeout: (seconds) => new DcfError(`timed out after ${seconds}s`, 'dcf play                             # resume'),
    authFailed: (detail) => new DcfError(`authentication failed${detail ? ` — ${detail}` : ''}`),
    apiFailed: (method, detail) => new DcfError(`API call ${method} failed${detail ? ` — ${detail}` : ''}`),
    nothingToResume: () => new DcfError('nothing to resume — no stuck state', 'dcf play H 1                         # start a new flip'),
};
