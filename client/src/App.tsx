import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { initializePerformanceOptimizations } from "@/lib/performance";
import { handleOAuthCallback } from "@/lib/oauthCallback";
import { useEffect } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import IdeaValidation from "@/pages/idea-validation";
import ValidationResults from "@/pages/validation-results";
import Matching from "@/pages/matching";
import Leaderboard from "@/pages/leaderboard";
import Portfolio from "@/pages/portfolio";
import Matches from "@/pages/matches";
import Pricing from "@/pages/pricing";
import Demo from "@/pages/demo";
import MockLanding from "@/pages/mock";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-handshake text-white text-2xl"></i>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/demo" component={Demo} />
      <Route path="/mock/:slug" component={MockLanding} />
      <Route path="/profile" component={Profile} />
      
      {/* Conditional routing based on authentication */}
      {!isAuthenticated && <Route path="/" component={Landing} />}
      {isAuthenticated && (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/validate-idea" component={IdeaValidation} />
          <Route path="/validation-results/:ideaId" component={ValidationResults} />
          <Route path="/matching" component={Matching} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/portfolio" component={Portfolio} />
          <Route path="/matches" component={Matches} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize performance optimizations on app load
    initializePerformanceOptimizations();
    
    // Handle OAuth callback if tokens are present in URL
    handleOAuthCallback();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
