import React, { Suspense } from 'react';
import { DcfProvider, useDcf } from './provider';
import { WalletButton } from './components/WalletButton';
import { HeroCoin } from './sections/HeroCoin';
import { CodeDemo } from './sections/CodeDemo';
import { TerminalDemo } from './sections/TerminalDemo';
import { Closer } from './sections/Closer';
import './style.css';

function Showcase() {
  const { state } = useDcf();

  return (
    <>
      <WalletButton />
      <div className="showcase">
        <HeroCoin connected={!!state.sdk} />
        <CodeDemo />
        <TerminalDemo />
        <Closer />
      </div>
      {state.error && <div className="error-banner">{state.error}</div>}
    </>
  );
}

export function App() {
  return (
    <DcfProvider>
      <Showcase />
    </DcfProvider>
  );
}
