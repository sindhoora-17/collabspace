import { useDroppable } from '@dnd-kit/core';
import '../../styles/kanban.css';

import type {
  Task,
  TaskStatus,
} from '../../types/tasks';

import { TaskCard } from './TaskCard';

type KanbanColumnProps = {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
};

export function KanbanColumn({
  status,
  label,
  tasks,
  onOpenTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
  <section
    ref={setNodeRef}
    className={`kanban-column ${
      isOver ? 'kanban-column--over' : ''
    }`}
  >
    <div className="kanban-column-header">
      <h2>{label}</h2>

      <span className="kanban-count">
        {tasks.length}
      </span>
    </div>

    {tasks.length === 0 && (
      <p className="kanban-empty">
        Drop tasks here
      </p>
    )}

    {tasks.map((task) => (
      <TaskCard
        key={task.id}
        task={task}
        onOpen={onOpenTask}
      />
    ))}
  </section>
);
}