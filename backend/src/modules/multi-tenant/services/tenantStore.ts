import { Tenant } from '../types/tenant';
import { Config } from '../../../config';
import path from 'path';
import fs from 'fs/promises';

// Filesystem-based tenant store that discovers tenants from database files
// Each tenant has its own SQLite database file named {tenantId}.db
class TenantStore {
  private dbDirectory: string;

  constructor() {
    this.dbDirectory = path.resolve(Config.DB_DIRECTORY);
  }

  /**
   * Discovers tenants by scanning database files in the directory
   */
  async getTenant(id: string): Promise<Tenant | undefined> {
    try {
      const dbPath = path.join(this.dbDirectory, `${id}.db`);
      await fs.access(dbPath);
      return { id };
    } catch {
      return undefined;
    }
  }

  /**
   * Checks if a tenant is valid by verifying its database file exists
   */
  async isValidTenant(id: string): Promise<boolean> {
    const tenant = await this.getTenant(id);
    return tenant !== undefined;
  }

  /**
   * Gets all tenants by scanning for database files
   */
  async getAllTenants(): Promise<Tenant[]> {
    try {
      const files = await fs.readdir(this.dbDirectory);
      const tenants: Tenant[] = [];
      
      for (const file of files) {
        if (file.endsWith('.db')) {
          const tenantId = file.slice(0, -3); // Remove .db extension
          tenants.push({ id: tenantId });
        }
      }
      
      return tenants;
    } catch (error) {
      // Directory might not exist yet
      return [];
    }
  }

  /**
   * Test helper: ensures a tenant database file exists so middleware treats it as valid
   */
  async addTenant(id: string, _name?: string, _active: boolean = true): Promise<void> {
    const dbPath = path.join(this.dbDirectory, `${id}.db`);
    try {
      await fs.access(dbPath);
      return;
    } catch {
      // create empty database file by touching it
      await fs.mkdir(this.dbDirectory, { recursive: true }).catch(() => undefined);
      await fs.writeFile(dbPath, '');
    }
  }
}

export const tenantStore = new TenantStore();