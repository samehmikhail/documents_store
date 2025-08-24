import React, { createContext, useContext, useMemo, useState } from 'react';

export type TenantId = string;

export interface Identity {
  tenant: TenantId;
  token: string;
}

interface IdentityContextValue extends Identity {
  setTenant: (t: TenantId) => void;
  setToken: (token: string) => void;
}

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

export const IdentityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantId>('company_a');
  const [token, setToken] = useState<string>('');

  const value = useMemo(
    () => ({ tenant, token, setTenant, setToken }),
    [tenant, token]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
};

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity must be used within IdentityProvider');
  return ctx;
}
