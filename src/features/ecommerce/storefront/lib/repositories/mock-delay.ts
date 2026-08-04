const MOCK_LATENCY_MS = 120;

export function mockRepositoryDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}
