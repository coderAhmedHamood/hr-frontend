const REMEMBER_EMAIL_STORAGE_KEY = 'hr-login-remember-email-v1';

export function loadRememberedLoginEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (localStorage.getItem(REMEMBER_EMAIL_STORAGE_KEY) ?? '').trim();
  } catch {
    return '';
  }
}

export function persistRememberedLoginEmail(email: string, remember: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (remember && email.trim()) {
      localStorage.setItem(REMEMBER_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_STORAGE_KEY);
    }
  } catch {
    /* quota / private mode */
  }
}

type PasswordCredentialLike = Credential & { password: string; id: string };

function isPasswordCredential(credential: Credential | null): credential is PasswordCredentialLike {
  return (
    !!credential &&
    'password' in credential &&
    typeof (credential as PasswordCredentialLike).password === 'string' &&
    typeof credential.id === 'string'
  );
}

/** Read email/password from the browser password manager (never from app storage). */
export async function loadBrowserSavedCredentials(): Promise<{
  email: string;
  password: string;
} | null> {
  if (typeof window === 'undefined' || !window.isSecureContext || !navigator.credentials?.get) {
    return null;
  }

  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'optional',
    } as CredentialRequestOptions & { password?: boolean; mediation?: string });

    if (!isPasswordCredential(credential)) return null;

    return {
      email: credential.id.trim(),
      password: credential.password,
    };
  } catch {
    return null;
  }
}

/** Offer to save credentials in the browser/OS vault after a successful login. */
export async function storeBrowserCredentials(email: string, password: string): Promise<void> {
  if (typeof window === 'undefined' || !window.isSecureContext || !navigator.credentials?.store) {
    return;
  }

  const PasswordCredentialCtor = (
    window as Window & { PasswordCredential?: new (data: { id: string; password: string }) => Credential }
  ).PasswordCredential;

  if (!PasswordCredentialCtor) return;

  try {
    const credential = new PasswordCredentialCtor({
      id: email.trim().toLowerCase(),
      password,
    });
    await navigator.credentials.store(credential);
  } catch {
    /* user dismissed or browser blocked */
  }
}

export function buildLoginFormDefaults(): { email: string; password: string } {
  const isDev = process.env.NODE_ENV === 'development';
  const devEmail = isDev ? (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? '').trim() : '';
  const devPassword = isDev ? (process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? '').trim() : '';
  const rememberedEmail = loadRememberedLoginEmail();

  return {
    email: devEmail || rememberedEmail,
    password: devPassword,
  };
}
