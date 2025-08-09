import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            Welcome to Nucleus
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Sign in to find your perfect co-founder
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignedOut>
            <div className="space-y-3">
              <Button className="w-full" asChild>
                <SignInButton afterSignInUrl="/" />
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <SignUpButton afterSignUpUrl="/" />
              </Button>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">You are signed in!</p>
              <div className="flex items-center justify-center">
                <UserButton afterSignOutUrl="/" />
              </div>
              <Button 
                className="w-full" 
                onClick={() => window.location.href = "/"}
              >
                Go to Dashboard
              </Button>
            </div>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  );
}