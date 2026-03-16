# מנהל משימות — Task Management App

Full-stack task management application with Express.js backend, SQLite database, and React + Vite frontend.

## Project Structure

```
task7-fullstack/
├── package.json          # Root scripts (uses concurrently)
├── server/
│   ├── package.json
│   ├── index.js          # Express server (port 3001)
│   ├── db.js             # SQLite setup & schema
│   └── .env.example      # Copy to .env and set JWT_SECRET
└── client/
    ├── package.json
    ├── vite.config.js    # Proxies /api → localhost:3001
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api.js
        ├── index.css
        └── components/
            ├── Auth.jsx
            ├── Dashboard.jsx
            └── TaskList.jsx
```

## Setup

### 1. Install dependencies

```bash
# From the root folder:
cd server && npm install
cd ../client && npm install
cd ..

# Or install root devDependencies for the `dev` script:
npm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env and set a strong JWT_SECRET
```

### 3. Run in development

```bash
# Run both server and client together (requires root npm install):
npm run dev

# Or run separately:
npm run dev:server   # starts nodemon on port 3001
npm run dev:client   # starts Vite on port 5173
```

Open **http://localhost:5173** in your browser.

## API Endpoints

### Auth
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/register` | `{ username, password }` | Register new user |
| POST | `/api/login` | `{ username, password }` | Login, returns JWT |

### Tasks (require `Authorization: Bearer <token>`)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/api/tasks` | — | Get all tasks for logged-in user |
| POST | `/api/tasks` | `{ title, category, due_date }` | Create task |
| PUT | `/api/tasks/:id` | `{ title?, category?, due_date?, completed? }` | Update task |
| DELETE | `/api/tasks/:id` | — | Delete task |

### Categories
- `work` — עבודה (blue)
- `home` — בית (orange)
- `personal` — אישי (green)

## Database

SQLite file is created automatically at `server/tasks.db` on first run.

Tables:
- **users**: `id, username, password_hash, created_at`
- **tasks**: `id, user_id, title, category, due_date, completed, created_at`

## Tech Stack

- **Backend**: Node.js, Express, better-sqlite3, bcryptjs, jsonwebtoken
- **Frontend**: React 18, Vite, Hebrew RTL, warm light theme (no external UI library)
