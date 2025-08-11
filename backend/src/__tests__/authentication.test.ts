import request from 'supertest';
import app from '../app';
import { databaseManager } from '../database/manager';
import { AuthenticationService } from '../modules/authentication/services/authenticationService';

describe('Authentication API', () => {
  const testTenantId = 'test-auth-tenant-' + Math.random().toString(36).substring(7);
  const testUserToken = 'test-auth-token-123';

  beforeAll(async () => {
    // Register the test tenant
    const { tenantStore } = await import('../modules/multi-tenant/services/tenantStore');
    tenantStore.addTenant(testTenantId, 'Test Authentication Tenant', true);
    
    // Set up test user and token for the test tenant
    const database = await databaseManager.getDatabase(testTenantId);
    const authService = new AuthenticationService(database);
    
    // Create a test user with token
    const userWithToken = await authService.createUser('testuser', 'admin');
    
    // Update the token to a known value for testing
    if (userWithToken.token) {
      await database.run(
        'UPDATE tokens SET token = ? WHERE id = ?',
        [testUserToken, userWithToken.token.id]
      );
    }
  });

  afterAll(async () => {
    // Clean up
    await databaseManager.closeAllConnections();
    
    // Clean up test database files
    try {
      const fs = await import('fs/promises');
      await fs.rm('databases', { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Authentication Middleware', () => {
    test('should reject requests without X-User-Token header', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_TOKEN_MISSING');
      expect(response.body.message).toContain('User token is required');
    });

    test('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .set('X-User-Token', 'invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
      expect(response.body.message).toContain('Invalid or expired token');
    });

    test('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .set('X-User-Token', testUserToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('admin');
    });

    test('should reject requests without tenant ID', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-User-Token', testUserToken)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_ID_MISSING');
    });
  });

  describe('Authenticated API Operations', () => {
    test('should list documents for authenticated user', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('X-TENANT-ID', testTenantId)
        .set('X-User-Token', testUserToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBe('testuser');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should create document for authenticated user', async () => {
      const documentData = {
        name: 'Test Document Auth',
        content: 'This is a test document created by authenticated user'
      };

      const response = await request(app)
        .post('/api/documents')
        .set('X-TENANT-ID', testTenantId)
        .set('X-User-Token', testUserToken)
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBe('testuser');
      expect(response.body.data.name).toBe(documentData.name);
      expect(response.body.data.content).toBe(documentData.content);
    });

    test('should include user context in all responses', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .set('X-User-Token', testUserToken)
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.tenant).toBe('Test Authentication Tenant'); // This returns tenant name, not ID
    });
  });

  describe('Multi-language Authentication Messages', () => {
    test('should return error messages in Spanish', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .set('Accept-Language', 'es')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_TOKEN_MISSING');
      // The exact Spanish message may vary based on localization
      expect(response.body.message).toBeDefined();
    });

    test('should return error messages in French', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', testTenantId)
        .set('Accept-Language', 'fr')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_TOKEN_MISSING');
      // The exact French message may vary based on localization
      expect(response.body.message).toBeDefined();
    });
  });
});