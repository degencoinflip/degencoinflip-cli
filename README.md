# dcf

The Degen Coin Flip CLI. One command to flip.

```bash
$ dcf play H 1
{
  "result": "WIN",
  "side": "H",
  "bet": 1.0,
  "payout": 2.0,
  "profit": 0.965,
  "balance": { "before": 12.34, "after": 13.31 },
  "tx": "5UfDq...",
  "claim_tx": "3vKzA...",
  "explorer": "https://solscan.io/tx/3vKzA..."
}
```

## Install

```bash
npm install -g degencoinflip-cli
```

## Quick Start

```bash
solana-keygen new                  # 1. create a wallet
# send SOL to the address shown    # 2. fund it
dcf play H 1                       # 3. flip
```

## Commands

### `play` -- flip a coin

```bash
dcf play H 1              # flip heads for 1 SOL
dcf play T 0.5            # flip tails for 0.5 SOL
dcf play H 1 --dry-run    # preview costs without playing
dcf play                   # resume a stuck flip
```

Handles everything automatically: wallet auth, deposit, wait for result, claim winnings. One command. Nothing else needed.

### `balance` -- check your SOL

```bash
dcf balance
```

Shows wallet balance and pending state (reward to claim, flip in progress).

### `history` -- what happened

```bash
dcf history                # last 10 flips
dcf history --limit 50     # last 50 flips
dcf history --since 7d     # flips from last 7 days
```

## Built for Agents

This CLI is designed for AI agents to use. JSON output by default when piped, no interactive prompts, proper exit codes, actionable error messages.

```bash
# agent loop
for i in $(seq 1 10); do dcf play H 0.1; done

# martingale strategy
amt=0.1; while true; do
  r=$(dcf play H $amt -q | jq -r .result)
  [ "$r" = "WIN" ] && amt=0.1 || amt=$(echo "$amt*2"|bc)
done

# check balance before playing
dcf balance -q | jq 'select(.balance > 5)' && dcf play T 1

# extract just the result
dcf play H 0.5 -q | jq '{won: (.result == "WIN"), profit: .profit}'
```

## Configuration

All via environment variables. No config files needed.

| Variable | Description | Default |
|----------|-------------|---------|
| `DCF_KEYPAIR` | Path to Solana keypair file | `~/.config/solana/id.json` |
| `DCF_RPC_URL` | Solana RPC endpoint | mainnet |
| `DCF_API_URL` | Backend API URL | `https://api.degencoinflip.com/v2` |
| `DCF_PRIORITY_FEE` | Default priority fee in SOL | auto (Helius) |

Or use flags:

```bash
dcf -k /path/to/keypair.json --rpc-url https://... play H 1
```

## Output Formats

Human-friendly output in terminal, JSON when piped to another command.

```bash
dcf play H 1               # human format in terminal, JSON when piped
dcf play H 1 -f json       # force JSON
dcf play H 1 -f table      # table format
dcf play H 1 -f compact    # single-line JSON
dcf play H 1 -q            # quiet (minimal output)
```

## Links

- [Twitter](https://x.com/degencoinflip)
- [Discord](https://discord.gg/degencoinflip)
- [Play Online](https://degencoinflip.com)
- [License Verification](https://verification.anjouangamingboard.org/validate?domain=degencoinflip.com&seal_id=62107696c154b6342a69395c01e432b49620dc99e247d5c7091ba6ffa791b8a070cb1f85572a6f7c66586d748cbaa798&stamp=581d558fd0ef5005a584471046dc98ec)

## License

[MIT](LICENSE)
