'use client';

import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '../../components/auth/auth-provider';
import { ApiError } from '../../lib/api-client';
import { getSafeNextPath } from '../../lib/navigation';

export default function RegisterPage() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await register({ displayName, email, password });
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
          <h1 className="auth-title">Register</h1>
          <p className="auth-copy">Create your account.</p>
        </header>

        <form className="form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-error">{error}</div> : null}

          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
              required
            />
          </div>

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
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={128}
              required
            />
          </div>

          <button className="button button-primary button-full" type="submit" disabled={isSubmitting}>
            <UserPlus aria-hidden="true" />
            <span>{isSubmitting ? 'Creating account' : 'Register'}</span>
          </button>
        </form>

        <p className="form-footer">
          Already registered?{' '}
          <Link className="text-link" href="/login">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.details[0]?.message ?? error.message;
  }

  return 'Registration failed.';
}
