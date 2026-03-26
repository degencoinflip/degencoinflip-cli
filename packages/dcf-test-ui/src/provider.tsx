import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { DegenCoinFlip } from '@degencoinflip/sdk';
import type { BalanceResult, HistoryResult, FlipResult, DryRunResult, WalletAdapter } from '@degencoinflip/sdk';

// --- Devnet constants ---
const HELIUS_DEVNET_RPC = 'https://elisabeth-cwuemc-fast-devnet.helius-rpc.com';
const DEVNET_API_URL = 'https://dev-api.degencoinflip.com/v2';
const DEVNET_AUTHORITY = 'dev28C6QphTgjBdzRu59uyatizY7SBJyxUNudsaxUZ8';

// --- State ---

interface DcfState {
  sdk: DegenCoinFlip | null;
  walletAddress: string | null;
  balance: BalanceResult | null;
  history: HistoryResult | null;
  lastFlip: FlipResult | null;
  lastDryRun: DryRunResult | null;
  isFlipping: boolean;
  isDemo: boolean;
  error: string | null;
}

const initialState: DcfState = {
  sdk: null,
  walletAddress: null,
  balance: null,
  history: null,
  lastFlip: null,
  lastDryRun: null,
  isFlipping: false,
  isDemo: false,
  error: null,
};

// --- Actions ---

type Action =
  | { type: 'CONNECT'; sdk: DegenCoinFlip; walletAddress: string; isDemo?: boolean }
  | { type: 'DISCONNECT' }
  | { type: 'SET_BALANCE'; balance: BalanceResult }
  | { type: 'SET_HISTORY'; history: HistoryResult }
  | { type: 'FLIP_START' }
  | { type: 'FLIP_RESULT'; result: FlipResult }
  | { type: 'DRY_RUN'; result: DryRunResult }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' };

