import { useDroppable } from '@dnd-kit/core';

import '../../styles/kanban.css';
import type { Task, TaskStatus } from '../../types/tasks';
import { TaskCard } from './TaskCard';

type KanbanColumnProps = {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
};

export function KanbanColumn({
  status,
  label,
  tasks,
  onOpenTask,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      data-status={status}
      className={`kanban-column${isOver ? ' kanban-column--over' : ''}`}
    >
      <header className="kanban-column-header">
        <span className="status-dot" />
        <h2>{label}</h2>
        <span className="kanban-count">{tasks.length}</span>
      </header>

      <div className="kanban-column-body">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
        ))}

        {tasks.length === 0 && <div className="kanban-empty">No tasks</div>}
      </div>

      <button
        type="button"
        className="kanban-add"
        onClick={() => onAddTask(status)}
      >
        + Add task
      </button>
    </section>
  );
}
