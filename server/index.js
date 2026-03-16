require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const initDb = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)
  .concat(['http://localhost:5173', 'https://manager-app-gll6.onrender.com'])
  .filter((v, i, a) => a.indexOf(v) === i);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'יותר מדי ניסיונות, נסה שוב בעוד 15 דקות' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'יותר מדי בקשות, נסה שוב בעוד 15 דקות' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());

// ── Input sanitization ────────────────────────────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// ── Validation helpers ────────────────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9._@-]{3,50}$/;
const VALID_CATEGORIES = ['work', 'home', 'personal'];

// ── Auth middleware ──────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'חסר טוקן הזדהות' });
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'טוקן פג תוקף או לא תקין' });
  }
}

(async () => {
const db = await initDb();

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/api/register', authLimiter, (req, res) => {
  const username = sanitize(req.body.username ?? '');
  const password = req.body.password ?? '';

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'שם משתמש חייב להכיל 3-50 תווים: אותיות, ספרות, נקודה, מקף, קו תחתון או @' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 8 תווים' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'שם המשתמש כבר תפוס' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, password_hash);

  const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET, {
    expiresIn: '24h',
  });
  res.status(201).json({ token, username });
});

app.post('/api/login', authLimiter, (req, res) => {
  const username = sanitize(req.body.username ?? '');
  const password = req.body.password ?? '';

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'שם משתמש לא תקין' });
  }
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'סיסמה נדרשת' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ token, username: user.username });
});

// ── Token refresh ─────────────────────────────────────────────────────────────
app.post('/api/refresh', authenticate, (req, res) => {
  const token = jwt.sign({ id: req.user.id, username: req.user.username }, JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ token });
});

// ── Task routes (all protected) ───────────────────────────────────────────────
app.get('/api/tasks', apiLimiter, authenticate, (req, res) => {
  const tasks = db
    .prepare('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(tasks.map(t => ({ ...t, completed: t.completed === 1 })));
});

app.post('/api/tasks', apiLimiter, authenticate, (req, res) => {
  const title = sanitize(req.body.title ?? '');
  const category = sanitize(req.body.category ?? 'personal');
  const due_date = req.body.due_date ?? null;

  if (!title) {
    return res.status(400).json({ error: 'כותרת המשימה נדרשת' });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: 'כותרת המשימה לא יכולה לעלות על 200 תווים' });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'קטגוריה לא תקינה, יש לבחור: work, home או personal' });
  }

  const result = db
    .prepare(
      'INSERT INTO tasks (user_id, title, category, due_date) VALUES (?, ?, ?, ?)'
    )
    .run(req.user.id, title, category, due_date || null);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...task, completed: task.completed === 1 });
});

app.put('/api/tasks/:id', apiLimiter, authenticate, (req, res) => {
  const { id } = req.params;
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);

  if (!task) {
    return res.status(404).json({ error: 'המשימה לא נמצאה' });
  }

  const rawTitle = req.body.title !== undefined ? sanitize(req.body.title) : undefined;
  const rawCategory = req.body.category !== undefined ? sanitize(req.body.category) : undefined;
  const { due_date, completed } = req.body;

  const updated = {
    title: rawTitle !== undefined ? rawTitle : task.title,
    category: rawCategory !== undefined ? rawCategory : task.category,
    due_date: due_date !== undefined ? due_date : task.due_date,
    completed: completed !== undefined ? (completed ? 1 : 0) : task.completed,
  };

  if (!updated.title) {
    return res.status(400).json({ error: 'כותרת המשימה נדרשת' });
  }
  if (updated.title.length > 200) {
    return res.status(400).json({ error: 'כותרת המשימה לא יכולה לעלות על 200 תווים' });
  }
  if (!VALID_CATEGORIES.includes(updated.category)) {
    return res.status(400).json({ error: 'קטגוריה לא תקינה, יש לבחור: work, home או personal' });
  }

  db.prepare(
    'UPDATE tasks SET title = ?, category = ?, due_date = ?, completed = ? WHERE id = ?'
  ).run(updated.title, updated.category, updated.due_date, updated.completed, id);

  const result = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ...result, completed: result.completed === 1 });
});

app.delete('/api/tasks/:id', apiLimiter, authenticate, (req, res) => {
  const { id } = req.params;
  const task = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(id, req.user.id);

  if (!task) {
    return res.status(404).json({ error: 'המשימה לא נמצאה' });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.json({ message: 'המשימה נמחקה' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
})();
