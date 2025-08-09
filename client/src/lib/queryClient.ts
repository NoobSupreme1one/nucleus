import { QueryClient, QueryFunction, isServer } from "@tanstack/react-query";

interface ApiError extends Error {
  status?: number;
  statusText?: string;
}

async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const text = await res.text();
      errorMessage = text || res.statusText || `HTTP ${res.status}`;
    } catch {
      errorMessage = res.statusText || `HTTP ${res.status}`;
    }
    
    const error = new Error(errorMessage) as ApiError;
    error.status = res.status;
    error.statusText = res.statusText;
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    // Add timeout for better UX
    signal: AbortSignal.timeout(30000), // 30 seconds
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey, signal }) => {
    const url = queryKey.join("/") as string;
    
    const res = await fetch(url, {
      credentials: "include",
      signal,
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await res.json();
    }
    
    return await res.text() as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      // Better defaults for performance and UX
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on auth errors or client errors (4xx)
        if (error instanceof Error) {
          const apiError = error as ApiError;
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: "always",
      refetchOnReconnect: "always",
      // Only refetch on window focus if data is stale
      refetchOnMount: "always",
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof Error) {
          const apiError = error as ApiError;
          if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});
