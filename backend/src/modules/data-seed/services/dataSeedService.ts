import { databaseManager } from '../../../database/manager';
import { AuthenticationService } from '../../authentication/services/authenticationService';
import { loadSeedData, SeedUserData } from '../types/seedData';

export class DataSeedService {
  private static instance: DataSeedService;

  private constructor() {}

  static getInstance(): DataSeedService {
    if (!DataSeedService.instance) {
      DataSeedService.instance = new DataSeedService();
    }
    return DataSeedService.instance;
  }

  /**
   * Seeds the database with pre-configured test data.
   * This method is idempotent - it will only create data if it doesn't already exist.
   * Tenants are automatically discovered from database files when they are created.
   */
  async seedData(): Promise<void> {
    console.log('🌱 Starting data seeding process...');

    try {
  const tenants = this.getUniqueTenants();
      
      for (const tenant of tenants) {
        await this.seedTenantData(tenant);
      }
      
      console.log('✅ Data seeding completed successfully');
    } catch (error) {
      console.error('❌ Error during data seeding:', error);
      throw error;
    }
  }

  /**
   * Seeds data for a specific tenant
   */
  private async seedTenantData(tenantId: string): Promise<void> {
    console.log(`📂 Processing tenant: ${tenantId}`);
    
    // Getting database will create the database file, making the tenant discoverable
    const database = await databaseManager.getDatabase(tenantId);
    const authService = new AuthenticationService(database);
    
  const tenantUsers = Object.values(loadSeedData()).filter(user => user.tenant === tenantId);
    
    for (const userData of tenantUsers) {
      await this.seedUser(authService, userData);
    }
    
    console.log(`✅ Tenant ${tenantId} seeding completed`);
  }

  /**
   * Creates a user if it doesn't already exist
   */
  private async seedUser(authService: AuthenticationService, userData: SeedUserData): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await authService.getUserByUsername(userData.username);
      
      if (existingUser) {
        console.log(`👤 User ${userData.username} already exists, skipping...`);
        return;
      }

      // Create user with predefined token
      const userWithToken = await authService.createUser(
        userData.username, 
        userData.role, 
        userData.token
      );

      console.log(`👤 Created user: ${userData.username} (${userData.role}) in tenant ${userData.tenant}`);
      console.log(`🔑 Token: ${userWithToken.token?.token}`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.username}:`, error);
      throw error;
    }
  }

  /**
   * Get list of unique tenants from seed data
   */
  private getUniqueTenants(): string[] {
  const tenants = Object.values(loadSeedData()).map(user => user.tenant);
    return [...new Set(tenants)];
  }

  /**
   * Check if seed data already exists (used for testing idempotency)
   */
  async isSeedDataPresent(): Promise<boolean> {
    try {
      // Check if users exist - tenants are automatically discovered when databases exist
      const seedData = loadSeedData();
      if (!seedData || Object.keys(seedData).length === 0) {
        return false;
      }
      // If any tenant DB has zero users, we treat seed as not present
      const tenants = [...new Set(Object.values(seedData).map(u => u.tenant))];
      for (const tenant of tenants) {
        const database = await databaseManager.getDatabase(tenant);
        const rows = await database.query('SELECT COUNT(*) as count FROM users');
        const count = rows?.[0]?.count ?? 0;
        if (count === 0) return false;
      }
      // Ensure all configured users exist
      for (const userData of Object.values(seedData)) {
        const database = await databaseManager.getDatabase(userData.tenant);
        const authService = new AuthenticationService(database);
        const user = await authService.getUserByUsername(userData.username);
        if (!user) return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking seed data:', error);
      return false;
    }
  }
}

export const dataSeedService = DataSeedService.getInstance();