import '@testing-library/jest-dom';

// Browser APIs not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

// Suppress noisy act() warnings from async state updates in tests
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg: string, ...args: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('act(')) return;
    originalError(msg, ...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
