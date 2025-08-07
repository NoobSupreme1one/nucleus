import { Router, Response, Request } from "express";
import express from "express";
import { StripeService } from "../services/stripe";
import { ErrorTracker } from "../services/sentry";
import { getAuthMiddleware } from "../auth/auth-factory";
import { 
  AuthenticatedRequest, 
  asyncHandler, 
  handleRouteError, 
  getStorage
} from "./shared";

export const subscriptionRouter = Router();

// Get authenticated middleware
const getAuth = () => getAuthMiddleware();

// Initialize services
const initServices = () => {
  const storage = getStorage();
  const prisma = (storage as any).prisma;
  return {
    stripeService: new StripeService(prisma),
    prisma
  };
};

// Stripe webhook endpoint (must be before JSON parsing middleware)
subscriptionRouter.post('/stripe/webhook', 
  express.raw({ type: 'application/json' }), 
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { stripeService, prisma } = initServices();
      const signature = req.headers['stripe-signature'] as string;
      const event = stripeService.verifyWebhookSignature(req.body, signature);

      console.log('Received Stripe webhook:', event.type);

      // Handle subscription events
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as any;
          await stripeService.updateSubscriptionFromWebhook(subscription, event.type);

          // Log subscription event for audit trail
          if (subscription.customer) {
            const user = await prisma.user.findFirst({
              where: { stripeCustomerId: subscription.customer },
            });

            if (user) {
              await prisma.subscriptionEvent.create({
                data: {
                  userId: user.id,
                  stripeEventId: event.id,
                  eventType: event.type,
                  subscriptionId: subscription.id,
                  eventData: event.data.object,
                },
              });
            }
          }
          break;

        case 'invoice.payment_succeeded':
        case 'invoice.payment_failed':
          console.log(`Payment ${event.type} for invoice:`, event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      
      // Track payment errors with Sentry
      ErrorTracker.trackPaymentError(error as Error, {
        stripeEventType: req.body?.type,
      });
      
      res.status(400).json({ error: 'Webhook error' });
    }
  })
);

// Create checkout session
subscriptionRouter.post('/create-checkout-session', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stripeService } = initServices();
      const userId = req.user.id;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const session = await stripeService.createCheckoutSession(
        userId,
        priceId,
        `${req.headers.origin}/dashboard?subscription=success`,
        `${req.headers.origin}/pricing?subscription=cancelled`
      );

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      handleRouteError(error as Error, req, res, 'Failed to create checkout session');
    }
  })
);

// Create customer portal session
subscriptionRouter.post('/create-portal-session', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stripeService } = initServices();
      const userId = req.user.id;

      const session = await stripeService.createCustomerPortalSession(
        userId,
        `${req.headers.origin}/dashboard`
      );

      res.json({ url: session.url });
    } catch (error) {
      handleRouteError(error as Error, req, res, 'Failed to create portal session');
    }
  })
);

// Get subscription status
subscriptionRouter.get('/status', 
  getAuth(),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stripeService } = initServices();
      const userId = req.user.id;
      const subscription = await stripeService.getUserSubscription(userId);
      res.json(subscription);
    } catch (error) {
      handleRouteError(error as Error, req, res, 'Failed to get subscription status');
    }
  })
);