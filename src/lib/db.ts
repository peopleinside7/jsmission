import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'jsmission.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const d = db;

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      department VARCHAR(50),
      role TEXT CHECK(role IN ('USER','CLUB_ADMIN','ADMIN')) DEFAULT 'USER',
      profile_image VARCHAR(500),
      login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      icon VARCHAR(10),
      icon_color VARCHAR(10),
      slogan VARCHAR(200),
      description TEXT,
      category TEXT CHECK(category IN ('교육','스포츠','문화','대학사역','찬양','기타')),
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
      recruitment_status TEXT CHECK(recruitment_status IN ('OPEN','CLOSED')) DEFAULT 'OPEN',
      approval_mode TEXT CHECK(approval_mode IN ('CLUB_ADMIN','AUTO')) DEFAULT 'CLUB_ADMIN',
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT CHECK(role IN ('MEMBER','ADMIN')) DEFAULT 'MEMBER',
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
      target_type TEXT CHECK(target_type IN ('FRIEND','COLLEAGUE','NEW_CONTACT','OTHER')),
      status TEXT CHECK(status IN ('PENDING','APPROVED','REJECTED')) DEFAULT 'PENDING',
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
      status TEXT CHECK(status IN ('ATTEND','ABSENT','PENDING')) DEFAULT 'PENDING',
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
      status TEXT CHECK(status IN ('ATTEMPT','PRELIM','GOSPEL','WORSHIP','COMPLETE','LOST')) DEFAULT 'ATTEMPT',
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
      activity_type TEXT CHECK(activity_type IN ('ATTEMPT','PRELIM','GOSPEL','WORSHIP','COMPLETE')) NOT NULL,
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
      appointment_type TEXT CHECK(appointment_type IN ('STREET','PROMOTION')) NOT NULL,
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
      log_type TEXT CHECK(log_type IN ('STREET','PROMOTION')) NOT NULL,
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
      board_type TEXT CHECK(board_type IN ('NOTICE','SERMON','FREE','RESOURCE','FEEDBACK','CLUB_NOTICE')) NOT NULL,
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
      target_type TEXT CHECK(target_type IN ('POST','COMMENT','MISSION_LOG','PRAYER')) NOT NULL,
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

    CREATE INDEX IF NOT EXISTS idx_members_club ON club_members(club_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_club ON club_sessions(club_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_newcomers_club ON newcomers(club_id);
    CREATE INDEX IF NOT EXISTS idx_newcomers_status ON newcomers(status);
    CREATE INDEX IF NOT EXISTS idx_logs_newcomer ON activity_logs(newcomer_id);
    CREATE INDEX IF NOT EXISTS idx_posts_board ON posts(board_type);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_chat_club ON chat_messages(club_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_mission_logs_type ON mission_logs(log_type, created_at);
  `);
}

export default getDb;
