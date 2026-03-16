const BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api'
  : 'https://task-manager-api-2-85f3.onrender.com/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'שגיאה לא ידועה');
  return data;
}

export async function register(username, password) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return handleResponse(res);
}

export async function getTasks() {
  const res = await fetch(`${BASE}/tasks`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createTask(task) {
  const res = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(task),
  });
  return handleResponse(res);
}

export async function updateTask(id, updates) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
