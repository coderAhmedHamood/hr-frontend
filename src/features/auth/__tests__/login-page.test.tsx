/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from '@/features/auth/components/login-page';
import { authApi } from '@/features/auth/lib/api/auth';
import { useAuthStore } from '@/features/auth/lib/auth-store';

// ─── mocks ────────────────────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/features/auth/lib/api/auth', () => ({
  authApi: { login: jest.fn() },
}));

jest.mock('@/features/auth/lib/auth-store', () => ({
  useAuthStore: { getState: jest.fn(() => ({ setUser: jest.fn(), setAccessProfile: jest.fn() })) },
}));

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('@/shared/config', () => ({
  publicConfig: { apiUrl: '/api-backend' },
}));

// ─── helpers ──────────────────────────────────────────────────────────────────
const mockLogin = authApi.login as jest.MockedFunction<typeof authApi.login>;

function renderLoginPage() {
  return render(<LoginPage />);
}

// ─── tests ────────────────────────────────────────────────────────────────────
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
    mockLogin.mockImplementation(() => new Promise(() => {})); // never resolves
    renderLoginPage();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(screen.getByText(/جاري الدخول/i)).toBeInTheDocument();
    });
  });

  it('shows toast error on failed login', async () => {
    const { toast } = await import('sonner');
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    renderLoginPage();
    fireEvent.submit(screen.getByRole('button', { name: /تسجيل الدخول/i }).closest('form')!);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
