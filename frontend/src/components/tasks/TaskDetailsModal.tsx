import '../../styles/kanban.css';

import type {
  Assignee,
  Task,
  TaskPriority,
} from '../../types/tasks';

type WorkspaceMember = {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    email: string;
    displayName: string;
  };
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

type TaskDetailsModalProps = {
  task: Task | null;
  members: WorkspaceMember[];

  comments: Comment[];
  newComment: string;
  loadingComments: boolean;
  postingComment: boolean;
  savingTask: boolean;

  onTaskChange: (task: Task) => void;
  onCommentChange: (value: string) => void;

  onClose: () => void;
  onSave: () => void;
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
  onTaskChange,
  onCommentChange,
  onClose,
  onSave,
  onPostComment,
}: TaskDetailsModalProps) {
  if (!task) {
    return null;
  }

  function getAssignee(
    userId: string,
  ): Assignee | null {
    const member = members.find(
      (item) => item.user.id === userId,
    );

    if (!member) {
      return null;
    }

    return {
      id: member.user.id,
      email: member.user.email,
      displayName: member.user.displayName,
    };
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div className="modal-header">
          <h2>Task details</h2>

          <p>
            Edit the task and collaborate with your team.
          </p>
        </div>

        <div className="form-group">
          <label>Title</label>

          <input
            className="form-control"
            value={task.title}
            onChange={(event) =>
              onTaskChange({
                ...task,
                title: event.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            className="form-control"
            value={task.description ?? ''}
            onChange={(event) =>
              onTaskChange({
                ...task,
                description: event.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Priority</label>

          <select
            className="form-control"
            value={task.priority}
            onChange={(event) =>
              onTaskChange({
                ...task,
                priority:
                  event.target.value as TaskPriority,
              })
            }
          >
            <option value="LOW">
              Low
            </option>

            <option value="MEDIUM">
              Medium
            </option>

            <option value="HIGH">
              High
            </option>

            <option value="URGENT">
              Urgent
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>Due date</label>

          <input
            className="form-control"
            type="date"
            value={
              task.dueDate
                ? task.dueDate.slice(0, 10)
                : ''
            }
            onChange={(event) =>
              onTaskChange({
                ...task,
                dueDate:
                  event.target.value || null,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Assignee</label>

          <select
            className="form-control"
            value={task.assignee?.id ?? ''}
            onChange={(event) =>
              onTaskChange({
                ...task,
                assignee:
                  getAssignee(event.target.value),
              })
            }
          >
            <option value="">
              Unassigned
            </option>

            {members.map((member) => (
              <option
                key={member.user.id}
                value={member.user.id}
              >
                {member.user.displayName}
              </option>
            ))}
          </select>
        </div>

        <hr className="modal-divider" />

        <section className="comments-section">
          <h3>Comments</h3>

          {loadingComments && (
            <p className="empty-text">
              Loading comments...
            </p>
          )}

          {!loadingComments &&
            comments.length === 0 && (
              <p className="empty-text">
                No comments yet.
              </p>
            )}

          {comments.map((comment) => (
            <article
              key={comment.id}
              className="comment-item"
            >
              <div className="comment-author">
                {comment.author.displayName}
              </div>

              <p className="comment-body">
                {comment.body}
              </p>

              <span className="comment-time">
                {new Date(
                  comment.createdAt,
                ).toLocaleString()}
              </span>
            </article>
          ))}

          <div className="comment-composer">
            <textarea
              className="form-control"
              value={newComment}
              onChange={(event) =>
                onCommentChange(event.target.value)
              }
              placeholder="Write a comment..."
            />

            <button
              type="button"
              className="primary-button"
              onClick={onPostComment}
              disabled={
                postingComment ||
                !newComment.trim()
              }
              style={{
                marginTop: '10px',
              }}
            >
              {postingComment
                ? 'Posting...'
                : 'Add comment'}
            </button>
          </div>
        </section>

        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onSave}
            disabled={
              savingTask ||
              !task.title.trim()
            }
          >
            {savingTask
              ? 'Saving...'
              : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}