import { useEffect, useMemo, useState } from 'react';
import { useIdentity, type TenantId } from '@/contexts/IdentityContext';
import { fetchSeedData, type SeedConfiguration } from '@/services/seedConfig';

export function IdentityHeader() {
  const { tenant, setTenant, token, setToken } = useIdentity();
  const [seed, setSeed] = useState<SeedConfiguration>({});

  useEffect(() => {
    void (async () => setSeed(await fetchSeedData()))();
  }, []);

  const usersForTenant = useMemo(
    () => Object.values(seed).filter(u => u.tenant === tenant),
    [seed, tenant]
  );

  const tenantOptions = useMemo(() => {
    const ids = Array.from(new Set(Object.values(seed).map(u => u.tenant)));
    // Provide fallback if no seed loaded yet
    return ids.length > 0 ? ids : ['company_a', 'company_b'];
  }, [seed]);

  return (
    <div className="identity-header">
      <div className="field">
        <label htmlFor="tenant">Tenant</label>
        <select
          id="tenant"
          value={tenant}
          onChange={(e) => setTenant(e.target.value as TenantId)}
        >
          {tenantOptions.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="token">User token</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            id="token"
            type="text"
            placeholder="Enter token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{ flex: 1 }}
          />
          {usersForTenant.length > 0 && (
            <select
              aria-label="Quick select user"
              onChange={(e) => {
                const sel = usersForTenant.find(u => u.username === e.target.value);
                if (sel) setToken(sel.token);
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Pick user
              </option>
              {usersForTenant.map(u => (
                <option key={u.username} value={u.username}>
                  {u.username} ({u.role})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
