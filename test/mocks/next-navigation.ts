/** Shared router mock fns — use with `jest.mock('next/navigation', () => nextNavigationModuleMock)`. */
export const mockRouterPush = jest.fn();
export const mockRouterReplace = jest.fn();
export const mockRouterBack = jest.fn();

export const nextNavigationModuleMock = {
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
};

export function resetNextNavigationMocks() {
  mockRouterPush.mockReset();
  mockRouterReplace.mockReset();
  mockRouterBack.mockReset();
}
