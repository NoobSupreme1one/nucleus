import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { StripeService } from '../services/stripe';
import { setupAuth as setupLocalAuth, isAuthenticated } from '../localAuth';
import { requireProSubscription, addSubscriptionInfo } from '../middleware/subscription';
import { prisma } from './setup';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/test',
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test',
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
          },
        },
      }),
    },
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test_123',
      }),
    },
  }));
});

describe('Stripe Integration', () => {
  let app: express.Application;
  let stripeService: StripeService;
  let authToken: string;
  let testUserId: string;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/json' }));
    app.use(cookieParser());
    
    // Setup auth
    await setupLocalAuth(app);
    
    // Initialize Stripe service
    stripeService = new StripeService(prisma);
    
    // Setup Stripe routes
    app.post('/api/stripe/create-checkout-session', isAuthenticated, async (req: any, res) => {
      try {
        const session = await stripeService.createCheckoutSession(req.user.id, req.body.priceId);
        res.json({ success: true, sessionUrl: session.url });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/stripe/create-portal-session', isAuthenticated, async (req: any, res) => {
      try {
        const session = await stripeService.createCustomerPortalSession(req.user.id);
        res.json({ success: true, url: session.url });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/stripe/webhook', async (req, res) => {
      try {
        const signature = req.headers['stripe-signature'] as string;
        const event = stripeService.verifyWebhookSignature(req.body, signature);
        
        // Process webhook event
        if (event.type === 'customer.subscription.created') {
          // Handle subscription created
          res.json({ received: true });
        } else {
          res.json({ received: true });
        }
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    app.get('/api/subscription/status', isAuthenticated, addSubscriptionInfo(stripeService), (req: any, res) => {
      res.json({
        success: true,
        subscription: req.subscription,
      });
    });

    app.get('/api/test/pro-only', isAuthenticated, requireProSubscription(stripeService), (req, res) => {
      res.json({ message: 'Pro feature accessed' });
    });

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

    testUserId = registerResponse.body.user.id;

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session successfully', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Cookie', `access_token=${authToken}`)
        .send({ priceId: 'price_test_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.sessionUrl).toBe('https://checkout.stripe.com/test');
    });

    it('should require authentication for checkout session', async () => {
      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .send({ priceId: 'price_test_123' })
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });

    it('should handle Stripe errors gracefully', async () => {
      // Mock Stripe error
      const mockStripe = require('stripe');
      mockStripe().checkout.sessions.create.mockRejectedValueOnce(new Error('Stripe error'));

      const response = await request(app)
        .post('/api/stripe/create-checkout-session')
        .set('Cookie', `access_token=${authToken}`)
        .send({ priceId: 'price_test_123' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Stripe error');
    });
  });

  describe('Customer Portal', () => {
    it('should create customer portal session', async () => {
      // First create a customer
      await prisma.user.update({
        where: { id: testUserId },
        data: { stripeCustomerId: 'cus_test_123' },
      });

      const response = await request(app)
        .post('/api/stripe/create-portal-session')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.url).toBe('https://billing.stripe.com/test');
    });

    it('should require authentication for portal session', async () => {
      const response = await request(app)
        .post('/api/stripe/create-portal-session')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('Webhook Handling', () => {
    it('should process webhook with valid signature', async () => {
      const webhookPayload = JSON.stringify({
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_123',
            customer: 'cus_test_123',
            status: 'active',
          },
        },
      });

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'test-signature')
        .send(webhookPayload)
        .expect(200);

      expect(response.body.received).toBe(true);
    });

    it('should reject webhook with invalid signature', async () => {
      // Mock signature verification failure
      const mockStripe = require('stripe');
      mockStripe().webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/stripe/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send('{}')
        .expect(400);

      expect(response.body.error).toBe('Invalid signature');
    });
  });

  describe('Subscription Status', () => {
    it('should return subscription status for authenticated user', async () => {
      const response = await request(app)
        .get('/api/subscription/status')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.subscription).toBeDefined();
    });

    it('should require authentication for subscription status', async () => {
      const response = await request(app)
        .get('/api/subscription/status')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('Pro Subscription Middleware', () => {
    it('should allow access for pro users', async () => {
      // Mock user as having active subscription
      jest.spyOn(stripeService, 'hasActiveSubscription').mockResolvedValue(true);

      const response = await request(app)
        .get('/api/test/pro-only')
        .set('Cookie', `access_token=${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Pro feature accessed');
    });

    it('should deny access for free users', async () => {
      // Mock user as not having active subscription
      jest.spyOn(stripeService, 'hasActiveSubscription').mockResolvedValue(false);

      const response = await request(app)
        .get('/api/test/pro-only')
        .set('Cookie', `access_token=${authToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('should require authentication for pro features', async () => {
      const response = await request(app)
        .get('/api/test/pro-only')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });
  });

  describe('StripeService Unit Tests', () => {
    it('should check active subscription correctly', async () => {
      // Create user with active subscription
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      const hasActive = await stripeService.hasActiveSubscription(testUserId);
      expect(hasActive).toBe(true);
    });

    it('should return false for expired subscription', async () => {
      // Create user with expired subscription
      await prisma.user.update({
        where: { id: testUserId },
        data: {
          subscriptionStatus: 'active',
          subscriptionPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        },
      });

      const hasActive = await stripeService.hasActiveSubscription(testUserId);
      expect(hasActive).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const hasActive = await stripeService.hasActiveSubscription('non-existent-id');
      expect(hasActive).toBe(false);
    });
  });
});
