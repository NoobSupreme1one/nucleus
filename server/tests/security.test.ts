import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { 
  sanitizeInput, 
  validateRequest, 
  securityLogger, 
  accountLockoutProtection,
  trackLoginAttempt,
  secureErrorHandler,
  corsMiddleware,
  helmetMiddleware 
} from '../middleware/security';
import { z } from 'zod';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Add security middleware
    app.use(corsMiddleware);
    app.use(helmetMiddleware);
    app.use(securityLogger());
    app.use(sanitizeInput());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Sanitization', () => {
    beforeEach(() => {
      app.post('/api/test/sanitize', (req, res) => {
        res.json({ sanitized: req.body });
      });
    });

    it('should sanitize HTML from input', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>John',
        description: '<img src="x" onerror="alert(1)">Test description',
      };

      const response = await request(app)
        .post('/api/test/sanitize')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.sanitized.name).toBe('John');
      expect(response.body.sanitized.description).toBe('Test description');
    });

    it('should sanitize nested objects', async () => {
      const maliciousInput = {
        user: {
          name: '<script>alert("xss")</script>John',
          profile: {
            bio: '<img src="x" onerror="alert(1)">Bio',
          },
        },
        tags: ['<script>tag1</script>', 'tag2'],
      };

      const response = await request(app)
        .post('/api/test/sanitize')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.sanitized.user.name).toBe('John');
      expect(response.body.sanitized.user.profile.bio).toBe('Bio');
      expect(response.body.sanitized.tags[0]).toBe('tag1');
      expect(response.body.sanitized.tags[1]).toBe('tag2');
    });

    it('should preserve safe content', async () => {
      const safeInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
      };

      const response = await request(app)
        .post('/api/test/sanitize')
        .send(safeInput)
        .expect(200);

      expect(response.body.sanitized).toEqual(safeInput);
    });
  });

  describe('Request Validation', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().min(0).max(120),
    });

    beforeEach(() => {
      app.post('/api/test/validate', validateRequest(testSchema), (req, res) => {
        res.json({ validated: req.body });
      });
    });

    it('should accept valid input', async () => {
      const validInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const response = await request(app)
        .post('/api/test/validate')
        .send(validInput)
        .expect(200);

      expect(response.body.validated).toEqual(validInput);
    });

    it('should reject invalid email', async () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'invalid-email',
        age: 30,
      };

      const response = await request(app)
        .post('/api/test/validate')
        .send(invalidInput)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toBeDefined();
    });

    it('should reject missing required fields', async () => {
      const invalidInput = {
        email: 'john@example.com',
        age: 30,
      };

      const response = await request(app)
        .post('/api/test/validate')
        .send(invalidInput)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject out-of-range values', async () => {
      const invalidInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 150, // Invalid age
      };

      const response = await request(app)
        .post('/api/test/validate')
        .send(invalidInput)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Account Lockout Protection', () => {
    beforeEach(() => {
      app.post('/api/test/login', accountLockoutProtection(), (req, res) => {
        const { email, password } = req.body;
        
        // Simulate login logic
        if (email === 'test@example.com' && password === 'correct') {
          trackLoginAttempt(true, email);
          res.json({ success: true });
        } else {
          trackLoginAttempt(false, email);
          res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
      });
    });

    it('should allow login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/test/login')
        .send({ email: 'test@example.com', password: 'correct' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should track failed login attempts', async () => {
      // Make multiple failed attempts
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/api/test/login')
          .send({ email: 'test@example.com', password: 'wrong' })
          .expect(401);
      }

      // 5th attempt should still work (not locked yet)
      await request(app)
        .post('/api/test/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);

      // 6th attempt should be locked
      const response = await request(app)
        .post('/api/test/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
    });

    it('should reset attempts on successful login', async () => {
      // Make some failed attempts
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/test/login')
          .send({ email: 'test@example.com', password: 'wrong' })
          .expect(401);
      }

      // Successful login should reset
      await request(app)
        .post('/api/test/login')
        .send({ email: 'test@example.com', password: 'correct' })
        .expect(200);

      // Should be able to make failed attempts again
      await request(app)
        .post('/api/test/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      app.get('/api/test/error', (req, res, next) => {
        const error = new Error('Test error');
        (error as any).status = 400;
        next(error);
      });

      app.get('/api/test/internal-error', (req, res, next) => {
        const error = new Error('Internal error with sensitive info');
        next(error);
      });

      app.use(secureErrorHandler());
    });

    it('should handle known errors with proper status', async () => {
      const response = await request(app)
        .get('/api/test/error')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BAD_REQUEST');
      expect(response.body.error.timestamp).toBeDefined();
    });

    it('should sanitize internal errors in production', async () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/test/internal-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
      expect(response.body.error.message).toBe('Internal Server Error');
      expect(response.body.error.message).not.toContain('sensitive info');

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should show detailed errors in development', async () => {
      // Ensure development environment
      process.env.NODE_ENV = 'development';

      const response = await request(app)
        .get('/api/test/internal-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Internal error with sensitive info');
    });
  });

  describe('CORS Configuration', () => {
    it('should set CORS headers for allowed origins', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from disallowed origins', async () => {
      const response = await request(app)
        .get('/api/test')
        .set('Origin', 'https://malicious-site.com')
        .expect(500); // CORS error

      expect(response.text).toContain('Not allowed by CORS');
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      app.get('/api/test/headers', (req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(app)
        .get('/api/test/headers')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
});
