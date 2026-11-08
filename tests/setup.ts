import '@testing-library/jest-dom';
import { useAuthStore } from '@/stores/authStore';

// In unit tests, run against in-memory state
useAuthStore.setState({ isDemoMode: true });

// Polyfill localStorage for Node 22 / vitest environments
if (typeof window !== 'undefined') {
  const store: Record<string, string> = {};
  const localStorageMock = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}
