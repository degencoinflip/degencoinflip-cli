import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Point to SDK source so Vite compiles it as ESM (avoids CJS interop issues)
      '@degencoinflip/sdk': resolve(__dirname, '../sdk/src/index.ts'),
      // SDK uses 'fs' and 'path' for keypair loading — not needed in browser
      fs: resolve(__dirname, 'src/shims/fs.ts'),
      path: resolve(__dirname, 'src/shims/path.ts'),
      // Buffer polyfill for browser
      buffer: 'buffer/',
    },
  },
  define: {
    'process.env.HOME': JSON.stringify(''),
    'process.env.DCF_KEYPAIR': 'undefined',
    'process.env.DCF_RPC_URL': 'undefined',
    'process.env.DCF_API_URL': 'undefined',
    'process.env.DCF_AUTHORITY': 'undefined',
    'process.env.REACT_APP_RPC_URL': 'undefined',
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@coral-xyz/anchor', '@solana/web3.js', 'bs58', 'tweetnacl', 'buffer'],
  },
});
