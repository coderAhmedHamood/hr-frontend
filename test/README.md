# Test infrastructure

Shared scaffolding for tests that span multiple features. Keep **unit and component tests** next to the code they cover (`src/**/__tests__/`); use this folder for cross-cutting test utilities and integration tests.

## Layout

```
test/
├── fixtures/     # Reusable static test data (users, companies, API payloads)
├── mocks/        # Shared Jest mocks (Next.js router, auth store, etc.)
├── helpers/      # Render wrappers, query-client setup, common assertions
└── integration/  # Multi-module / API-contract tests (*.integration.test.ts)
```

## Conventions

| Test type | Location | File pattern |
|-----------|----------|--------------|
| Unit / service | `src/features/**/__tests__/` | `*.test.ts` |
| Component | `src/features/**/__tests__/` | `*.test.tsx` |
| Integration | `test/integration/` | `*.integration.test.ts(x)` |

## Usage

```tsx
import { renderWithProviders } from '@test/helpers/render-with-providers';
import { nextNavigationModuleMock } from '@test/mocks/next-navigation';
import { adminUser } from '@test/fixtures/auth-user';

jest.mock('next/navigation', () => nextNavigationModuleMock);

renderWithProviders(<MyComponent user={adminUser} />);
```
