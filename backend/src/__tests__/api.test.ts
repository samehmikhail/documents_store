import request from 'supertest';
import app from '../app';
import { databaseManager } from '../database/manager';
import { tenantStore } from '../modules/multi-tenant/services/tenantStore';
import { AuthenticationService } from '../modules/authentication/services/authenticationService';
import fs from 'fs/promises';

describe('Multi-Tenant API', () => {
  let testToken1: string;
  let testToken2: string;
  
  // Clean up databases before each test to ensure isolation
  beforeEach(async () => {
    try {
      await databaseManager.closeAllConnections();
      await fs.rm('databases', { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    
    // Set up demo tenants for tests
    tenantStore.addTenant('tenant1', 'Demo Tenant 1', true);
    tenantStore.addTenant('tenant2', 'Demo Tenant 2', true);
    tenantStore.addTenant('tenant3', 'Demo Tenant 3', false);
    
    // Create test users with tokens for each tenant
    const db1 = await databaseManager.getDatabase('tenant1');
    const authService1 = new AuthenticationService(db1);
    const user1 = await authService1.createUser('testuser1', 'admin');
    testToken1 = user1.token!.token;
    
    const db2 = await databaseManager.getDatabase('tenant2');
    const authService2 = new AuthenticationService(db2);
    const user2 = await authService2.createUser('testuser2', 'user');
    testToken2 = user2.token!.token;
  });

  afterAll(async () => {
    await databaseManager.closeAllConnections();
    try {
      await fs.rm('databases', { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  describe('Tenant Middleware', () => {
    it('should reject requests without X-TENANT-ID header', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-User-Token', 'some-token')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_ID_MISSING');
    });

    it('should reject requests with invalid tenant ID', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', 'invalid-tenant')
        .set('X-User-Token', 'some-token')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_INVALID');
    });

    it('should reject requests with inactive tenant', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', 'tenant3') // tenant3 is inactive
        .set('X-User-Token', 'some-token')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('TENANT_INVALID');
    });

    it('should accept requests with valid tenant ID', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-TENANT-ID', 'tenant1')
        .set('X-User-Token', testToken1)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.tenant).toBe('Demo Tenant 1');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser1');
    });
  });

  describe('Localization', () => {
    it('should use default locale (English)', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.message).toContain('Welcome');
    });

    it('should respect Accept-Language header for Spanish', async () => {
      const response = await request(app)
        .get('/')
        .set('Accept-Language', 'es')
        .expect(200);
      
      expect(response.body.message).toContain('Bienvenido');
    });

    it('should respect locale query parameter', async () => {
      const response = await request(app)
        .get('/?locale=fr')
        .expect(200);
      
      expect(response.body.message).toContain('Bienvenue');
    });
  });

  describe('Multi-tenant Database Operations', () => {
    const validTenantId = 'tenant1';

    it('should get empty documents list for new tenant', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.tenant).toBe(validTenantId);
      expect(response.body.user).toBe('testuser1');
    });

    it('should create a document for tenant', async () => {
      const documentData = {
        name: 'Test Document',
        content: 'This is test content'
      };

      const response = await request(app)
        .post('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .send(documentData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(documentData.name);
      expect(response.body.data.content).toBe(documentData.content);
      expect(response.body.data.id).toBeDefined();
    });

    it('should list documents for tenant after creation', async () => {
      // First create a document
      const documentData = {
        name: 'Test Document 2',
        content: 'This is test content 2'
      };

      await request(app)
        .post('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .send(documentData)
        .expect(201);

      // Then list documents
      const response = await request(app)
        .get('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Should have only this one
      expect(response.body.data[0].name).toBe(documentData.name);
    });

    it('should isolate documents between tenants', async () => {
      const tenant2 = 'tenant2';
      
      // Create a document for tenant1 first
      await request(app)
        .post('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .send({ name: 'Tenant 1 Doc', content: 'Content for tenant 1' })
        .expect(201);
      
      // Get documents for tenant2
      const response = await request(app)
        .get('/api/documents')
        .set('X-TENANT-ID', tenant2)
        .set('X-User-Token', testToken2)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]); // Should be empty as tenant2 has no documents
    });

    it('should validate required fields for document creation', async () => {
      const response = await request(app)
        .post('/api/documents')
        .set('X-TENANT-ID', validTenantId)
        .set('X-User-Token', testToken1)
        .send({ name: 'Test' }) // Missing content
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
});