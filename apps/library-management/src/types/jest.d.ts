import "@testing-library/jest-dom";

// Extend Jest matchers with Testing Library custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: unknown): R;
    }
  }
}
