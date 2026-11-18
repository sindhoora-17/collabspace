import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import '../../styles/kanban.css';
import { dueState, shortDate } from '../../lib/format';
import type { Task } from '../../types/tasks';
import { Avatar } from '../common/Avatar';

type TaskCardProps = {
  task: Task;
  onOpen: (task: Task) => void;
};

const priorityLabel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export function TaskCard({ task, onOpen }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const isDone = task.status === 'DONE';

  return (
    <article
      ref={setNodeRef}
      className={`task-card${isDragging ? ' task-card--dragging' : ''}${
        isDone ? ' task-card--done' : ''
      }`}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
      }}
      {...attributes}
      {...listeners}
      // The whole card opens the task. A drag needs 6px of movement first
      // (PointerSensor activationConstraint), so clicks and drags don't clash.
      onClick={() => onOpen(task)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen(task);
      }}
    >
      <h3 className="task-card-title">{task.title}</h3>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        <span className={`priority priority--${task.priority.toLowerCase()}`}>
          <span className="priority-dot" />
          {priorityLabel[task.priority]}
        </span>

        {task.dueDate && (
          <span
            className={`due due--${isDone ? 'later' : dueState(task.dueDate)}`}
            title={new Date(task.dueDate).toLocaleDateString()}
          >
            {shortDate(task.dueDate)}
          </span>
        )}

        <span className="task-card-spacer" />

        {task.assignee && (
          <Avatar id={task.assignee.id} name={task.assignee.displayName} size={22} />
        )}
      </div>
    </article>
  );
}
