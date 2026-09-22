import type {
    TaskPriority,
} from '../../types/tasks';
import '../../styles/kanban.css';

type WorkspaceMember = {
    id: string;
    role: 'OWNER' | 'ADMIN' | 'MEMBER';
    user: {
        id: string;
        email: string;
        displayName: string;
    };
};

type CreateTaskModalProps = {
    isOpen: boolean;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    assigneeId: string;
    members: WorkspaceMember[];
    creating: boolean;

    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onPriorityChange: (value: TaskPriority) => void;
    onDueDateChange: (value: string) => void;
    onAssigneeChange: (value: string) => void;

    onClose: () => void;
    onCreate: () => void;
};

export function CreateTaskModal({
    isOpen,
    title,
    description,
    priority,
    dueDate,
    assigneeId,
    members,
    creating,
    onTitleChange,
    onDescriptionChange,
    onPriorityChange,
    onDueDateChange,
    onAssigneeChange,
    onClose,
    onCreate,
}: CreateTaskModalProps) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-backdrop">
            <div className="modal-panel">
                <div className="modal-header">
                    <h2>Create task</h2>
                    <p>Add a new task to this project.</p>
                </div>

                <div className="form-group">
                    <label>Title</label>

                    <input
                        className="form-control"
                        type="text"
                        value={title}
                        onChange={(event) =>
                            onTitleChange(event.target.value)
                        }
                        placeholder="Task title"
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>

                    <textarea
                        className="form-control"
                        value={description}
                        onChange={(event) =>
                            onDescriptionChange(event.target.value)
                        }
                        placeholder="Task description"
                    />
                </div>

                <div className="form-group">
                    <label>Priority</label>

                    <select
                        className="form-control"
                        value={priority}
                        onChange={(event) =>
                            onPriorityChange(
                                event.target.value as TaskPriority,
                            )
                        }
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Due date</label>

                    <input
                        className="form-control"
                        type="date"
                        value={dueDate}
                        onChange={(event) =>
                            onDueDateChange(event.target.value)
                        }
                    />
                </div>

                <div className="form-group">
                    <label>Assignee</label>

                    <select
                        className="form-control"
                        value={assigneeId}
                        onChange={(event) =>
                            onAssigneeChange(event.target.value)
                        }
                    >
                        <option value="">Unassigned</option>

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
                        onClick={onCreate}
                        disabled={
                            creating || !title.trim()
                        }
                    >
                        {creating
                            ? 'Creating...'
                            : 'Create task'}
                    </button>
                </div>
            </div>
        </div>
    );
}