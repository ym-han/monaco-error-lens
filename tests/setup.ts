/**
 * Vitest setup file for Monaco Error Lens tests
 */
import { vi } from 'vitest';

// Mock DOM APIs that may not be available in jsdom
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

// Mock console methods for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
declare global {
  interface CustomMatchers<R = unknown> {
    toBeValidColor(): R;
    toBeValidCSSClass(): R;
  }
}

// Custom Vitest matchers
expect.extend({
  toBeValidColor(received: string) {
    const isValid = /^(#[0-9A-F]{6}|#[0-9A-F]{3}|rgba?\([^)]+\))$/i.test(received);
    
    return {
      message: () => `expected ${received} to be a valid color`,
      pass: isValid,
    };
  },
  
  toBeValidCSSClass(received: string) {
    const isValid = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(received);
    
    return {
      message: () => `expected ${received} to be a valid CSS class name`,
      pass: isValid,
    };
  },
});