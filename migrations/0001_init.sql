-- AegisRA initial schema (ported verbatim from the node:sqlite schema in server.cjs).
-- Dates are ISO-8601 TEXT (new Date().toISOString()).

CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audits(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  score INTEGER NOT NULL,
  status TEXT NOT NULL,
  findings TEXT NOT NULL,
  report_ref TEXT NOT NULL,
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS watches(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  label TEXT NOT NULL,
  process_id TEXT NOT NULL,
  webhook TEXT,
  state TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  wallet TEXT UNIQUE NOT NULL,
  amount TEXT NOT NULL,
  status TEXT NOT NULL,
  tx_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deliveries(
  id TEXT PRIMARY KEY,
  watch_id TEXT NOT NULL REFERENCES watches(id),
  status TEXT NOT NULL,
  response_code INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audits_user ON audits(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_watches_user ON watches(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
