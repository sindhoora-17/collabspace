export type ActivityType =
  | 'TASK_CREATED'
  | 'TASK_UPDATED'
  | 'TASK_MOVED'
  | 'COMMENT_ADDED';

export type Activity = {
  id: string;
  type: ActivityType;
  message: string;
  metadata: {
    fromStatus?: string;
    toStatus?: string;
  } | null;
  createdAt: string;
  projectId: string;
  actorId: string;
  taskId: string | null;

  actor: {
    id: string;
    email: string;
    displayName: string;
  };

  task: {
    id: string;
    title: string;
  } | null;
};