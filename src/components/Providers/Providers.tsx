'use client';

import { SWRConfig } from 'swr';
import { apiFetch } from '@/lib/api';
import { AuthProvider } from '../Auth/AuthProvider';
import { CurrentMovieProvider } from '../CurrentMovie/CurrentMovie';
import Toast from '../Toast/Toast';
import { ToastProvider } from '../Toast/ToastProvider';

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AuthProvider>
      <SWRConfig value={{ dedupingInterval: 2000, fetcher: (path: string) => apiFetch(path) }}>
        <CurrentMovieProvider>{children}</CurrentMovieProvider>
      </SWRConfig>
    </AuthProvider>
    <Toast />
  </ToastProvider>
);

export default Providers;
