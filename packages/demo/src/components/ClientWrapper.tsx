'use client';

import { ReactNode } from 'react';
import { Providers } from './Providers';

export function ClientWrapper({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
