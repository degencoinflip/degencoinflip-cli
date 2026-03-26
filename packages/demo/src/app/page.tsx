'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { DegenCoinFlip } from '../../../sdk/src/index';
import { ReceiptSection } from "@/components/ReceiptSection";
import { PaymentSection } from "@/components/PaymentSection";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { CTASection } from "@/components/CTASection";

const RPC_URL = 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com';
const API_URL = 'https://dev-api.degencoinflip.com/v2';
const DEVNET_AUTHORITY = 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8';

export default function Home() {
  const { publicKey, connected, signTransaction, signAllTransactions, signMessage } = useWallet();
  const dcfRef = useRef<DegenCoinFlip | null>(null);

  useEffect(() => {
    if (connected && publicKey && signTransaction && signMessage) {
      dcfRef.current = new DegenCoinFlip({
        wallet: {
          publicKey,
          signTransaction: signTransaction as any,
          signAllTransactions: signAllTransactions as any,
          signMessage,
        },
        rpcUrl: RPC_URL,
        apiUrl: API_URL,
        authority: DEVNET_AUTHORITY,
      });
    } else {
      dcfRef.current = null;
    }
  }, [connected, publicKey, signTransaction, signAllTransactions, signMessage]);

  return (
    <main>
      {/* Sticky wallet connect button */}
      <div className="fixed top-4 right-4 z-50">
        <WalletMultiButton style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          fontWeight: 500,
          fontSize: '14px',
          height: '44px',
          padding: '0 24px',
          color: 'white',
        }} />
      </div>

      <ReceiptSection dcf={dcfRef} />
      <PaymentSection dcf={dcfRef} />
      <SubscriptionSection dcf={dcfRef} />
      <CTASection />
    </main>
  );
}
