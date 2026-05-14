'use client';

import { LogIn, LogOut, MessageSquare, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { useAuth } from './auth/auth-provider';

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, status, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand-link" href="/messages" aria-label="Messages">
            <span className="brand-mark">
              <MessageSquare aria-hidden="true" />
            </span>
            <span>Messages</span>
          </Link>

          <nav className="nav-actions" aria-label="Primary navigation">
            {status === 'authenticated' && user ? (
              <>
                <span className="account-label">{user.displayName}</span>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {pathname !== '/login' ? (
                  <Link className="button button-secondary" href="/login">
                    <LogIn aria-hidden="true" />
                    <span>Login</span>
                  </Link>
                ) : null}
                {pathname !== '/register' ? (
                  <Link className="button button-primary" href="/register">
                    <UserPlus aria-hidden="true" />
                    <span>Register</span>
                  </Link>
                ) : null}
              </>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
