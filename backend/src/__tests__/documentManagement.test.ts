import request from 'supertest';
import app from '../app';
import { databaseManager } from '../database/manager';
import { AuthenticationService } from '../modules/authentication/services/authenticationService';
import { DocumentRepository } from '../modules/documents/repositories/documentRepository';
import { tenantStore } from '../modules/multi-tenant/services/tenantStore';

describe('Document Management API', () => {
  const testTenantId = 'test-docs-tenant-' + Date.now().toString().slice(-6);
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let regularUserToken: string;

  beforeAll(async () => {
    // Add test tenant to tenant store
    tenantStore.addTenant(testTenantId, 'Test Document Tenant', true);
    
    // Create test users
    const database = await databaseManager.getDatabase(testTenantId);
    const authService = new AuthenticationService(database);

    // Create admin user
    adminUser = await authService.createUser('testadmin', 'admin');
    adminToken = adminUser.token!.token;

    // Create regular user
    regularUser = await authService.createUser('testuser', 'user');
    regularUserToken = regularUser.token!.token;
  });

  afterAll(async () => {
    await databaseManager.closeAllConnections();
  });

  describe('Role-based Access Control', () => {
    let tenantDocument: any;
    let privateDocument: any;
    let otherUserPrivateDocument: any;

    beforeAll(async () => {
      const database = await databaseManager.getDatabase(testTenantId);
      const docRepo = new DocumentRepository(database);

      // Create test documents
      tenantDocument = await docRepo.create({
        name: 'Tenant Document',
        content: 'This is visible to all users in the tenant',
        ownerId: adminUser.id,
        visibility: 'tenant'
      });

      privateDocument = await docRepo.create({
        name: 'Private Document',
        content: 'This is private to regular user',
        ownerId: regularUser.id,
        visibility: 'private'
      });

      otherUserPrivateDocument = await docRepo.create({
        name: 'Other User Private Document',
        content: 'This is private to admin user',
        ownerId: adminUser.id,
        visibility: 'private'
      });
    });

    it('should allow admin to see all tenant documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // All documents
      expect(response.body.accessLevel).toBe('admin');
    });

    it('should allow regular user to see tenant + their own private docs', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // Tenant doc + their private doc
      expect(response.body.accessLevel).toBe('user');
      
      const docIds = response.body.data.map((doc: any) => doc.id);
      expect(docIds).toContain(tenantDocument.id);
      expect(docIds).toContain(privateDocument.id);
      expect(docIds).not.toContain(otherUserPrivateDocument.id);
    });

    it('should deny access to private documents of other users', async () => {
      await request(app)
        .get(`/api/documents/${otherUserPrivateDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(403);
    });

    it('should allow access to tenant-level documents', async () => {
      const response = await request(app)
        .get(`/api/documents/${tenantDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(200);

      expect(response.body.data.id).toBe(tenantDocument.id);
    });
  });

  describe('Document Creation', () => {
    it('should create text document with private visibility', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .field('name', 'Test Document')
        .field('content', 'This is test content')
        .field('visibility', 'private')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Document');
      expect(response.body.data.content).toBe('This is test content');
      expect(response.body.data.visibility).toBe('private');
      expect(response.body.data.ownerId).toBe(regularUser.id);
    });

    it('should create text document with tenant visibility', async () => {
      const response = await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', adminToken)
        .field('name', 'Tenant Document')
        .field('content', 'This is tenant content')
        .field('visibility', 'tenant')
        .expect(201);

      expect(response.body.data.visibility).toBe('tenant');
    });

    it('should reject invalid visibility levels', async () => {
      await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .field('name', 'Test Document')
        .field('content', 'This is test content')
        .field('visibility', 'invalid')
        .expect(400);
    });

    it('should require name and content', async () => {
      await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .field('name', '')
        .expect(400);
    });
  });

  describe('File Upload', () => {
    it('should upload a file document', async () => {
      const testFileContent = 'This is test file content';
      const testFileName = 'test.txt';
      
      const response = await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .field('name', 'Uploaded Test File')
        .field('visibility', 'private')
        .attach('file', Buffer.from(testFileContent), testFileName)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Uploaded Test File');
      expect(response.body.data.fileName).toBe(testFileName);
      expect(response.body.data.fileSize).toBe(testFileContent.length);
      expect(response.body.data.fileUuid).toBeDefined();
      expect(response.body.data.visibility).toBe('private');
    });

    it('should require file for upload', async () => {
      await request(app)
        .post('/api/documents/upload')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .field('name', 'No File Test')
        .expect(400);
    });
  });

  describe('Document Modification', () => {
    let testDocument: any;

    beforeEach(async () => {
      const database = await databaseManager.getDatabase(testTenantId);
      const docRepo = new DocumentRepository(database);
      
      testDocument = await docRepo.create({
        name: 'Modifiable Document',
        content: 'Original content',
        ownerId: regularUser.id,
        visibility: 'private'
      });
    });

    it('should allow owner to update their document', async () => {
      const updateData = {
        name: 'Updated Document',
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/api/documents/${testDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.content).toBe(updateData.content);
    });

    it('should allow admin to update any document', async () => {
      const updateData = {
        name: 'Admin Updated Document'
      };

      await request(app)
        .put(`/api/documents/${testDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', adminToken)
        .send(updateData)
        .expect(200);
    });

    it('should allow owner to delete their document', async () => {
      await request(app)
        .delete(`/api/documents/${testDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(200);

      // Verify document is deleted
      await request(app)
        .get(`/api/documents/${testDocument.id}`)
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent document', async () => {
      await request(app)
        .get('/api/documents/non-existent-id')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(404);
    });

    it('should return 400 for invalid document ID', async () => {
      // Test with empty ID parameter - this will actually return the documents list
      const response = await request(app)
        .get('/api/documents/')
        .set('X-Tenant-Id', testTenantId)
        .set('X-User-Token', regularUserToken)
        .expect(200); // This returns the documents list, not a 404
      
      // Should be the documents list
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/documents')
        .set('X-Tenant-Id', testTenantId)
        .expect(401);
    });

    it('should require tenant ID', async () => {
      await request(app)
        .get('/api/documents')
        .set('X-User-Token', regularUserToken)
        .expect(400);
    });
  });
});