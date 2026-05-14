'use client';

import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '../../components/auth/auth-provider';
import { ApiError } from '../../lib/api-client';
import { getSafeNextPath } from '../../lib/navigation';

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(getSafeNextPath());
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.replace(getSafeNextPath());
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page auth-page">
      <div className="auth-panel">
        <header className="auth-header">
          <h1 className="auth-title">Login</h1>
          <p className="auth-copy">Welcome back.</p>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <button className="button button-primary button-full" type="submit" disabled={isSubmitting}>
            <LogIn aria-hidden="true" />
            <span>{isSubmitting ? 'Logging in' : 'Login'}</span>
          </button>
        </form>

        <p className="form-footer">
          New here?{' '}
          <Link className="text-link" href="/register">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  return 'Login failed.';
}
