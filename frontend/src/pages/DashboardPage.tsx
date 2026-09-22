import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

type Workspace = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    members: {
        role: 'OWNER' | 'ADMIN' | 'MEMBER';
    }[];
};

export function DashboardPage() {
    const user = useAuthStore((state) => state.user);

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadWorkspaces() {
            try {
                const response = await api.get<Workspace[]>('/workspaces');
                setWorkspaces(response.data);
            } catch {
                setError('Could not load workspaces.');
            } finally {
                setLoading(false);
            }
        }

        void loadWorkspaces();
    }, []);

    return (
        <main>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.displayName ?? 'User'}.</p>

            <section>
                <h2>Your workspaces</h2>

                {loading && <p>Loading...</p>}

                {error && <p>{error}</p>}

                {!loading && !error && workspaces.length === 0 && (
                    <p>You do not have any workspaces yet.</p>
                )}

                {
                    workspaces.map((workspace) => (
                        <article key={workspace.id}>
                            <h3>
                                <Link to={`/workspaces/${workspace.id}`}>
                                    {workspace.name}
                                </Link>
                            </h3>

                            <p>
                                Role: {workspace.members[0]?.role ?? 'MEMBER'}
                            </p>
                        </article>
                    ))
                }
      </section>
        </main>
    );
}