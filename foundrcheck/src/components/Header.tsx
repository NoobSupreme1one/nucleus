'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser, isAuthenticated, signOut } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Header() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
    
    // Listen for auth changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    signOut();
    setUser(null);
    router.push('/');
  };

  if (loading) {
    return (
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              FoundrCheck
            </Link>
            <div className="h-10 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
            FoundrCheck
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/leaderboard" 
              className="text-sm hover:text-primary transition-colors"
            >
              Leaderboard
            </Link>
            {user && (
              <>
                <Link 
                  href="/submit" 
                  className="text-sm hover:text-primary transition-colors"
                >
                  Submit Idea
                </Link>
                <Link 
                  href="/profile" 
                  className="text-sm hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {(user?.name as string) || (user?.username as string) || 'User'}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}