import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables for tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('NEXT_PUBLIC_POCKETBASE_URL', 'http://localhost:8090');
vi.stubEnv('PERPLEXITY_API_KEY', 'test-key');
vi.stubEnv('PERPLEXITY_MODEL', 'sonar-pro');

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));