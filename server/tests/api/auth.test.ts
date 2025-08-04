import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { setupAuth } from '../../supabaseAuth';
import { PrismaClient } from '@prisma/client';

// Mock the storage module
jest.mock('../../storage', () => ({
  storage: {
    getUser: jest.fn(),
    upsertUser: jest.fn(),
  },
}));

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      getUser: jest.fn(),
      admin: {
        signOut: jest.fn(),
      },
    },
  })),
}));

describe('Authentication API', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Set up authentication routes
    await setupAuth(app as any);
    
    prisma = new PrismaClient();
  });

  afterEach(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should reject login without email or password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should reject login with only email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should reject login with only password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should handle successful login', async () => {
      // Mock successful Supabase authentication
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          session: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
          },
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              first_name: 'Test',
              last_name: 'User',
            },
          },
        },
        error: null,
      });

      // Mock storage operations
      const { storage } = require('../../storage');
      storage.upsertUser.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });
      storage.getUser.mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged in successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe('test-user-id');
    });

    it('should handle Supabase authentication errors', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid login credentials');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration without email or password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password are required');
    });

    it('should handle successful registration', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            user_metadata: {
              first_name: 'New',
              last_name: 'User',
            },
          },
          session: {
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          },
        },
        error: null,
      });

      const { storage } = require('../../storage');
      storage.upsertUser.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      });
      storage.getUser.mockResolvedValue({
        id: 'new-user-id',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user).toBeDefined();
    });

    it('should handle registration with email confirmation required', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
          },
          session: null, // No immediate session = email confirmation required
        },
        error: null,
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('check your email');
      expect(response.body.needsConfirmation).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should handle logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should handle logout with valid token', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.auth.admin.signOut.mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});