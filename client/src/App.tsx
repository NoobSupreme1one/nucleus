import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import IdeaValidation from "@/pages/idea-validation";
import ValidationResults from "@/pages/validation-results";
import Matching from "@/pages/matching";
import Leaderboard from "@/pages/leaderboard";
import Portfolio from "@/pages/portfolio";
import Matches from "@/pages/matches";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 pulse-glow">
            <i className="fas fa-handshake text-white text-2xl"></i>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
