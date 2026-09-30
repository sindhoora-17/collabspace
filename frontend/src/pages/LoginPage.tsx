import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent } from 'react';

import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

import '../styles/auth.css';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] =
    useState<string | null>(null);
  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setSubmitting(true);

    try {
      const response =
        await api.post<LoginResponse>(
          '/auth/login',
          {
            email,
            password,
          },
        );

      setAuth(
        response.data.accessToken,
        response.data.user,
      );

      navigate('/dashboard');
    } catch {
      setError(
        'Invalid email or password.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            C
          </div>

          <div className="auth-brand-name">
            CollabSpace
          </div>
        </div>

        <h1>
          Keep projects moving without losing context.
        </h1>

        <p>
          Plan work, assign tasks, leave comments,
          and see team activity in real time from one
          shared workspace.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Realtime project updates
          </div>

          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Shared Kanban workflows
          </div>

          <div className="auth-feature">
            <span className="auth-feature-dot" />
            Activity history and comments
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your workspace.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="auth-field">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value,
                  )
                }
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          <div className="auth-footer">
            CollabSpace · Collaborative project workspace
          </div>
        </div>
      </section>
    </main>
  );
}