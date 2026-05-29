'use client';

import { useSession } from 'next-auth/react';

export type UserRole = 'viewer' | 'trader' | 'advisor' | 'compliance' | 'admin';

/**
 * Hook para acceder de forma sencilla al rol del usuario en componentes cliente.
 */
export function useUserRole() {
  const { data: session, status } = useSession();

  const role = (session?.user as any)?.role as UserRole || 'viewer';
  const loading = status === 'loading';

  return { 
    role, 
    loading,
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isAdmin: role === 'admin',
    isCompliance: role === 'compliance',
    isTrader: role === 'trader' || role === 'admin',
    isAdvisor: role === 'advisor' || role === 'admin',
  };
}
