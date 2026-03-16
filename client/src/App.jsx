import { useState, useEffect } from 'react';
import Auth from './components/Auth.jsx';
import Dashboard from './components/Dashboard.jsx';

export default function App() {
  const [auth, setAuth] = useState(null); // { token, username }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) setAuth({ token, username });
  }, []);

  function handleLogin(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setAuth(data);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setAuth(null);
  }

  if (!auth) return <Auth onAuth={handleLogin} />;
  return <Dashboard username={auth.username} onLogout={handleLogout} />;
}
