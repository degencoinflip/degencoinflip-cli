# Degen Coin Flip

Solana coin flip SDK + CLI. Play from code, terminal, or browser.

## Packages

| Package | Description | npm |
|---------|-------------|-----|
| [@degencoinflip/sdk](packages/sdk) | JavaScript/TypeScript SDK | [![npm](https://img.shields.io/npm/v/@degencoinflip/sdk)](https://www.npmjs.com/package/@degencoinflip/sdk) |
| [degencoinflip-cli](packages/cli) | CLI tool (`dcf`) | [![npm](https://img.shields.io/npm/v/degencoinflip-cli)](https://www.npmjs.com/package/degencoinflip-cli) |

## Quick start

### SDK

```typescript
import { DegenCoinFlip } from '@degencoinflip/sdk';

const dcf = new DegenCoinFlip({ keypair });
const result = await dcf.play('H', 1.0);
```

### CLI

```bash
npm i -g degencoinflip-cli
dcf play H 1
```

## Examples

- [**demo**](packages/demo) — Marketing showcase with real-world use cases (Next.js)
- [**example**](packages/example) — Minimal quickstart for browser wallet integration (Next.js)

## Development

```bash
git clone https://github.com/degencoinflip/degencoinflip
cd degencoinflip
npm install
npm run build
npm test
```

## Links

- [degencoinflip.com](https://degencoinflip.com)
- [Twitter](https://x.com/degencoinflip)
- [Discord](https://discord.gg/degencoinflip)

## License

[MIT](LICENSE)
