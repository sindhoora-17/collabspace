import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuthStore } from '../../store/auth.store';

import '../../styles/app-shell.css';

export function AppHeader() {
  const navigate = useNavigate();

  const user = useAuthStore(
    (state) => state.user,
  );

  const clearAuth = useAuthStore(
    (state) => state.clearAuth,
  );

  const [menuOpen, setMenuOpen] =
    useState(false);

  const initial =
    user?.displayName
      ?.charAt(0)
      .toUpperCase() ?? 'U';

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link
          to="/dashboard"
          className="app-brand"
        >
          <span className="app-brand-mark">
            C
          </span>

          <span className="app-brand-name">
            CollabSpace
          </span>
        </Link>

        <div className="app-header-right">
          <Link
            to="/dashboard"
            className="app-nav-link"
          >
            Dashboard
          </Link>

          <div className="app-user-menu">
            <button
              type="button"
              className="app-user app-user-button"
              onClick={() =>
                setMenuOpen(
                  (current) => !current,
                )
              }
            >
              <div className="app-user-avatar">
                {initial}
              </div>

              <div className="app-user-info">
                <span className="app-user-name">
                  {user?.displayName ??
                    'User'}
                </span>

                {user?.email && (
                  <span className="app-user-email">
                    {user.email}
                  </span>
                )}
              </div>

              <span className="app-user-chevron">
                ▾
              </span>
            </button>

            {menuOpen && (
              <div className="app-user-dropdown">
                <div className="app-user-dropdown-header">
                  <strong>
                    {user?.displayName ??
                      'User'}
                  </strong>

                  {user?.email && (
                    <span>
                      {user.email}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="app-user-dropdown-action"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}