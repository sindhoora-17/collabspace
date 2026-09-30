import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '../api/client';
import { PageState } from '../components/common/PageState';
import { AppHeader } from '../components/layout/AppHeader';

import '../styles/workspace.css';

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

    const [workspace, setWorkspace] =
        useState<Workspace | null>(null);

    const [projects, setProjects] =
        useState<Project[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [isCreateOpen, setIsCreateOpen] =
        useState(false);

    const [projectName, setProjectName] =
        useState('');

    const [
        projectDescription,
        setProjectDescription,
    ] = useState('');

    const [
        creatingProject,
        setCreatingProject,
    ] = useState(false);

    useEffect(() => {
        async function loadWorkspace() {
            if (!workspaceId) {
                return;
            }

            try {
                const [
                    workspaceResponse,
                    projectsResponse,
                ] = await Promise.all([
                    api.get<Workspace>(
                        `/workspaces/${workspaceId}`,
                    ),

                    api.get<Project[]>(
                        `/workspaces/${workspaceId}/projects`,
                    ),
                ]);

                setWorkspace(
                    workspaceResponse.data,
                );

                setProjects(
                    projectsResponse.data,
                );
            } catch {
                setError(
                    'Could not load workspace.',
                );
            } finally {
                setLoading(false);
            }
        }

        void loadWorkspace();
    }, [workspaceId]);

    async function createProject() {
        if (
            !workspaceId ||
            !projectName.trim()
        ) {
            return;
        }

        setCreatingProject(true);
        setError(null);

        try {
            await api.post(
                `/workspaces/${workspaceId}/projects`,
                {
                    name: projectName.trim(),
                    description:
                        projectDescription.trim() ||
                        undefined,
                },
            );

            const response =
                await api.get<Project[]>(
                    `/workspaces/${workspaceId}/projects`,
                );

            setProjects(response.data);

            setProjectName('');
            setProjectDescription('');
            setIsCreateOpen(false);
        } catch {
            setError(
                'Could not create project.',
            );
        } finally {
            setCreatingProject(false);
        }
    }

    if (loading) {
        return (
            <>
                <AppHeader />

                <PageState
                    title="Loading workspace"
                    message="Getting your projects ready..."
                />
            </>
        );
    }

    if (error && !workspace) {
        return (
            <>
                <AppHeader />

                <PageState
                    title="Could not load workspace"
                    message={error}
                    tone="error"
                />
            </>
        );
    }

    if (!workspace) {
        return (
            <>
                <AppHeader />

                <PageState
                    title="Workspace not found"
                    message="This workspace may have been removed or you may not have access."
                />
            </>
        );
    }

    return (
        <>
            <AppHeader />

            <main className="workspace-page">
                <div className="workspace-shell">
                    <Link
                        to="/dashboard"
                        className="workspace-back"
                    >
                        ← Back to dashboard
                    </Link>

                    <header className="workspace-header">
                        <div>
                            <h1 className="workspace-title">
                                {workspace.name}
                            </h1>

                            <p className="workspace-subtitle">
                                View and manage projects in this workspace.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="workspace-create-button"
                            onClick={() =>
                                setIsCreateOpen(true)
                            }
                        >
                            + New project
                        </button>
                    </header>

                    {error && (
                        <p className="workspace-error">
                            {error}
                        </p>
                    )}

                    <section className="workspace-section">
                        <div className="workspace-section-header">
                            <h2>Projects</h2>

                            <span className="project-count">
                                {projects.length}
                            </span>
                        </div>

                        {projects.length === 0 && (
                            <div className="workspace-empty">
                                <div className="workspace-empty-icon">
                                    +
                                </div>

                                <h3>No projects yet</h3>

                                <p>
                                    Projects created in this workspace
                                    will appear here.
                                </p>

                                <button
                                    type="button"
                                    className="workspace-empty-button"
                                    onClick={() =>
                                        setIsCreateOpen(true)
                                    }
                                >
                                    Create your first project
                                </button>
                            </div>
                        )}

                        {projects.length > 0 && (
                            <div className="project-grid">
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/workspaces/${workspaceId}/projects/${project.id}`}
                                        className="project-card"
                                    >
                                        <h3 className="project-card-title">
                                            {project.name}
                                        </h3>

                                        {project.description && (
                                            <p className="project-card-description">
                                                {
                                                    project.description
                                                }
                                            </p>
                                        )}

                                        <div className="project-card-footer">
                                            Updated{' '}
                                            {new Date(
                                                project.updatedAt,
                                            ).toLocaleDateString()}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {isCreateOpen && (
                        <div className="modal-backdrop">
                            <div className="modal-panel">
                                <div className="modal-header">
                                    <h2>Create project</h2>

                                    <p>
                                        Add a new project to{' '}
                                        {workspace.name}.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="project-name">
                                        Project name
                                    </label>

                                    <input
                                        id="project-name"
                                        className="form-control"
                                        value={projectName}
                                        onChange={(event) =>
                                            setProjectName(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="e.g. Website redesign"
                                        autoFocus
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="project-description">
                                        Description
                                    </label>

                                    <textarea
                                        id="project-description"
                                        className="form-control"
                                        value={
                                            projectDescription
                                        }
                                        onChange={(event) =>
                                            setProjectDescription(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="What is this project for?"
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => {
                                            setIsCreateOpen(
                                                false,
                                            );

                                            setProjectName('');
                                            setProjectDescription('');
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="primary-button"
                                        onClick={() =>
                                            void createProject()
                                        }
                                        disabled={
                                            creatingProject ||
                                            !projectName.trim()
                                        }
                                    >
                                        {creatingProject
                                            ? 'Creating...'
                                            : 'Create project'}
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