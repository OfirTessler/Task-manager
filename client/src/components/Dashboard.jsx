import { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../api.js';
import TaskList from './TaskList.jsx';

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

const CATEGORIES = [
  { value: 'work', label: 'עבודה' },
  { value: 'home', label: 'בית' },
  { value: 'personal', label: 'אישי' },
];

const FILTERS = [
  { value: 'all', label: 'כל המשימות' },
  { value: 'active', label: 'פעילות' },
  { value: 'completed', label: 'הושלמו' },
  { value: 'work', label: 'עבודה' },
  { value: 'home', label: 'בית' },
  { value: 'personal', label: 'אישי' },
];

export default function Dashboard({ username, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New task form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('personal');
  const [dueDate, setDueDate] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      if (err.message.includes('expired') || err.message.includes('invalid')) {
        onLogout();
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const task = await createTask({ title: title.trim(), category, due_date: dueDate || null });
      setTasks((prev) => [task, ...prev]);
      setTitle('');
      setDueDate('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(task) {
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(task, newTitle) {
    if (!newTitle.trim() || newTitle.trim() === task.title) return;
    try {
      const updated = await updateTask(task.id, { title: newTitle.trim() });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  function filteredTasks() {
    switch (filter) {
      case 'active':
        return tasks.filter((t) => !t.completed);
      case 'completed':
        return tasks.filter((t) => t.completed);
      case 'work':
      case 'home':
      case 'personal':
        return tasks.filter((t) => t.category === filter);
      default:
        return tasks;
    }
  }

  function countFor(f) {
    switch (f) {
      case 'all': return tasks.length;
      case 'active': return tasks.filter((t) => !t.completed).length;
      case 'completed': return tasks.filter((t) => t.completed).length;
      default: return tasks.filter((t) => t.category === f).length;
    }
  }

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  const visible = filteredTasks();

  return (
    <div className="dashboard">
      {/* ── Sidebar (left) ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">משימות</span>
          <button className="btn-logout" onClick={onLogout}>
            יציאה
          </button>
        </div>

        <span className="user-badge">שלום, {username}</span>

        {/* Summary bar */}
        <div className="summary-bar">
          <div className="summary-item">
            <span className="s-count">{tasks.length}</span>
            <span className="s-label">סה״כ</span>
          </div>
          <div className="summary-item s-done">
            <span className="s-count">{tasks.filter((t) => t.completed).length}</span>
            <span className="s-label">הושלמו</span>
          </div>
          <div className="summary-item s-overdue">
            <span className="s-count">{tasks.filter((t) => isOverdue(t.due_date) && !t.completed).length}</span>
            <span className="s-label">באיחור</span>
          </div>
        </div>

        {/* Add task form */}
        <form className="add-task-form" onSubmit={handleAdd}>
          <h3>משימה חדשה</h3>
          <input
            className="form-input"
            type="text"
            placeholder="כותרת המשימה..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            className="form-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button className="btn-primary btn-add" type="submit" disabled={adding}>
            {adding ? 'מוסיף...' : '+ הוסף משימה'}
          </button>
        </form>

        {/* Filters */}
        <div className="filter-section">
          <h3>סינון</h3>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-btn${filter === f.value ? ' active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="filter-count">{countFor(f.value)}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Task list (right / main) ── */}
      <div className="task-panel">
        <div className="panel-header">
          <h2 className="panel-title">
            {FILTERS.find((f) => f.value === filter)?.label ?? 'משימות'}
          </h2>
          <span className="task-count-badge">{visible.length} משימות</span>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <TaskList
          tasks={visible}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
