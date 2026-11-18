import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
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
import { Avatar } from '../components/common/Avatar';

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
            label: 'To do',
        },
        {
            status: 'IN_PROGRESS',
            label: 'In progress',
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
    // Load errors replace the page; action errors only show a toast.
    const [actionError, setActionError] =
        useState<string | null>(null);
    const [workspaceName, setWorkspaceName] =
        useState('Workspace');
    const [newTaskStatus, setNewTaskStatus] =
        useState<TaskStatus>('TODO');
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor),
    );
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

    const [selectedTaskDirty, setSelectedTaskDirty] =
        useState(false);

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
                    workspaceResponse,
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
                    api.get<{ name: string }>(
                        `/workspaces/${workspaceId}`,
                    ),
                ]);

                setWorkspaceName(workspaceResponse.data.name);

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

                    status: newTaskStatus,

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
            setActionError('Could not create task.');
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

            setActionError('Could not move task.');
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

                        status: selectedTask.status,

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

            setSelectedTaskDirty(false);
            setSelectedTask(null);
        } catch {
            setActionError('Could not update task.');
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
            setActionError('Could not load comments.');
        } finally {
            setLoadingComments(false);
        }
    }

    function openTask(task: Task) {
        setSelectedTask(task);
        setSelectedTaskDirty(false);

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
            setActionError('Could not add comment.');
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

            setSelectedTaskDirty(false);
            setSelectedTask(null);
            setComments([]);
            setNewComment('');
        } catch {
            setActionError('Could not delete task.');
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
        useCallback(
            (task: Task) => {
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
                            currentTask.id !== task.id
                        ) {
                            return currentTask;
                        }

                        if (selectedTaskDirty) {
                            setActionError(
                                'This task was updated elsewhere. Your unsaved edits were kept.',
                            );
                            return currentTask;
                        }

                        return task;
                    },
                );
            },
            [selectedTaskDirty],
        );

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
                    setSelectedTaskDirty(false);
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
                    <header className="project-header">
                        <div className="project-header-main">
                            <nav className="breadcrumbs" aria-label="Breadcrumb">
                                <Link to={`/workspaces/${workspaceId}`}>
                                    {workspaceName}
                                </Link>
                                <span aria-hidden="true">/</span>
                                <span aria-current="page">{project.name}</span>
                            </nav>
                            <h1>{project.name}</h1>
                            {project.description && <p>{project.description}</p>}
                        </div>

                        <div className="project-actions">
                            <div className="avatar-stack">
                                {members.slice(0, 4).map((member) => (
                                    <Avatar
                                        key={member.user.id}
                                        id={member.user.id}
                                        name={member.user.displayName}
                                        size={28}
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => {
                                    setNewTaskStatus('TODO');
                                    setIsCreateModalOpen(true);
                                }}
                            >
                                New task
                            </button>
                        </div>
                    </header>

                    <div className="board-layout">
                        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                            <div className="kanban-board">
                                {columns.map((column) => (
                                    <KanbanColumn
                                        key={column.status}
                                        status={column.status}
                                        label={column.label}
                                        tasks={tasks.filter(
                                            (task) => task.status === column.status,
                                        )}
                                        onOpenTask={openTask}
                                        onAddTask={(status) => {
                                            setNewTaskStatus(status);
                                            setIsCreateModalOpen(true);
                                        }}
                                    />
                                ))}
                            </div>
                        </DndContext>

                        <ActivityPanel
                            activities={activities}
                            loading={loadingActivity}
                        />
                    </div>

                    {actionError && (
                        <div className="toast" role="alert">
                            {actionError}
                            <button type="button" onClick={() => setActionError(null)}>
                                Dismiss
                            </button>
                        </div>
                    )}

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
                        onTaskChange={(task) => {
                            setSelectedTask(task);
                            setSelectedTaskDirty(true);
                        }}
                        onCommentChange={
                            setNewComment
                        }
                        onClose={() => {
                            setSelectedTask(null);
                            setSelectedTaskDirty(false);
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