# degencoinflip-cli

Flip coins on Solana from the terminal. One command to play.

## Install

```bash
npm install -g degencoinflip-cli
```

## Usage

```bash
dcf play H 1          # Flip heads for 1 SOL
dcf play T 0.5        # Flip tails for 0.5 SOL
dcf play H 1 --dry-run  # Preview costs
dcf balance           # Check wallet balance + game state
dcf history           # Recent flip results
dcf resume            # Recover a stuck flip
```

## Commands

### `dcf play [side] [amount]`

Flip a coin. With no args, resumes any stuck game state.

| Flag | Description |
|------|-------------|
| `--no-claim` | Don't auto-claim on win |
| `--priority-fee <sol>` | Priority fee in SOL |
| `--dry-run` | Show cost breakdown without playing |
| `--timeout <ms>` | Max wait for result (default: 120000) |

### `dcf balance`

Show wallet SOL balance and game state (IDLE / PENDING_FLIP / PENDING_REWARD).

### `dcf history`

Show recent flip results with win/loss summary.

| Flag | Description |
|------|-------------|
| `--limit <n>` | Number of flips to show (default: 10) |
| `--since <time>` | Time window, e.g. `24h`, `7d`, `30m` |

### `dcf resume`

Alias for `dcf play` with no args. Recovers stuck game state.

## Global options

| Flag | Description |
|------|-------------|
| `-k, --keypair <path>` | Path to Solana keypair file |
| `--rpc-url <url>` | Solana RPC endpoint |
| `-f, --format <type>` | Output format: `json`, `table`, `compact` |
| `-v, --verbose` | Show tx details and timing |
| `-q, --quiet` | Minimal output |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DCF_KEYPAIR` | Path to keypair file (default: `~/.config/solana/id.json`) |
| `DCF_RPC_URL` | Solana RPC endpoint |
| `DCF_PRIORITY_FEE` | Default priority fee in SOL |

## Quick start

```bash
# 1. Create a keypair
solana-keygen new

# 2. Fund it with SOL

# 3. Flip
dcf play H 1
```

## SDK

For programmatic use (Node.js, AI agents, browser wallets), see [@degencoinflip/sdk](https://www.npmjs.com/package/@degencoinflip/sdk).

## License

MIT
