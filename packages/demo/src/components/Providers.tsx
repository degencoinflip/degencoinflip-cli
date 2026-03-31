'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-unsafe-burner';
import '@solana/wallet-adapter-react-ui/styles.css';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL!;
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new UnsafeBurnerWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
