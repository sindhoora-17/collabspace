import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {FormEvent} from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      setAuth(response.data.accessToken, response.data.user);

      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <main>
      <h1>CollabSpace</h1>
      <h2>Sign in</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}