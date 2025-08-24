import { dataSeedService } from '../modules/data-seed';
import { databaseManager } from '../database/manager';
import { AuthenticationService } from '../modules/authentication/services/authenticationService';
import { loadSeedData } from '../modules/data-seed/types/seedData';

describe('Data Seeding Service', () => {
  beforeAll(async () => {
    // Clean up any existing test databases
    try {
      const fs = await import('fs/promises');
      await fs.rm('databases', { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    await databaseManager.closeAllConnections();
    
    // Clean up test database files
    try {
      const fs = await import('fs/promises');
      await fs.rm('databases', { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initial Seeding', () => {
    test('should create all configured users and tenants', async () => {
      // Initially should not be present
      expect(await dataSeedService.isSeedDataPresent()).toBe(false);
      
      // Run seeding
      await dataSeedService.seedData();
      
      // Now should be present
      expect(await dataSeedService.isSeedDataPresent()).toBe(true);
      
      // Verify each user was created correctly
  for (const userData of Object.values(loadSeedData())) {
        const database = await databaseManager.getDatabase(userData.tenant);
        const authService = new AuthenticationService(database);
        
        const user = await authService.getUserByUsername(userData.username);
        expect(user).toBeDefined();
        expect(user?.username).toBe(userData.username);
        expect(user?.role).toBe(userData.role);
        
        // Verify token exists and matches
        const userWithToken = await authService.findUserByToken(userData.token);
        expect(userWithToken).toBeDefined();
        expect(userWithToken?.username).toBe(userData.username);
        expect(userWithToken?.token?.token).toBe(userData.token);
      }
    });
  });

  describe('Idempotency', () => {
    test('should not create duplicate users on subsequent runs', async () => {
      // Seed data first time
      await dataSeedService.seedData();
      
      // Count users in each tenant before second seeding
      const userCounts: { [key: string]: number } = {};
      for (const tenant of ['company_a', 'company_b']) {
        const database = await databaseManager.getDatabase(tenant);
        const users = await database.query('SELECT COUNT(*) as count FROM users');
        userCounts[tenant] = users[0].count;
      }
      
      // Seed data second time (should be idempotent)
      await dataSeedService.seedData();
      
      // Count users after second seeding - should be the same
      for (const tenant of ['company_a', 'company_b']) {
        const database = await databaseManager.getDatabase(tenant);
        const users = await database.query('SELECT COUNT(*) as count FROM users');
        expect(users[0].count).toBe(userCounts[tenant]);
      }
    });

    test('should maintain correct token associations after multiple seeding attempts', async () => {
      // Run seeding multiple times
      await dataSeedService.seedData();
      await dataSeedService.seedData();
      await dataSeedService.seedData();
      
      // Verify all tokens still work correctly
  for (const userData of Object.values(loadSeedData())) {
        const database = await databaseManager.getDatabase(userData.tenant);
        const authService = new AuthenticationService(database);
        
        const userWithToken = await authService.findUserByToken(userData.token);
        expect(userWithToken).toBeDefined();
        expect(userWithToken?.username).toBe(userData.username);
        expect(userWithToken?.role).toBe(userData.role);
      }
    });
  });

  describe('Tenant Isolation', () => {
    test('should create separate databases for each tenant', async () => {
      await dataSeedService.seedData();
      
      // Verify company_a users are only in company_a database
      const companyADb = await databaseManager.getDatabase('company_a');
      const companyAAuthService = new AuthenticationService(companyADb);
      
      const adminA = await companyAAuthService.getUserByUsername('admin_a');
      const userA = await companyAAuthService.getUserByUsername('user_a');
      const adminB = await companyAAuthService.getUserByUsername('admin_b');
      
      expect(adminA).toBeDefined();
      expect(userA).toBeDefined();
      expect(adminB).toBeUndefined(); // Should not exist in company_a
      
      // Verify company_b users are only in company_b database
      const companyBDb = await databaseManager.getDatabase('company_b');
      const companyBAuthService = new AuthenticationService(companyBDb);
      
      const adminBInB = await companyBAuthService.getUserByUsername('admin_b');
      const adminAInB = await companyBAuthService.getUserByUsername('admin_a');
      
      expect(adminBInB).toBeDefined();
      expect(adminAInB).toBeUndefined(); // Should not exist in company_b
    });
  });
});