import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { setupAuth, isAuthenticated } from '../localAuth';
import { prisma } from './setup';

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    
    // Setup local auth for testing
    await setupAuth(app);
    
    // Add test route that requires authentication
    app.get('/api/test/protected', isAuthenticated, (req, res) => {
      res.json({ message: 'Protected route accessed', user: (req as any).user });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      
      // Check that user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    });

    it('should reject registration with missing email', async () => {
      const userData = {
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Email and password are required');
    });

    it('should reject registration with missing password', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Email and password are required');
    });

    it('should reject registration with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('Invalid email format');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(200);

      // Second registration with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      
      // Check that access token cookie is set
      const cookies = response.headers['set-cookie'] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.some((cookie: string) => cookie.includes('access_token'))).toBe(true);
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.message).toContain('Email and password are required');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Extract token from cookie
      const cookies = loginResponse.headers['set-cookie'] as string[] | undefined;
      const tokenCookie = cookies?.find((cookie: string) => cookie.includes('access_token'));
      authToken = tokenCookie?.split('=')[1]?.split(';')[0] || '';
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
      
      // Check that cookies are cleared
      const cookies = response.headers['set-cookie'] as string[] | undefined;
      expect(cookies).toBeDefined();
      expect(cookies?.some((cookie: string) => cookie.includes('access_token=;'))).toBe(true);
    });
  });

  describe('Authentication Middleware', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login to get auth token
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookies = loginResponse.headers['set-cookie'];
      const tokenCookie = cookies.find((cookie: string) => cookie.includes('access_token'));
      authToken = tokenCookie?.split('=')[1]?.split(';')[0] || '';
    });

    it('should allow access to protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Protected route accessed');
      expect(response.body.user).toBeDefined();
    });

    it('should allow access with Bearer token in Authorization header', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Protected route accessed');
      expect(response.body.user).toBeDefined();
    });

    it('should reject access without token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/test/protected')
        .set('Cookie', 'access_token=invalid-token')
        .expect(401);

      expect(response.body.message).toContain('Invalid token');
    });
  });
});
