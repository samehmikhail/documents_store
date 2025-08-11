import { Tenant } from '../types/tenant';

// Simple in-memory tenant store for demo purposes
// In a real application, this would be replaced with a database
class TenantStore {
  private tenants: Map<string, Tenant> = new Map();

  constructor() {
    // Initialize with some demo tenants
    this.addTenant('tenant1', 'Demo Tenant 1', true);
    this.addTenant('tenant2', 'Demo Tenant 2', true);
    this.addTenant('tenant3', 'Demo Tenant 3', false);
  }

  private addTenant(id: string, name: string, isActive: boolean): void {
    const tenant: Tenant = {
      id,
      name,
      createdAt: new Date(),
      isActive
    };
    this.tenants.set(id, tenant);
  }

  getTenant(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  isValidTenant(id: string): boolean {
    const tenant = this.getTenant(id);
    return tenant !== undefined && tenant.isActive;
  }

  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }
}

export const tenantStore = new TenantStore();