import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';

import { api } from '../api/client';
import { useProjectSocket } from '../hooks/useProjectSocket';

import { PageState } from '../components/common/PageState';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskDetailsModal } from '../components/tasks/TaskDetailsModal';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { ActivityPanel } from '../components/activity/ActivityPanel';
import type { Activity } from '../types/activity';

import { AppHeader } from '../components/layout/AppHeader';

import type {
    Task,
    TaskPriority,
    TaskStatus,
} from '../types/tasks';

type WorkspaceMember = {
    id: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    user: {
        id: string;
        email: string;
        displayName: string;
    };
};

type Project = {
    id: string;
    name: string;
    description: string | null;
};

type Comment = {
    id: string;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        email: string;
        displayName: string;
    };
};

const columns: {
    status: TaskStatus;
    label: string;
}[] = [
        {
            status: 'TODO',
            label: 'To Do',
        },
        {
            status: 'IN_PROGRESS',
            label: 'In Progress',
        },
        {
            status: 'REVIEW',
            label: 'Review',
        },
        {
            status: 'DONE',
            label: 'Done',
        },
    ];

export function ProjectBoardPage() {
    const { workspaceId, projectId } = useParams();

    const [project, setProject] =
        useState<Project | null>(null);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] =
        useState<WorkspaceMember[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] =
        useState<string | null>(null);

    const [
        isCreateModalOpen,
        setIsCreateModalOpen,
    ] = useState(false);

    const [newTaskTitle, setNewTaskTitle] =
        useState('');

    const [
        newTaskDescription,
        setNewTaskDescription,
    ] = useState('');

    const [
        newTaskPriority,
        setNewTaskPriority,
    ] = useState<TaskPriority>('MEDIUM');

    const [
        newTaskDueDate,
        setNewTaskDueDate,
    ] = useState('');

    const [
        newTaskAssigneeId,
        setNewTaskAssigneeId,
    ] = useState('');

    const [creatingTask, setCreatingTask] =
        useState(false);

    const [selectedTask, setSelectedTask] =
        useState<Task | null>(null);

    const [savingTask, setSavingTask] =
        useState(false);

    const [deletingTask, setDeletingTask] =
        useState(false);

    const [comments, setComments] =
        useState<Comment[]>([]);

    const [newComment, setNewComment] =
        useState('');

    const [
        loadingComments,
        setLoadingComments,
    ] = useState(false);

    const [
        postingComment,
        setPostingComment,
    ] = useState(false);

    const [activities, setActivities] =
        useState<Activity[]>([]);

    const [loadingActivity, setLoadingActivity] =
        useState(true);

    useEffect(() => {
        async function loadBoard() {
            if (!workspaceId || !projectId) {
                return;
            }

            try {
                const [
                    projectResponse,
                    tasksResponse,
                    membersResponse,
                    activityResponse,
                ] = await Promise.all([
                    api.get<Project>(
                        `/workspaces/${workspaceId}/projects/${projectId}`,
                    ),

                    api.get<Task[]>(
                        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
                    ),

                    api.get<WorkspaceMember[]>(
                        `/workspaces/${workspaceId}/members`,
                    ),
                    api.get<Activity[]>(
                        `/workspaces/${workspaceId}/projects/${projectId}/activity`,
                    ),
                ]);

                setProject(projectResponse.data);
                setTasks(tasksResponse.data);
                setMembers(membersResponse.data);
                setActivities(activityResponse.data);
                setLoadingActivity(false);
            } catch {
                setError(
                    'Could not load project board.',
                );
            } finally {
                setLoading(false);
                setLoadingActivity(false);
            }
        }

        void loadBoard();
    }, [workspaceId, projectId]);

    async function createTask() {
        if (
            !workspaceId ||
            !projectId ||
            !newTaskTitle.trim()
        ) {
            return;
        }

        setCreatingTask(true);
        setError(null);

        try {
            const response = await api.post<Task>(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
                {
                    title: newTaskTitle.trim(),

                    description:
                        newTaskDescription.trim() ||
                        undefined,

                    priority: newTaskPriority,

                    status: 'TODO',

                    dueDate:
                        newTaskDueDate || undefined,

                    assigneeId:
                        newTaskAssigneeId ||
                        undefined,
                },
            );

            setTasks((currentTasks) => {
                const alreadyExists =
                    currentTasks.some(
                        (task) =>
                            task.id ===
                            response.data.id,
                    );

                if (alreadyExists) {
                    return currentTasks;
                }

                return [
                    ...currentTasks,
                    response.data,
                ];
            });

            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskPriority('MEDIUM');
            setNewTaskDueDate('');
            setNewTaskAssigneeId('');

            setIsCreateModalOpen(false);
        } catch {
            setError(
                'Could not create task.',
            );
        } finally {
            setCreatingTask(false);
        }
    }

    async function handleDragEnd(
        event: DragEndEvent,
    ) {
        const { active, over } = event;

        if (
            !over ||
            !workspaceId ||
            !projectId
        ) {
            return;
        }

        const taskId = String(active.id);

        const newStatus = String(
            over.id,
        ) as TaskStatus;

        if (
            !columns.some(
                (column) =>
                    column.status === newStatus,
            )
        ) {
            return;
        }

        const task = tasks.find(
            (currentTask) =>
                currentTask.id === taskId,
        );

        if (
            !task ||
            task.status === newStatus
        ) {
            return;
        }

        const previousStatus = task.status;

        setTasks((currentTasks) =>
            currentTasks.map(
                (currentTask) =>
                    currentTask.id === taskId
                        ? {
                            ...currentTask,
                            status: newStatus,
                        }
                        : currentTask,
            ),
        );

        try {
            const response =
                await api.patch<Task>(
                    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
                    {
                        status: newStatus,
                    },
                );

            setTasks((currentTasks) =>
                currentTasks.map(
                    (currentTask) =>
                        currentTask.id === taskId
                            ? response.data
                            : currentTask,
                ),
            );
        } catch {
            setTasks((currentTasks) =>
                currentTasks.map(
                    (currentTask) =>
                        currentTask.id === taskId
                            ? {
                                ...currentTask,
                                status:
                                    previousStatus,
                            }
                            : currentTask,
                ),
            );

            setError(
                'Could not move task.',
            );
        }
    }

    async function saveSelectedTask() {
        if (
            !selectedTask ||
            !workspaceId ||
            !projectId
        ) {
            return;
        }

        setSavingTask(true);
        setError(null);

        try {
            const response =
                await api.patch<Task>(
                    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${selectedTask.id}`,
                    {
                        title: selectedTask.title.trim(),

                        description:
                            selectedTask.description?.trim() || null,

                        priority: selectedTask.priority,

                        dueDate:
                            selectedTask.dueDate || null,

                        assigneeId:
                            selectedTask.assignee?.id ?? null,
                    },
                );

            setTasks((currentTasks) =>
                currentTasks.map((task) =>
                    task.id ===
                        response.data.id
                        ? response.data
                        : task,
                ),
            );

            setSelectedTask(null);
        } catch {
            setError(
                'Could not update task.',
            );
        } finally {
            setSavingTask(false);
        }
    }

    async function loadComments(
        taskId: string,
    ) {
        if (
            !workspaceId ||
            !projectId
        ) {
            return;
        }

        setLoadingComments(true);

        try {
            const response =
                await api.get<Comment[]>(
                    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/comments`,
                );

            setComments(response.data);
        } catch {
            setError(
                'Could not load comments.',
            );
        } finally {
            setLoadingComments(false);
        }
    }

    function openTask(task: Task) {
        setSelectedTask(task);

        setComments([]);
        setNewComment('');

        void loadComments(task.id);
    }

    async function postComment() {
        if (
            !selectedTask ||
            !workspaceId ||
            !projectId ||
            !newComment.trim()
        ) {
            return;
        }

        setPostingComment(true);

        try {
            const response =
                await api.post<Comment>(
                    `/workspaces/${workspaceId}/projects/${projectId}/tasks/${selectedTask.id}/comments`,
                    {
                        body: newComment.trim(),
                    },
                );

            setComments(
                (currentComments) => {
                    const alreadyExists =
                        currentComments.some(
                            (comment) =>
                                comment.id ===
                                response.data.id,
                        );

                    if (alreadyExists) {
                        return currentComments;
                    }

                    return [
                        ...currentComments,
                        response.data,
                    ];
                },
            );

            setNewComment('');
        } catch {
            setError(
                'Could not add comment.',
            );
        } finally {
            setPostingComment(false);
        }
    }

    async function deleteSelectedTask() {
        if (
            !selectedTask ||
            !workspaceId ||
            !projectId
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Delete "${selectedTask.title}"? This cannot be undone.`,
        );

        if (!confirmed) {
            return;
        }

        setDeletingTask(true);
        setError(null);

        try {
            await api.delete(
                `/workspaces/${workspaceId}/projects/${projectId}/tasks/${selectedTask.id}`,
            );

            setTasks((currentTasks) =>
                currentTasks.filter(
                    (task) =>
                        task.id !== selectedTask.id,
                ),
            );

            setSelectedTask(null);
            setComments([]);
            setNewComment('');
        } catch {
            setError('Could not delete task.');
        } finally {
            setDeletingTask(false);
        }
    }

    const handleTaskCreated =
        useCallback((task: Task) => {
            setTasks((currentTasks) => {
                const alreadyExists =
                    currentTasks.some(
                        (currentTask) =>
                            currentTask.id ===
                            task.id,
                    );

                if (alreadyExists) {
                    return currentTasks;
                }

                return [
                    ...currentTasks,
                    task,
                ];
            });
        }, []);

    const handleTaskUpdated =
        useCallback((task: Task) => {
            setTasks((currentTasks) =>
                currentTasks.map(
                    (currentTask) =>
                        currentTask.id === task.id
                            ? task
                            : currentTask,
                ),
            );

            setSelectedTask(
                (currentTask) => {
                    if (
                        !currentTask ||
                        currentTask.id !==
                        task.id
                    ) {
                        return currentTask;
                    }

                    return task;
                },
            );
        }, []);

    const handleCommentCreated =
        useCallback(
            (comment: Comment) => {
                setComments(
                    (currentComments) => {
                        const alreadyExists =
                            currentComments.some(
                                (
                                    currentComment,
                                ) =>
                                    currentComment.id ===
                                    comment.id,
                            );

                        if (alreadyExists) {
                            return currentComments;
                        }

                        return [
                            ...currentComments,
                            comment,
                        ];
                    },
                );
            },
            [],
        );

    const handleActivityCreated = useCallback(
        (activity: Activity) => {
            setActivities((currentActivities) => {
                const alreadyExists = currentActivities.some(
                    (currentActivity) =>
                        currentActivity.id === activity.id,
                );

                if (alreadyExists) {
                    return currentActivities;
                }

                return [
                    activity,
                    ...currentActivities,
                ];
            });
        },
        [],
    );

    const handleTaskDeleted = useCallback(
        (taskId: string) => {
            setTasks((currentTasks) =>
                currentTasks.filter(
                    (task) => task.id !== taskId,
                ),
            );

            setSelectedTask((currentTask) => {
                if (
                    currentTask &&
                    currentTask.id === taskId
                ) {
                    setComments([]);
                    setNewComment('');

                    return null;
                }

                return currentTask;
            });
        },
        [],
    );

    useProjectSocket({
        projectId,

        selectedTaskId:
            selectedTask?.id,

        onTaskCreated:
            handleTaskCreated,

        onTaskUpdated:
            handleTaskUpdated,

        onTaskDeleted: handleTaskDeleted,
        onCommentCreated:
            handleCommentCreated,

        onActivityCreated:
            handleActivityCreated,
    });

    if (loading) {
        return (
            <>
                <AppHeader />
                <PageState
                    title="Loading project"
                    message="Getting the board ready..."
                />
            </>
        );
    }

    if (error) {
        return (
            <>
                <AppHeader />
                <PageState
                    title="Could not load project"
                    message={error}
                    tone="error"
                />
            </>
        );
    }

    if (!project) {
        return (
            <>
                <AppHeader />
                <PageState
                    title="Project not found"
                    message="This project may no longer exist."
                />
            </>
        );
    }

    return (
        <>
            <AppHeader />
            <main className="project-page">
                <div className="project-shell">
                    <Link
                        to={`/workspaces/${workspaceId}`}
                        className="project-back"
                    >
                        ← Back to workspace
                    </Link>
                    <header className="project-header">
                        <div className="project-header-main">
                            <div className="project-breadcrumbs">
                                <Link to="/dashboard">
                                    Dashboard
                                </Link>

                                <span>/</span>

                                <Link
                                    to={`/workspaces/${workspaceId}`}
                                >
                                    Workspace
                                </Link>

                                <span>/</span>

                                <span>{project.name}</span>
                            </div>

                            <div className="project-title-row">
                                <div>
                                    <h1>{project.name}</h1>

                                    {project.description && (
                                        <p>{project.description}</p>
                                    )}
                                </div>

                                <span className="project-task-count">
                                    {tasks.length}{' '}
                                    {tasks.length === 1
                                        ? 'task'
                                        : 'tasks'}
                                </span>
                            </div>
                        </div>

                        <div className="project-actions">
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                    setIsCreateModalOpen(true)
                                }
                            >
                                + New task
                            </button>
                        </div>
                    </header>

                    <div className="board-layout">
                        <DndContext onDragEnd={handleDragEnd}>
                            <div className="kanban-board">
                                <KanbanColumn
                                    status="TODO"
                                    label="To do"
                                    tasks={tasks.filter(
                                        (task) => task.status === 'TODO',
                                    )}
                                    onOpenTask={openTask}
                                />

                                <KanbanColumn
                                    status="IN_PROGRESS"
                                    label="In progress"
                                    tasks={tasks.filter(
                                        (task) =>
                                            task.status === 'IN_PROGRESS',
                                    )}
                                    onOpenTask={openTask}
                                />

                                <KanbanColumn
                                    status="REVIEW"
                                    label="Review"
                                    tasks={tasks.filter(
                                        (task) =>
                                            task.status === 'REVIEW',
                                    )}
                                    onOpenTask={openTask}
                                />

                                <KanbanColumn
                                    status="DONE"
                                    label="Done"
                                    tasks={tasks.filter(
                                        (task) => task.status === 'DONE',
                                    )}
                                    onOpenTask={openTask}
                                />
                            </div>
                        </DndContext>

                        <ActivityPanel
                            activities={activities}
                            loading={loadingActivity}
                        />
                    </div>

                    <CreateTaskModal
                        isOpen={
                            isCreateModalOpen
                        }
                        title={newTaskTitle}
                        description={
                            newTaskDescription
                        }
                        priority={
                            newTaskPriority
                        }
                        dueDate={
                            newTaskDueDate
                        }
                        assigneeId={
                            newTaskAssigneeId
                        }
                        members={members}
                        creating={creatingTask}
                        onTitleChange={
                            setNewTaskTitle
                        }
                        onDescriptionChange={
                            setNewTaskDescription
                        }
                        onPriorityChange={
                            setNewTaskPriority
                        }
                        onDueDateChange={
                            setNewTaskDueDate
                        }
                        onAssigneeChange={
                            setNewTaskAssigneeId
                        }
                        onClose={() =>
                            setIsCreateModalOpen(
                                false,
                            )
                        }
                        onCreate={() =>
                            void createTask()
                        }
                    />

                    <TaskDetailsModal
                        task={selectedTask}
                        members={members}
                        comments={comments}
                        newComment={
                            newComment
                        }
                        loadingComments={
                            loadingComments
                        }
                        postingComment={
                            postingComment
                        }
                        savingTask={
                            savingTask
                        }
                        deletingTask={deletingTask}
                        onDelete={() =>
                            void deleteSelectedTask()
                        }
                        onTaskChange={
                            setSelectedTask
                        }
                        onCommentChange={
                            setNewComment
                        }
                        onClose={() => {
                            setSelectedTask(null);
                            setComments([]);
                            setNewComment('');
                        }}
                        onSave={() =>
                            void saveSelectedTask()
                        }
                        onPostComment={() =>
                            void postComment()
                        }
                    />
                </div>
            </main>
        </>
    );
}