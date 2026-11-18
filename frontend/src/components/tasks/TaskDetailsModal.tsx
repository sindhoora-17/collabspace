import { useEffect } from 'react';

import '../../styles/kanban.css';
import { relativeTime } from '../../lib/format';
import type { Assignee, Task, TaskPriority, TaskStatus } from '../../types/tasks';
import { Avatar } from '../common/Avatar';

type WorkspaceMember = {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: { id: string; email: string; displayName: string };
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; email: string; displayName: string };
};

type TaskDetailsModalProps = {
  task: Task | null;
  members: WorkspaceMember[];
  comments: Comment[];
  newComment: string;
  loadingComments: boolean;
  postingComment: boolean;
  savingTask: boolean;
  deletingTask: boolean;
  onTaskChange: (task: Task) => void;
  onCommentChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onPostComment: () => void;
};

export function TaskDetailsModal({
  task,
  members,
  comments,
  newComment,
  loadingComments,
  postingComment,
  savingTask,
  deletingTask,
  onTaskChange,
  onCommentChange,
  onClose,
  onSave,
  onDelete,
  onPostComment,
}: TaskDetailsModalProps) {
  useEffect(() => {
    if (!task) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [task, onClose]);

  if (!task) return null;

  function getAssignee(userId: string): Assignee | null {
    const member = members.find((item) => item.user.id === userId);
    return member ? { ...member.user } : null;
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal-panel task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="task-modal-body">
          <div className="task-modal-main">
            <input
              id="task-title"
              className="task-title-input"
              aria-label="Task title"
              value={task.title}
              onChange={(event) => onTaskChange({ ...task, title: event.target.value })}
            />

            <label className="field-label" htmlFor="task-description">
              Description
            </label>
            <textarea
              id="task-description"
              className="form-control"
              rows={4}
              placeholder="Add more detail…"
              value={task.description ?? ''}
              onChange={(event) =>
                onTaskChange({ ...task, description: event.target.value })
              }
            />

            <section className="comments">
              <h3>
                Comments <span className="kanban-count">{comments.length}</span>
              </h3>

              {loadingComments && <p className="empty-text">Loading comments…</p>}

              {!loadingComments && comments.length === 0 && (
                <p className="empty-text">No comments yet. Start the conversation.</p>
              )}

              {comments.map((comment) => (
                <article key={comment.id} className="comment">
                  <Avatar id={comment.author.id} name={comment.author.displayName} size={28} />
                  <div>
                    <div className="comment-meta">
                      <strong>{comment.author.displayName}</strong>
                      <time title={new Date(comment.createdAt).toLocaleString()}>
                        {relativeTime(comment.createdAt)}
                      </time>
                    </div>
                    <p>{comment.body}</p>
                  </div>
                </article>
              ))}

              <div className="comment-composer">
                <textarea
                  className="form-control"
                  rows={2}
                  aria-label="Write a comment"
                  placeholder="Write a comment…"
                  value={newComment}
                  onChange={(event) => onCommentChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                      onPostComment();
                    }
                  }}
                />
                <div className="comment-composer-row">
                  <span className="hint">⌘/Ctrl + Enter to send</span>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={onPostComment}
                    disabled={postingComment || !newComment.trim()}
                  >
                    {postingComment ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <aside className="task-modal-side">
            <label className="field-label" htmlFor="task-status">Status</label>
            <select
              id="task-status"
              className="form-control"
              value={task.status}
              onChange={(event) =>
                onTaskChange({ ...task, status: event.target.value as TaskStatus })
              }
            >
              <option value="TODO">To do</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>

            <label className="field-label" htmlFor="task-priority">Priority</label>
            <select
              id="task-priority"
              className="form-control"
              value={task.priority}
              onChange={(event) =>
                onTaskChange({ ...task, priority: event.target.value as TaskPriority })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <label className="field-label" htmlFor="task-assignee">Assignee</label>
            <select
              id="task-assignee"
              className="form-control"
              value={task.assignee?.id ?? ''}
              onChange={(event) =>
                onTaskChange({ ...task, assignee: getAssignee(event.target.value) })
              }
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.displayName}
                </option>
              ))}
            </select>

            <label className="field-label" htmlFor="task-due">Due date</label>
            <input
              id="task-due"
              className="form-control"
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
              onChange={(event) =>
                onTaskChange({ ...task, dueDate: event.target.value || null })
              }
            />

            <button
              type="button"
              className="danger-link"
              onClick={onDelete}
              disabled={deletingTask}
            >
              {deletingTask ? 'Deleting…' : 'Delete task'}
            </button>
          </aside>
        </div>

        <footer className="task-modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={onSave}
            disabled={savingTask || deletingTask || !task.title.trim()}
          >
            {savingTask ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
