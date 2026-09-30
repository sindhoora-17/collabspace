import { useEffect, useState } from 'react';
import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { api } from '../../api/client';
import {
  useAuthStore,
  type User,
} from '../../store/auth.store';

export function ProtectedRoute() {
  const accessToken = useAuthStore(
    (state) => state.accessToken,
  );

  const user = useAuthStore(
    (state) => state.user,
  );

  const setAuth = useAuthStore(
    (state) => state.setAuth,
  );

  const clearAuth = useAuthStore(
    (state) => state.clearAuth,
  );

  const [checkingAuth, setCheckingAuth] =
    useState(
      Boolean(accessToken && !user),
    );

  useEffect(() => {
    async function restoreUser() {
      if (!accessToken || user) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response =
          await api.get<User>('/auth/me');

        setAuth(
          accessToken,
          response.data,
        );
      } catch {
        clearAuth();
      } finally {
        setCheckingAuth(false);
      }
    }

    void restoreUser();
  }, [
    accessToken,
    user,
    setAuth,
    clearAuth,
  ]);

  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: '#64748b',
        }}
      >
        Restoring your session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}