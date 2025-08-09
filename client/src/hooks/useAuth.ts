import { useAuth as useClerkAuth, useUser, useClerk } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User } from "@shared/types";

interface AuthState {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  isError: boolean;
  logout: () => void;
}

export function useAuth(): AuthState {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  
  // Only fetch user data from our API if Clerk user is signed in
  const { 
    data: user, 
    isLoading: isUserLoading, 
    error,
    isError 
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isSignedIn && isLoaded,
    retry: (failureCount, error) => {
      // Don't retry on auth errors or if not signed in
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
        return false;
      }
      return failureCount < 1; // Reduce retry attempts
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false, // Disable refetch on focus to reduce calls
    refetchOnReconnect: false,   // Disable refetch on reconnect
    refetchInterval: false,      // Disable automatic refetching
  });

  // Check if Clerk environment variables are present
  const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const logout = () => {
    if (clerkEnabled) {
      signOut();
    }
  };

  return useMemo(() => {
    if (clerkEnabled) {
      // Use Clerk authentication state - user is authenticated if Clerk says they're signed in
      // Don't depend on the API call for authentication status
      return {
        user: user ?? null,
        isLoading: !isLoaded,
        isAuthenticated: isSignedIn ?? false,
        error: error as Error | null,
        isError,
        logout,
      };
    } else {
      // Fallback to legacy authentication
      return {
        user: user ?? null,
        isLoading: isUserLoading,
        isAuthenticated: !!user,
        error: error as Error | null,
        isError,
        logout: () => {}, // No-op for fallback
      };
    }
  }, [user, isLoaded, isSignedIn, isUserLoading, error, isError, clerkEnabled, logout]);
}
