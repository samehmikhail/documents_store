import request from 'supertest';
import app from '../app';

describe('API Health Check', () => {
  it('should return health check information', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('API is running');
    expect(response.body.timestamp).toBeDefined();
  });

  it('should return welcome message on root endpoint', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Welcome');
    expect(response.body.version).toBe('1.0.0');
  });

  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/non-existent-route')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Route not found');
  });
});

describe('Authentication API', () => {
  it('should allow registration with valid data', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.username).toBe(userData.username);
    expect(response.body.data.email).toBe(userData.email);
    expect(response.body.data.password).toBeUndefined(); // Password should not be returned
  });

  it('should allow login with valid credentials', async () => {
    // First register a user
    const userData = {
      username: 'logintest',
      email: 'logintest@example.com',
      password: 'password123'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Then login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.data.token).toBeDefined();
    expect(loginResponse.body.data.expiresAt).toBeDefined();
  });
});