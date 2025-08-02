import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { apiRequest } from "../lib/api";

interface SubscriptionStatus {
  subscriptionId: string | null;
  status: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  tier: 'free' | 'pro';
}

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get current subscription status
  const { data: subscription } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/subscription/status"],
    enabled: isAuthenticated,
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/create-checkout-session", {
        priceId: import.meta.env.VITE_STRIPE_PRICE_ID || "price_1234567890", // Replace with actual price ID
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
    },
  });

  // Create customer portal session mutation
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscription/create-portal-session");
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    createCheckoutMutation.mutate();
  };

  const handleManageSubscription = () => {
    createPortalMutation.mutate();
  };

  const isProUser = subscription?.tier === 'pro' && subscription?.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of your startup ideas with our Pro features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-3xl font-bold">$0<span className="text-lg font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  5 idea validations per hour
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Basic AI analysis
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Co-founder matching
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Portfolio submissions
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Leaderboard access
                </li>
              </ul>
              {!isProUser && (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Current Plan
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-blue-500 shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For serious entrepreneurs</CardDescription>
              <div className="text-3xl font-bold">$29<span className="text-lg font-normal">/month</span></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <strong>Unlimited</strong> idea validations
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <strong>Advanced AI analysis</strong> with detailed reports
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  <strong>Pro business reports</strong> with market insights
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Priority co-founder matching
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Export capabilities
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-green-500 mr-3"></i>
                  Priority customer support
                </li>
              </ul>
              
              {isProUser ? (
                <div className="space-y-2">
                  <Badge className="w-full justify-center py-2 bg-green-500">
                    Current Plan
                  </Badge>
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline" 
                    className="w-full"
                    disabled={createPortalMutation.isPending}
                  >
                    {createPortalMutation.isPending ? "Loading..." : "Manage Subscription"}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleUpgrade}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  disabled={createCheckoutMutation.isPending}
                >
                  {createCheckoutMutation.isPending ? "Loading..." : "Upgrade to Pro"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status */}
        {isAuthenticated && subscription && (
          <div className="mt-12 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Current Plan:</span>
                    <Badge className={subscription.tier === 'pro' ? 'bg-blue-500 ml-2' : 'bg-gray-500 ml-2'}>
                      {subscription.tier.toUpperCase()}
                    </Badge>
                  </div>
                  {subscription.status && (
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className="ml-2 capitalize">{subscription.status}</span>
                    </div>
                  )}
                  {subscription.periodEnd && (
                    <div>
                      <span className="font-medium">Next Billing:</span>
                      <span className="ml-2">{new Date(subscription.periodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                  {subscription.cancelAtPeriodEnd && (
                    <div className="col-span-2">
                      <Badge variant="destructive">
                        Subscription will cancel at period end
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have Pro access until the end of your billing period.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards through Stripe's secure payment processing.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">Our free plan gives you access to core features. You can upgrade to Pro at any time to unlock advanced features.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
