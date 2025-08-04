import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { User } from "@shared/types";

interface AuthState {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  isError: boolean;
}

export function useAuth(): AuthState {
  const { 
    data: user, 
    isLoading, 
    error,
    isError 
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error) => {
      // Only retry on network errors, not 401/403
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  return useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      error: error as Error | null,
      isError,
    }),
    [user, isLoading, error, isError]
  );
}
