import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export class StripeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  async createOrGetCustomer(userId: string): Promise<string> {
    try {
      // Check if user already has a Stripe customer ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          stripeCustomerId: true, 
          email: true, 
          firstName: true, 
          lastName: true 
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Return existing customer ID if available
      if (user.stripeCustomerId) {
        return user.stripeCustomerId;
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : undefined,
        metadata: {
          userId: userId,
        },
      });

      // Update user with Stripe customer ID
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating/getting Stripe customer:', error);
      throw new Error('Failed to create or retrieve customer');
    }
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    try {
      const customerId = await this.createOrGetCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
        },
      });

      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Create a customer portal session for subscription management
   */
  async createCustomerPortalSession(
    userId: string, 
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const customerId = await this.createOrGetCustomer(userId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw new Error('Failed to create customer portal session');
    }
  }

  /**
   * Get subscription details for a user
   */
  async getUserSubscription(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          stripeSubscriptionId: true,
          subscriptionStatus: true,
          subscriptionPeriodEnd: true,
          subscriptionCancelAtPeriodEnd: true,
          subscriptionTier: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        subscriptionId: user.stripeSubscriptionId,
        status: user.subscriptionStatus,
        periodEnd: user.subscriptionPeriodEnd,
        cancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
        tier: user.subscriptionTier,
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      throw new Error('Failed to get subscription details');
    }
  }

  /**
   * Update user subscription status from Stripe webhook
   */
  async updateSubscriptionFromWebhook(
    subscription: Stripe.Subscription,
    eventType: string
  ): Promise<void> {
    try {
      const customerId = subscription.customer as string;
      
      // Find user by Stripe customer ID
      const user = await this.prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (!user) {
        console.error('User not found for customer ID:', customerId);
        return;
      }

      // Determine subscription tier based on status
      const subscriptionTier = subscription.status === 'active' ? 'pro' : 'free';

      // Update user subscription details
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionTier: subscriptionTier,
          subscriptionPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
        },
      });

      console.log(`Updated subscription for user ${user.id}: ${subscription.status}`);
    } catch (error) {
      console.error('Error updating subscription from webhook:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { 
          subscriptionStatus: true,
          subscriptionPeriodEnd: true,
        },
      });

      if (!user) {
        return false;
      }

      // Check if subscription is active and not expired
      const isActive = user.subscriptionStatus === 'active';
      const notExpired = user.subscriptionPeriodEnd 
        ? user.subscriptionPeriodEnd > new Date() 
        : false;

      return isActive && notExpired;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}

export { stripe };
