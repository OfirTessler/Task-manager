import { useState } from 'react';

const CATEGORY_LABELS = {
  work: 'עבודה',
  home: 'בית',
  personal: 'אישי',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);

  function submitEdit() {
    onEdit(task, editValue);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') submitEdit();
    if (e.key === 'Escape') {
      setEditValue(task.title);
      setEditing(false);
    }
  }

  const overdue = !task.completed && isOverdue(task.due_date);

  return (
    <div className={`task-card${task.completed ? ' completed' : ''}`}>
      {/* Checkbox */}
      <button
        className="task-check"
        onClick={() => onToggle(task)}
        title={task.completed ? 'סמן כלא הושלם' : 'סמן כהושלם'}
        type="button"
      >
        {task.completed && '✓'}
      </button>

      {/* Body */}
      <div className="task-body">
        {editing ? (
          <input
            className="task-edit-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={submitEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="task-title">{task.title}</div>
        )}

        <div className="task-meta">
          <span className={`category-pill ${task.category}`}>
            {CATEGORY_LABELS[task.category]}
          </span>
          {task.due_date && (
            <span className={`due-date${overdue ? ' overdue' : ''}`}>
              {overdue ? '⚠ ' : ''}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="task-actions">
        {!task.completed && (
          <button
            className="task-action-btn"
            onClick={() => {
              setEditValue(task.title);
              setEditing(true);
            }}
            title="ערוך"
            type="button"
          >
            ✎
          </button>
        )}
        <button
          className="task-action-btn delete"
          onClick={() => onDelete(task.id)}
          title="מחק"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function TaskList({ tasks, onToggle, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="task-empty">
        <div className="empty-icon">📋</div>
        <p>אין משימות להצגה</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
