'use client';

import { SWRConfig } from 'swr';
import { Tooltip } from 'react-tooltip';
import { apiFetch } from '@/lib/api';
import { AuthProvider } from '../Auth/AuthProvider';
import Toast from '../Toast/Toast';
import { ToastProvider } from '../Toast/ToastProvider';

export const TOOLTIP_ID = 'tooltip';

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>
      <SWRConfig value={{ dedupingInterval: 2000, fetcher: (path: string) => apiFetch(path) }}>
        {children}
      </SWRConfig>
    </AuthProvider>
    <Tooltip id={TOOLTIP_ID} />
    <Toast />
  </ToastProvider>
);

export default Providers;
