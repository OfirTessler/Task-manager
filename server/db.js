const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tasks.db');

module.exports = async function initialize() {
  const SQL = await initSqlJs();

  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'personal',
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  save();

  function save() {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  function rowToObject(stmt) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const obj = {};
    cols.forEach((col, i) => { obj[col] = vals[i]; });
    return obj;
  }

  return {
    prepare(sql) {
      return {
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const row = stmt.step() ? rowToObject(stmt) : undefined;
          stmt.free();
          return row;
        },
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) rows.push(rowToObject(stmt));
          stmt.free();
          return rows;
        },
        run(...params) {
          db.run(sql, params);
          const lastInsertRowid = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
          save();
          return { lastInsertRowid };
        },
      };
    },
    exec(sql) {
      db.exec(sql);
      save();
    },
  };
};
