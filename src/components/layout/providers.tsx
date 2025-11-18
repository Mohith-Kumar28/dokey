'use client';
import { useTheme } from 'next-themes';
import React from 'react';
import { AuthProvider, useUser } from '@/auth/client';
import { ActiveThemeProvider } from '../active-theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [queryClient] = React.useState(() => createQueryClient());
  function AuthSync() {
    const { user } = useUser();
    const [synced, setSynced] = React.useState(false);
    React.useEffect(() => {
      if (user && !synced) {
        fetch('/api/users/sync', { method: 'POST' }).then(() =>
          setSynced(true)
        );
      }
    }, [user, synced]);
    return null;
  }

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <AuthProvider isDark={resolvedTheme === 'dark'}>
          <AuthSync />
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </AuthProvider>
      </ActiveThemeProvider>
    </>
  );
}
