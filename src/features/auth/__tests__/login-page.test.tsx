/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '@/features/auth/components/login-page';
import { authApi } from '@/features/auth/lib/api/auth';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { ApiError } from '@/features/hr/lib/api/client';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/features/hr/lib/api/global-error-handler', () => ({
  handleApiError: jest.fn().mockReturnValue({ status: 0, displayMessage: '', debugPayload: null, envelope: null }),
}));

jest.mock('@/features/auth/lib/api/auth', () => ({
  authApi: { login: jest.fn() },
}));

const mockAuthState = {
  setUser: jest.fn(),
  setAccessProfile: jest.fn(),
  accessProfile: null as { defaultCompanyId?: string } | null,
  activeCompanyId: null as string | null,
};

jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: Object.assign(
    jest.fn((selector: (s: typeof mockAuthState) => unknown) => selector(mockAuthState)),
    { getState: jest.fn(() => mockAuthState) },
  ),
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/shared/config', () => ({
  publicConfig: { apiUrl: '/api-backend', appName: 'نظام الموارد البشرية', appEnv: 'test' },
}));

const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;

function renderLoginPage() {
  return render(<LoginPage />);
}

async function fillLoginForm() {
  await userEvent.clear(screen.getByLabelText(/البريد الإلكتروني/i));
  await userEvent.type(screen.getByLabelText(/البريد الإلكتروني/i), 'admin@test.com');
  await userEvent.clear(screen.getByLabelText(/كلمة المرور/i));
  await userEvent.type(screen.getByLabelText(/كلمة المرور/i), 'Admin123!');
}

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLoginPage();
    expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderLoginPage();
    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'not-an-email');
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/بريد إلكتروني غير صالح/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for short password', async () => {
    renderLoginPage();
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, '123');
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/6 أحرف على الأقل/i)).toBeInTheDocument();
    });
  });

  it('calls authApi.login with trimmed lowercase email on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: 'tok',
      userId: 'u1',
      user: { id: 'u1', email: 'admin@test.com', phone: null },
      accessProfile: {
        userId: 'u1',
        defaultCompanyId: 'c1',
        defaultBranchId: null,
        companies: [],
      },
    });

    renderLoginPage();
    const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
    const passwordInput = screen.getByLabelText(/كلمة المرور/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, '  Admin@Test.com  ');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'Admin123!');
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@test.com',
        password: 'Admin123!',
      });
    });
  });

  it('shows loading state while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderLoginPage();
    await fillLoginForm();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/جاري الدخول/i)).toBeInTheDocument();
    });
  });

  it('handles failed login via global error handler', async () => {
    const { handleApiError } = await import('@/features/hr/lib/api/global-error-handler');
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderLoginPage();
    await fillLoginForm();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(handleApiError).toHaveBeenCalledWith(
        expect.any(Error),
        'auth.login',
        { suppressRedirect: true },
      );
    });
  });

  it('shows wrong-credentials toast on 401 without redirect', async () => {
    const { handleApiError: realHandleApiError } = jest.requireActual<
      typeof import('@/features/hr/lib/api/global-error-handler')
    >('@/features/hr/lib/api/global-error-handler');
    const { handleApiError } = await import('@/features/hr/lib/api/global-error-handler');
    const { toast } = await import('sonner');
    (handleApiError as jest.Mock).mockImplementationOnce(realHandleApiError);

    mockLogin.mockRejectedValueOnce(
      new ApiError(
        {
          status: 401,
          message: 'Invalid email or password',
          data: null,
          error: { message: 'Invalid email or password', error: 'Unauthorized', statusCode: 401 },
        },
        401,
      ),
    );

    renderLoginPage();
    await fillLoginForm();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });
  });

  it('re-enables submit button after failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('fail'));
    renderLoginPage();
    await fillLoginForm();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).not.toBeDisabled();
    });
  });
});
