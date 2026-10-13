-- Explicit migration only. User.schoolId remains the home school.
CREATE TABLE IF NOT EXISTS student_school_preferences(
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 selected_school_id TEXT REFERENCES campus_schools(id),
 etag TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS student_school_audit_logs(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
 previous_school_id TEXT REFERENCES campus_schools(id),
 selected_school_id TEXT NOT NULL REFERENCES campus_schools(id),
 time TEXT NOT NULL
);
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(3,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
