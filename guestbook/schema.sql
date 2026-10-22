CREATE TABLE IF NOT EXISTS wishes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  hidden INTEGER NOT NULL DEFAULT 0,
  sender TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS wishes_sender_time ON wishes (sender, created_at);
