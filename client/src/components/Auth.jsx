import { useState } from 'react';
import { login, register } from '../api.js';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await login(username, password)
          : await register(username, password);
      onAuth(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setError('');
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>מנהל משימות</h1>
          <p>ארגן את היום שלך בקלות</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            התחברות
          </button>
          <button
            className={`auth-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            הרשמה
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="username">
              שם משתמש
            </label>
            <input
              id="username"
              className="field-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="הכנס שם משתמש"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              סיסמה
            </label>
            <input
              id="password"
              className="field-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'לפחות 8 תווים' : 'הכנס סיסמה'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button className="btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'טוען...' : mode === 'login' ? 'התחבר' : 'הירשם'}
          </button>
        </form>
      </div>
    </div>
  );
}
