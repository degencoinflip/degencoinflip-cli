"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const play_1 = require("./play");
const balance_1 = require("./balance");
const history_1 = require("./history");
const output_1 = require("./output");
const sdk_1 = require("@degencoinflip/sdk");
const program = new commander_1.Command();
program
    .name('dcf')
    .description('Degen Coin Flip CLI — flip coins from the terminal')
    .version('0.1.0')
    .option('-k, --keypair <path>', 'Path to Solana keypair file')
    .option('--rpc-url <url>', 'Solana RPC endpoint URL')
    .option('-f, --format <type>', 'Output format: json, table, compact')
    .option('-v, --verbose', 'Show tx details and timing')
    .option('-q, --quiet', 'Minimal output')
    .hook('preAction', (_thisCommand, actionCommand) => {
    // Apply global opts from the root program
    const opts = program.opts();
    if (opts.format)
        (0, output_1.setFormat)(opts.format);
    if (opts.quiet)
        (0, output_1.setQuiet)(true);
    if (opts.verbose)
        (0, output_1.setVerbose)(true);
    if (opts.keypair)
        process.env.DCF_KEYPAIR = opts.keypair;
    if (opts.rpcUrl)
        process.env.DCF_RPC_URL = opts.rpcUrl;
})
    .addHelpText('after', `
Environment variables:
  DCF_KEYPAIR       Path to keypair file (default: ~/.config/solana/id.json)
  DCF_RPC_URL       Solana RPC endpoint
  DCF_PRIORITY_FEE  Default priority fee in SOL

Examples:
  dcf play H 1            Flip heads for 1 SOL
  dcf play T 0.5          Flip tails for 0.5 SOL
  dcf play                Resume a stuck flip
  dcf play H 1 --dry-run  Preview costs
  dcf balance             Check your balance
  dcf history             Recent flip results

Quick start:
  1. Create a keypair:  solana-keygen new
  2. Fund it with SOL
  3. dcf play H 1
`);
// Register commands
(0, play_1.registerPlay)(program);
(0, balance_1.registerBalance)(program);
(0, history_1.registerHistory)(program);
// Also register 'resume' as an alias for 'play' with no args
program
    .command('resume')
    .description('Resume a stuck flip (alias for: dcf play)')
    .action(async (_opts, cmd) => {
    const { outputResume } = await Promise.resolve().then(() => __importStar(require('./output')));
    const parent = cmd.parent;
    const parentOpts = parent.opts();
    const keypair = parentOpts.keypair ?? process.env.DCF_KEYPAIR;
    const sdk = new sdk_1.DegenCoinFlip({
        keypair,
        ...(parentOpts.rpcUrl && { rpcUrl: parentOpts.rpcUrl }),
    });
    const result = await sdk.resume();
    outputResume(result ?? { resumed: false, state: 'IDLE', message: 'No stuck state. Ready to play: dcf play H 1' });
});
// Error handling
async function main() {
    try {
        await program.parseAsync(process.argv);
    }
    catch (e) {
        if (e instanceof sdk_1.DcfError) {
            console.error(e.format());
            process.exit(e.exitCode);
        }
        // Commander exits on its own for help/version
        if (e?.exitCode !== undefined)
            process.exit(e.exitCode);
        console.error(`error: ${e?.message ?? e}`);
        process.exit(1);
    }
}
main();
