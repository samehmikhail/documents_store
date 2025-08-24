import { useIdentity, type TenantId } from '@/contexts/IdentityContext';

export function IdentityHeader() {
  const { tenant, setTenant, token, setToken } = useIdentity();

  return (
    <div className="identity-header">
      <div className="field">
        <label htmlFor="tenant">Tenant</label>
        <select
          id="tenant"
          value={tenant}
          onChange={(e) => setTenant(e.target.value as TenantId)}
        >
          <option value="tenant-a">Tenant A</option>
          <option value="tenant-b">Tenant B</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="token">User token</label>
        <input
          id="token"
          type="text"
          placeholder="Enter token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </div>
    </div>
  );
}
