import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { AppHeader } from '../components/layout/AppHeader';

import '../styles/dashboard.css';

type Workspace = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members?: {
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
  }[];
};

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [creatingWorkspace, setCreatingWorkspace] =
    useState(false);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const response =
          await api.get<Workspace[]>('/workspaces');

        setWorkspaces(response.data);
      } catch {
        setError('Could not load workspaces.');
      } finally {
        setLoading(false);
      }
    }

    void loadWorkspaces();
  }, []);

  async function createWorkspace() {
    if (!workspaceName.trim()) {
      return;
    }

    setCreatingWorkspace(true);
    setError(null);

    try {
      await api.post('/workspaces', {
        name: workspaceName.trim(),
      });

      const response =
        await api.get<Workspace[]>('/workspaces');

      setWorkspaces(response.data);

      setWorkspaceName('');
      setIsCreateOpen(false);
    } catch {
      setError('Could not create workspace.');
    } finally {
      setCreatingWorkspace(false);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="dashboard-page">
        <div className="dashboard-shell">
          <header className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                Welcome back, {user?.displayName ?? 'User'}
              </h1>

              <p className="dashboard-subtitle">
                Pick up where you left off and jump into your team workspaces.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-create-button"
              onClick={() => setIsCreateOpen(true)}
            >
              + New workspace
            </button>
          </header>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <h2>Your workspaces</h2>

              <span className="workspace-count">
                {workspaces.length}
              </span>
            </div>

            {loading && (
              <p className="dashboard-state">
                Loading workspaces...
              </p>
            )}

            {error && (
              <p className="dashboard-error">
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              workspaces.length === 0 && (
                <div className="dashboard-empty">
                  <div className="dashboard-empty-icon">
                    +
                  </div>

                  <h3>No workspaces yet</h3>

                  <p>
                    Once you join or create a workspace,
                    it will show up here.
                  </p>
                </div>
              )}

            {!loading &&
              !error &&
              workspaces.length > 0 && (
                <div className="workspace-grid">
                  {workspaces.map((workspace) => {
                    const role =
                      workspace.members?.[0]?.role ??
                      'MEMBER';

                    return (
                      <Link
                        key={workspace.id}
                        to={`/workspaces/${workspace.id}`}
                        className="workspace-card"
                      >
                        <div className="workspace-card-top">
                          <h3 className="workspace-name">
                            {workspace.name}
                          </h3>

                          <span className="workspace-role">
                            {role}
                          </span>
                        </div>

                        <div className="workspace-meta">
                          Updated{' '}
                          {new Date(
                            workspace.updatedAt,
                          ).toLocaleDateString()}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
          </section>

          {isCreateOpen && (
            <div className="modal-backdrop">
              <div className="modal-panel">
                <div className="modal-header">
                  <h2>Create workspace</h2>

                  <p>
                    Create a shared space for your team and projects.
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="workspace-name">
                    Workspace name
                  </label>

                  <input
                    id="workspace-name"
                    className="form-control"
                    value={workspaceName}
                    onChange={(event) =>
                      setWorkspaceName(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Product Team"
                    autoFocus
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setWorkspaceName('');
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      void createWorkspace()
                    }
                    disabled={
                      creatingWorkspace ||
                      !workspaceName.trim()
                    }
                  >
                    {creatingWorkspace
                      ? 'Creating...'
                      : 'Create workspace'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}