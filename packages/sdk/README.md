# @degencoinflip/sdk

Solana coin flip SDK. Play from Node.js scripts, AI agents, or browser wallets.

## Install

```bash
npm install @degencoinflip/sdk
```

## Quick start

### Keypair (Node.js / AI agents)

```typescript
import { DegenCoinFlip } from '@degencoinflip/sdk';

const dcf = new DegenCoinFlip({ keypair: loadKeypair('~/.config/solana/id.json') });
const result = await dcf.play('H', 1.0);
console.log(result.result); // 'WIN' or 'LOSS'
```

### Browser wallet

```typescript
import { DegenCoinFlip } from '@degencoinflip/sdk';

const dcf = new DegenCoinFlip({
  wallet: {
    publicKey: walletAdapter.publicKey,
    signTransaction: (tx) => walletAdapter.signTransaction(tx),
    signAllTransactions: (txs) => walletAdapter.signAllTransactions(txs),
    signMessage: (msg) => walletAdapter.signMessage(msg),
  },
});

const result = await dcf.play('H', 0.5);
```

## API

| Method | Description |
|--------|-------------|
| `play(side, amount, opts?)` | Flip a coin. Handles auth, deposit, result, and claim. |
| `dryRun(side, amount, priorityFee?)` | Preview costs without playing. |
| `balance()` | Check wallet SOL balance and game state. |
| `history(opts?)` | Get recent flip results with win/loss summary. |
| `resume()` | Recover from stuck game state (unclaimed win, pending flip). |

### Play options

```typescript
await dcf.play('H', 1.0, {
  noClaim: false,       // Skip auto-claim on win
  priorityFee: 0.0001,  // Priority fee in SOL
  timeout: 120000,       // Max wait for result (ms)
  affiliateId: 'your-id' // Affiliate tracking
});
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DCF_KEYPAIR` | Path to Solana keypair file (default: `~/.config/solana/id.json`) |
| `DCF_RPC_URL` | Solana RPC endpoint |
| `DCF_API_URL` | Backend API URL (default: production) |

## Game rules

- Bet range: 0.001 - 32 SOL
- Platform fee: 3.5%
- 50/50 coin flip, 2x payout on win
- On-chain escrow via Anchor program

## License

MIT
