CREATE TABLE IF NOT EXISTS import_files (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES campus_schools(id), user_id TEXT NOT NULL REFERENCES users(id),
 target_contest_id TEXT REFERENCES contests(id), status TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)),
 upload_expires_at TEXT NOT NULL, received TEXT CHECK(received IS NULL OR json_valid(received))
);
CREATE TABLE IF NOT EXISTS import_jobs (
 id TEXT PRIMARY KEY, school_id TEXT NOT NULL REFERENCES campus_schools(id), user_id TEXT NOT NULL REFERENCES users(id),
 target_contest_id TEXT REFERENCES contests(id), status TEXT NOT NULL, etag TEXT NOT NULL, data TEXT NOT NULL CHECK(json_valid(data)),
 result TEXT CHECK(result IS NULL OR json_valid(result))
);
CREATE TABLE IF NOT EXISTS import_job_files (
 job_id TEXT NOT NULL REFERENCES import_jobs(id), file_id TEXT NOT NULL REFERENCES import_files(id), position INTEGER NOT NULL,
 PRIMARY KEY(job_id,file_id), UNIQUE(job_id,position)
);
CREATE TABLE IF NOT EXISTS import_draft_links (
 job_id TEXT PRIMARY KEY REFERENCES import_jobs(id), contest_id TEXT NOT NULL REFERENCES contests(id), version_id TEXT NOT NULL UNIQUE REFERENCES versions(id),
 data TEXT NOT NULL CHECK(json_valid(data)), origin TEXT NOT NULL CHECK(json_valid(origin))
);
CREATE TABLE IF NOT EXISTS import_idempotency (
 school_id TEXT NOT NULL, user_id TEXT NOT NULL, operation TEXT NOT NULL, key TEXT NOT NULL, request_hash TEXT NOT NULL,
 response TEXT NOT NULL CHECK(json_valid(response)), created_at TEXT NOT NULL,
 PRIMARY KEY(school_id,user_id,operation,key)
);
CREATE INDEX IF NOT EXISTS import_jobs_queue ON import_jobs(status);
CREATE INDEX IF NOT EXISTS import_files_school ON import_files(school_id,user_id);
CREATE INDEX IF NOT EXISTS import_jobs_school ON import_jobs(school_id,user_id);
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(4,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
