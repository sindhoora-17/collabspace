import { relativeTime } from '../../lib/format';
import type { Activity } from '../../types/activity';
import { Avatar } from '../common/Avatar';

type ActivityPanelProps = {
  activities: Activity[];
  loading: boolean;
};

const statusLabel: Record<string, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

function describe(activity: Activity) {
  const title = activity.task?.title ?? activity.metadata?.taskTitle ?? 'a task';
  const t = <span className="activity-task">{title}</span>;

  switch (activity.type) {
    case 'TASK_CREATED':
      return <>created {t}</>;
    case 'TASK_UPDATED':
      return <>updated {t}</>;
    case 'TASK_DELETED':
      return <>deleted {t}</>;
    case 'COMMENT_ADDED':
      return <>commented on {t}</>;
    case 'TASK_MOVED':
      return (
        <>
          moved {t} to{' '}
          <span className="activity-status">
            {statusLabel[activity.metadata?.toStatus ?? ''] ?? 'another column'}
          </span>
        </>
      );
    default:
      return activity.message;
  }
}

export function ActivityPanel({ activities, loading }: ActivityPanelProps) {
  return (
    <aside className="activity-panel">
      <header className="activity-panel-header">
        <h2>Activity</h2>
        <span className="live-pill">
          <span className="live-dot" /> Live
        </span>
      </header>

      {loading && <p className="activity-empty">Loading activity…</p>}

      {!loading && activities.length === 0 && (
        <p className="activity-empty">
          Nothing yet. Changes from your team will show up here as they happen.
        </p>
      )}

      <ol className="activity-list">
        {activities.map((activity) => (
          <li key={activity.id} className="activity-item">
            <Avatar
              id={activity.actor.id}
              name={activity.actor.displayName || activity.actor.email}
              size={24}
            />
            <div>
              <p className="activity-text">
                <span className="activity-actor">
                  {activity.actor.displayName || activity.actor.email}
                </span>{' '}
                {describe(activity)}
              </p>
              <time
                className="activity-time"
                dateTime={activity.createdAt}
                title={new Date(activity.createdAt).toLocaleString()}
              >
                {relativeTime(activity.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
