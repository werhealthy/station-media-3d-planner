import '@testing-library/jest-dom/vitest'

// jsdom non implementa ResizeObserver; alcuni componenti (es. R3F Canvas
// mockati nei test) lo referenziano indirettamente tramite librerie terze.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver
}
