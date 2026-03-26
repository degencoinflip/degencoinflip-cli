import React from 'react';
import { DcfProvider, useDcf } from './provider';
import { Connect } from './Connect';
import { Game } from './Game';

function Main() {
  const { state } = useDcf();

  return (
    <>
      {!state.sdk && <Connect />}
      {state.sdk && <Game />}
      {state.error && <div className="error-banner">{state.error}</div>}
    </>
  );
}

export function App() {
  return (
    <DcfProvider>
      <Main />
    </DcfProvider>
  );
}
