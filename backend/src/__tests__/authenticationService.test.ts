import { AuthenticationService } from '../modules/authentication/services/authenticationService';
import { UserRepository } from '../modules/authentication/repositories/userRepository';
import { TokenRepository } from '../modules/authentication/repositories/tokenRepository';
import { databaseManager } from '../database/manager';

describe('Authentication Service', () => {
  const testTenantId = 'test-service-tenant';
  let authService: AuthenticationService;
  let database: any;

  beforeAll(async () => {
    database = await databaseManager.getDatabase(testTenantId);
    authService = new AuthenticationService(database);
  });

  afterAll(async () => {
    await databaseManager.closeAllConnections();
  });

  beforeEach(async () => {
    // Clean up test data
    await database.run('DELETE FROM tokens');
    await database.run('DELETE FROM users');
  });

  describe('User Creation', () => {
    test('should create a new user with default role', async () => {
      const userWithToken = await authService.createUser('testuser');
      
      expect(userWithToken.id).toBeDefined();
      expect(userWithToken.username).toBe('testuser');
      expect(userWithToken.role).toBe('user');
      expect(userWithToken.token).toBeDefined();
      expect(userWithToken.token!.token).toBeDefined();
      expect(userWithToken.token!.userId).toBe(userWithToken.id);
    });

    test('should create a new user with admin role', async () => {
      const userWithToken = await authService.createUser('adminuser', 'admin');
      
      expect(userWithToken.username).toBe('adminuser');
      expect(userWithToken.role).toBe('admin');
      expect(userWithToken.token).toBeDefined();
    });

    test('should not create user with duplicate username', async () => {
      await authService.createUser('duplicateuser');
      
      await expect(authService.createUser('duplicateuser')).rejects.toThrow('Username already exists');
    });
  });

  describe('Token Authentication', () => {
    test('should find user by valid token', async () => {
      const createdUser = await authService.createUser('tokenuser');
      const token = createdUser.token!.token;
      
      const foundUser = await authService.findUserByToken(token);
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe('tokenuser');
      expect(foundUser!.token).toBeDefined();
      expect(foundUser!.token!.token).toBe(token);
    });

    test('should return undefined for invalid token', async () => {
      const foundUser = await authService.findUserByToken('invalid-token');
      expect(foundUser).toBeUndefined();
    });

    test('should return undefined for non-existent token', async () => {
      const foundUser = await authService.findUserByToken('non-existent-token-12345');
      expect(foundUser).toBeUndefined();
    });
  });

  describe('Token Management', () => {
    test('should regenerate token for existing user', async () => {
      const createdUser = await authService.createUser('regenuser');
      const originalToken = createdUser.token!.token;
      
      const newToken = await authService.regenerateToken(createdUser.id);
      
      expect(newToken).toBeDefined();
      expect(newToken!.token).not.toBe(originalToken);
      expect(newToken!.userId).toBe(createdUser.id);
      
      // Original token should no longer work
      const foundWithOldToken = await authService.findUserByToken(originalToken);
      expect(foundWithOldToken).toBeUndefined();
      
      // New token should work
      const foundWithNewToken = await authService.findUserByToken(newToken!.token);
      expect(foundWithNewToken).toBeDefined();
      expect(foundWithNewToken!.id).toBe(createdUser.id);
    });

    test('should delete token for user', async () => {
      const createdUser = await authService.createUser('deleteuser');
      const token = createdUser.token!.token;
      
      const deleted = await authService.deleteToken(createdUser.id);
      expect(deleted).toBe(true);
      
      // Token should no longer work
      const foundUser = await authService.findUserByToken(token);
      expect(foundUser).toBeUndefined();
    });
  });

  describe('User Queries', () => {
    test('should find user by ID', async () => {
      const createdUser = await authService.createUser('iduser');
      
      const foundUser = await authService.getUserById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.username).toBe('iduser');
      expect(foundUser!.id).toBe(createdUser.id);
    });

    test('should find user by username', async () => {
      const createdUser = await authService.createUser('nameuser');
      
      const foundUser = await authService.getUserByUsername('nameuser');
      
      expect(foundUser).toBeDefined();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.username).toBe('nameuser');
    });

    test('should return undefined for non-existent user ID', async () => {
      const foundUser = await authService.getUserById('non-existent-id');
      expect(foundUser).toBeUndefined();
    });

    test('should return undefined for non-existent username', async () => {
      const foundUser = await authService.getUserByUsername('non-existent-user');
      expect(foundUser).toBeUndefined();
    });
  });
});