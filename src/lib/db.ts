import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

const IS_VERCEL = !!process.env.VERCEL;
const DB_PATH = path.join(process.cwd(), 'data', 'jsmission.db');

let sqlDb: SqlJsDatabase | null = null;
let initialized = false;

// Wrapper that mimics better-sqlite3 API
class DatabaseWrapper {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  prepare(sql: string) {
    const db = this.db;
    return {
      run(...params: any[]) {
        const stmt = db.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          stmt.step();
        } finally {
          stmt.free();
        }
        return { changes: db.getRowsModified(), lastInsertRowid: getLastInsertRowId(db) };
      },
      get(...params: any[]) {
        const stmt = db.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params: any[]) {
        const results: any[] = [];
        const stmt = db.prepare(sql);
        try {
          if (params.length > 0) stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
        } finally {
          stmt.free();
        }
        return results;
      },
    };
  }

  exec(sql: string) {
    this.db.exec(sql);
  }

  pragma(pragma: string) {
    try {
      this.db.exec(`PRAGMA ${pragma}`);
    } catch {
      // Ignore pragma errors
    }
  }
}

function getLastInsertRowId(db: SqlJsDatabase): number {
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const result = stmt.getAsObject() as any;
  stmt.free();
  return result.id;
}

async function initDb(): Promise<DatabaseWrapper> {
  if (sqlDb && initialized) {
    return new DatabaseWrapper(sqlDb);
  }

  // Load WASM binary directly from file
  let wasmBinary: Buffer | null = null;

  // Try multiple locations for the WASM file
  const possiblePaths = [
    path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(process.cwd(), 'public', 'sql-wasm.wasm'),
    path.join(process.cwd(), '.next', 'static', 'sql-wasm.wasm'),
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        wasmBinary = fs.readFileSync(p);
        break;
      }
    } catch { /* skip */ }
  }

  let SQL;
  if (wasmBinary) {
    SQL = await initSqlJs({ wasmBinary: wasmBinary as any });
  } else {
    // Fallback: fetch from CDN
    const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm');
    const buf = await response.arrayBuffer();
    SQL = await initSqlJs({ wasmBinary: new Uint8Array(buf) as any });
  }

  // Try to load existing DB from file (local dev only)
  if (!IS_VERCEL) {
    try {
      const dataDir = path.dirname(DB_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        sqlDb = new SQL.Database(buffer);
        initialized = true;
        const wrapper = new DatabaseWrapper(sqlDb);
        wrapper.pragma('foreign_keys = ON');
        return wrapper;
      }
    } catch {
      // Fall through to create new DB
    }
  }

  // Create new in-memory DB
  sqlDb = new SQL.Database();
  initialized = true;
  const wrapper = new DatabaseWrapper(sqlDb);
  wrapper.pragma('foreign_keys = ON');
  initializeSchema(wrapper);

  // Run seed
  const { seedDatabase } = await import('./seed');
  seedDatabase(wrapper);

  // Save to file (local dev only)
  if (!IS_VERCEL) {
    saveToFile();
  }

  return wrapper;
}

function initializeSchema(db: DatabaseWrapper) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      department VARCHAR(50),
      referral_source VARCHAR(200),
      role TEXT DEFAULT 'USER',
      profile_image VARCHAR(500),
      is_approved BOOLEAN DEFAULT 0,
      approved_by INTEGER,
      approved_at DATETIME,
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(phone)
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(10),
      icon_color VARCHAR(10),
      slogan VARCHAR(200),
      description TEXT,
      category TEXT,
      poster_image VARCHAR(500),
      target_age VARCHAR(100),
      target_gender VARCHAR(20),
      max_members INTEGER,
      schedule_text VARCHAR(200),
      location VARCHAR(200),
      fee_text VARCHAR(200),
      instructor_info TEXT,
      curriculum JSON,
      total_sessions INTEGER,
      external_link VARCHAR(500),
      recruitment_status TEXT DEFAULT 'OPEN',
      approval_mode TEXT DEFAULT 'CLUB_ADMIN',
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'MEMBER',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS club_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      club_id INTEGER NOT NULL,
      department VARCHAR(50),
      phone VARCHAR(20),
      purpose TEXT,
      target_type TEXT,
      status TEXT DEFAULT 'PENDING',
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS club_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      session_no INTEGER NOT NULL,
      topic VARCHAR(200),
      session_date DATE,
      start_time TEXT,
      end_time TEXT,
      location VARCHAR(200),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES club_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(session_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS newcomers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      registered_by INTEGER NOT NULL,
      assigned_to INTEGER,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      age_group VARCHAR(20),
      gender VARCHAR(10),
      introduction TEXT,
      how_met TEXT,
      status TEXT DEFAULT 'ATTEMPT',
      prayer_request TEXT,
      last_contact_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (registered_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newcomer_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (newcomer_id) REFERENCES newcomers(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS prayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      newcomer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (newcomer_id) REFERENCES newcomers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mission_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_type TEXT NOT NULL,
      title VARCHAR(200),
      description TEXT,
      appointment_date DATE,
      start_time TEXT,
      location VARCHAR(200),
      created_by INTEGER NOT NULL,
      participants JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mission_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      log_type TEXT NOT NULL,
      appointment_id INTEGER,
      content TEXT NOT NULL,
      location VARCHAR(200),
      result_summary TEXT,
      attempt_count INTEGER DEFAULT 0,
      images JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (appointment_id) REFERENCES mission_appointments(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_type TEXT NOT NULL,
      club_id INTEGER,
      author_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      file_path VARCHAR(500),
      file_name VARCHAR(200),
      resource_category VARCHAR(50),
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT,
      image_path VARCHAR(500),
      is_pinned BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER,
      uploaded_by INTEGER NOT NULL,
      title VARCHAR(200),
      file_path VARCHAR(500) NOT NULL,
      file_name VARCHAR(200),
      file_size INTEGER,
      file_type VARCHAR(50),
      category VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200),
      message TEXT,
      link VARCHAR(300),
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS family_sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(100),
      url VARCHAR(500),
      icon VARCHAR(10),
      display_order INTEGER DEFAULT 0
    );
  `);
}

function saveToFile() {
  if (!sqlDb || IS_VERCEL) return;
  try {
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = sqlDb.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch {
    // Ignore save errors
  }
}

let dbPromise: Promise<DatabaseWrapper> | null = null;

export async function initDbAsync(): Promise<DatabaseWrapper> {
  if (sqlDb && initialized) {
    return new DatabaseWrapper(sqlDb);
  }
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

export async function ensureUserExists(db: any, user: { userId: number; name: string; phone?: string; role?: string }) {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(user.userId);
  if (!existing) {
    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash('guest1234', 10);
    db.prepare(
      'INSERT OR IGNORE INTO users (id, name, phone, password_hash, is_approved, role) VALUES (?, ?, ?, ?, 1, ?)'
    ).run(user.userId, user.name, user.phone || `guest-${user.userId}`, hash, user.role || 'USER');
  }
}

export default initDbAsync;
export { saveToFile };