function reducer(state: DcfState, action: Action): DcfState {
  switch (action.type) {
    case 'CONNECT':
      return { ...initialState, sdk: action.sdk, walletAddress: action.walletAddress, isDemo: action.isDemo ?? false };
    case 'DISCONNECT':
      return initialState;
    case 'SET_BALANCE':
      return { ...state, balance: action.balance };
    case 'SET_HISTORY':
      return { ...state, history: action.history };
    case 'FLIP_START':
      return { ...state, isFlipping: true, lastFlip: null, error: null };
    case 'FLIP_RESULT':
      return { ...state, isFlipping: false, lastFlip: action.result };
    case 'DRY_RUN':
      return { ...state, lastDryRun: action.result };
    case 'SET_ERROR':
      return { ...state, isFlipping: false, error: action.error };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// --- Context ---

interface DcfContextValue {
  state: DcfState;
  connectKeypair: (keypair: Keypair, rpcUrl?: string, apiUrl?: string, authority?: string) => Promise<void>;
  connectWallet: (adapter: WalletAdapter, rpcUrl?: string, apiUrl?: string, authority?: string) => Promise<void>;
  connectDemo: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  flip: (side: 'H' | 'T', amount: number) => Promise<FlipResult>;
  dryRun: (side: 'H' | 'T', amount: number) => Promise<DryRunResult | null>;
}

const DcfContext = createContext<DcfContextValue | null>(null);

export function useDcf(): DcfContextValue {
  const ctx = useContext(DcfContext);
  if (!ctx) throw new Error('useDcf must be used within DcfProvider');
  return ctx;
}

// --- Provider ---

export function DcfProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sdkRef = useRef<DegenCoinFlip | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!sdkRef.current) return;
    try {
      const balance = await sdkRef.current.balance();
      dispatch({ type: 'SET_BALANCE', balance });
    } catch (e: any) {
      // Silent refresh failure
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    if (!sdkRef.current) return;
    // Skip history for wallet adapter users — requires signMessage popup just for JWT
    // The new playOnePopup flow doesn't need auth, so don't trigger a popup for history
    if (sdkRef.current['_walletAdapter']) return;
    try {
      const history = await sdkRef.current.history({ limit: 5, since: '24h' });
      dispatch({ type: 'SET_HISTORY', history });
    } catch {
      // Silent — history not critical
    }
  }, []);

  const initSdk = useCallback(async (sdk: DegenCoinFlip, isDemo = false) => {
    sdkRef.current = sdk;
    dispatch({ type: 'CONNECT', sdk, walletAddress: sdk.walletId, isDemo });
    await Promise.all([refreshBalance(), refreshHistory()]);
  }, [refreshBalance, refreshHistory]);

  const connectKeypair = useCallback(async (keypair: Keypair, rpcUrl?: string, apiUrl?: string, authority?: string) => {
    try {
      const sdk = new DegenCoinFlip({ keypair, rpcUrl, apiUrl, authority });
      const isDevnet = rpcUrl?.includes('devnet') || apiUrl?.includes('dev-api');
      await initSdk(sdk, isDevnet);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.message });
    }
  }, [initSdk]);

  const connectWallet = useCallback(async (adapter: WalletAdapter, rpcUrl?: string, apiUrl?: string, authority?: string) => {
    try {
      const sdk = new DegenCoinFlip({ wallet: adapter, rpcUrl, apiUrl, authority });
      const isDevnet = rpcUrl?.includes('devnet') || apiUrl?.includes('dev-api');
      await initSdk(sdk, isDevnet);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.message });
    }
  }, [initSdk]);

  const connectDemo = useCallback(async () => {
    try {
      // 1. Generate burner keypair
      const keypair = Keypair.generate();

      // 2. Airdrop 2 SOL using standard devnet RPC (Helius rate-limits airdrops)
      const devnetConnection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const sig = await devnetConnection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
      await devnetConnection.confirmTransaction(sig, 'confirmed');

      // 3. Connect SDK to devnet with Helius RPC + devnet API + devnet authority
      const sdk = new DegenCoinFlip({
        keypair,
        rpcUrl: HELIUS_DEVNET_RPC,
        apiUrl: DEVNET_API_URL,
        authority: DEVNET_AUTHORITY,
      });

      // 4. Init SDK and refresh balance
      await initSdk(sdk, true);
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: 'Demo setup failed: ' + (e.message || String(e)) });
    }
  }, [initSdk]);

  const disconnect = useCallback(() => {
    sdkRef.current = null;
    dispatch({ type: 'DISCONNECT' });
  }, []);

  const flip = useCallback(async (side: 'H' | 'T', amount: number): Promise<FlipResult> => {
    if (!sdkRef.current) throw new Error('Not connected');
    dispatch({ type: 'FLIP_START' });
    try {
      const result = await sdkRef.current.play(side, amount);
      dispatch({ type: 'FLIP_RESULT', result });
      refreshBalance();
      refreshHistory();
      return result;
    } catch (e: any) {
      dispatch({ type: 'SET_ERROR', error: e.message || String(e) });
      throw e;
    }
  }, [refreshBalance, refreshHistory]);

  const dryRun = useCallback(async (side: 'H' | 'T', amount: number): Promise<DryRunResult | null> => {
    if (!sdkRef.current) return null;
    try {
      const result = await sdkRef.current.dryRun(side, amount);
      dispatch({ type: 'DRY_RUN', result });
      return result;
    } catch {
      return null;
    }
  }, []);

  // Auto-refresh balance every 15s
  useEffect(() => {
    if (!state.sdk) return;
    const interval = setInterval(refreshBalance, 15_000);
    return () => clearInterval(interval);
  }, [state.sdk, refreshBalance]);

  // Auto-clear errors after 6s
  useEffect(() => {
    if (!state.error) return;
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 6000);
    return () => clearTimeout(timer);
  }, [state.error]);

  const value: DcfContextValue = {
    state,
    connectKeypair,
    connectWallet,
    connectDemo,
    disconnect,
    refreshBalance,
    refreshHistory,
    flip,
    dryRun,
  };

  return <DcfContext.Provider value={value}>{children}</DcfContext.Provider>;
}
