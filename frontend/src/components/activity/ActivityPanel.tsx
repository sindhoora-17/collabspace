import type { Activity } from '../../types/activity';

type ActivityPanelProps = {
    activities: Activity[];
    loading: boolean;
};

function formatStatus(status?: string) {
    if (!status) {
        return '';
    }

    return status
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (character) =>
            character.toUpperCase(),
        );
}

function getActivityText(activity: Activity) {
    const actor =
        activity.actor.displayName ||
        activity.actor.email;

    const taskTitle =
        activity.task?.title ?? 'a task';

    switch (activity.type) {
        case 'TASK_CREATED':
            return (
                <>
                    <strong>{actor}</strong> created{' '}
                    <strong>{taskTitle}</strong>
                </>
            );

        case 'TASK_MOVED':
            return (
                <>
                    <strong>{actor}</strong> moved{' '}
                    <strong>{taskTitle}</strong> from{' '}
                    {formatStatus(
                        activity.metadata?.fromStatus,
                    )}{' '}
                    to{' '}
                    {formatStatus(
                        activity.metadata?.toStatus,
                    )}
                </>
            );

        case 'TASK_UPDATED':
            return (
                <>
                    <strong>{actor}</strong> updated{' '}
                    <strong>{taskTitle}</strong>
                </>
            );

        case 'TASK_DELETED':
            return (
                <>
                    <strong>{actor}</strong> deleted{' '}
                    <strong>
                        {activity.metadata?.taskTitle ?? 'a task'}
                    </strong>
                </>
            );

        case 'COMMENT_ADDED':
            return (
                <>
                    <strong>{actor}</strong> commented on{' '}
                    <strong>{taskTitle}</strong>
                </>
            );

        default:
            return activity.message;
    }
}

export function ActivityPanel({
    activities,
    loading,
}: ActivityPanelProps) {
    return (
        <aside className="activity-panel">
            <div className="activity-panel-header">
                <h2>Activity</h2>

                <span className="activity-count">
                    {activities.length}
                </span>
            </div>

            {loading && (
                <p className="empty-text">
                    Loading activity...
                </p>
            )}

            {!loading &&
                activities.length === 0 && (
                    <p className="empty-text">
                        No activity yet.
                    </p>
                )}

            <div className="activity-list">
                {activities.map((activity) => (
                    <article
                        key={activity.id}
                        className="activity-item"
                    >
                        <div className="activity-dot" />

                        <div>
                            <p className="activity-text">
                                {getActivityText(activity)}
                            </p>

                            <span className="activity-time">
                                {new Date(
                                    activity.createdAt,
                                ).toLocaleString()}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </aside>
    );
}