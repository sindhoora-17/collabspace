import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client';

type Project = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    workspaceId: string;
};

type Workspace = {
    id: string;
    name: string;
};

export function WorkspacePage() {
    const { workspaceId } = useParams();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadWorkspace() {
            if (!workspaceId) {
                return;
            }

            try {
                const [workspaceResponse, projectsResponse] =
                    await Promise.all([
                        api.get<Workspace>(`/workspaces/${workspaceId}`),
                        api.get<Project[]>(
                            `/workspaces/${workspaceId}/projects`,
                        ),
                    ]);

                setWorkspace(workspaceResponse.data);
                setProjects(projectsResponse.data);
            } catch {
                setError('Could not load workspace.');
            } finally {
                setLoading(false);
            }
        }

        void loadWorkspace();
    }, [workspaceId]);

    if (loading) {
        return <p>Loading workspace...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (!workspace) {
        return <p>Workspace not found.</p>;
    }

    return (
        <main>
            <Link to="/dashboard">← Back to dashboard</Link>

            <h1>{workspace.name}</h1>

            <section>
                <h2>Projects</h2>

                {projects.length === 0 && (
                    <p>No projects yet.</p>
                )}

                {projects.map((project) => (
                    <article key={project.id}>
                        <h3>
                            <Link
                                to={`/workspaces/${workspaceId}/projects/${project.id}`}
                            >
                                {project.name}
                            </Link>
                        </h3>

                        {project.description && (
                            <p>{project.description}</p>
                        )}
                    </article>
                ))}
            </section>
        </main>
    );
}