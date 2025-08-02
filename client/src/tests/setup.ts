import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  get length() { return 0; },
  key: vi.fn(() => null),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  get length() { return 0; },
  key: vi.fn(() => null),
};
global.sessionStorage = sessionStorageMock as Storage;

// Mock environment variables
vi.mock('../lib/env', () => ({
  env: {
    VITE_API_URL: 'http://localhost:3000',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
  },
}));

// Mock API client
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock router
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/', vi.fn()]),
  useRoute: vi.fn(() => [false, {}]),
  Link: ({ children, ...props }: any) => {
    return React.createElement('a', props, children);
  },
  Route: ({ children }: any) => children,
  Switch: ({ children }: any) => children,
}));
