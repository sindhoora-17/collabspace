import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import '../../styles/kanban.css';
import type { Task } from '../../types/tasks';

type TaskCardProps = {
  task: Task;
  onOpen: (task: Task) => void;
};

export function TaskCard({
  task,
  onOpen,
}: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  //   const style = {
  //     transform: transform
  //       ? CSS.Translate.toString(transform)
  //       : undefined,
  //     border: '1px solid #ccc',
  //     borderRadius: '8px',
  //     padding: '12px',
  //     marginBottom: '12px',
  //     background: 'white',
  //     cursor: 'grab',
  //   };

  return (
    <article
      ref={setNodeRef}
      className={`task-card ${isDragging ? 'task-card--dragging' : ''
        }`}
      style={{
        transform: transform
          ? CSS.Translate.toString(transform)
          : undefined,
      }}
      {...attributes}
    >
      <div
        className="task-card-header"
        {...listeners}
      >
        <h3 className="task-card-title">
          {task.title}
        </h3>

        <span
          className="task-card-drag"
          aria-hidden="true"
        >
          ⋮⋮
        </span>
      </div>

      {task.description && (
        <p className="task-card-description">
          {task.description}
        </p>
      )}

      <div className="task-card-meta">
        <span
          className={`priority-badge priority-${task.priority.toLowerCase()}`}
        >
          {task.priority}
        </span>

        {task.dueDate && (
          <span className="task-card-info">
            Due{' '}
            {new Date(
              task.dueDate,
            ).toLocaleDateString()}
          </span>
        )}
      </div>

      {task.assignee && (
        <div
          className="task-card-info"
          style={{ marginTop: '10px' }}
        >
          {task.assignee.displayName}
        </div>
      )}

      <div className="task-card-footer">
        <button
          type="button"
          className="task-details-button"
          onClick={() => onOpen(task)}
        >
          View details
        </button>
      </div>
    </article>
  );
}