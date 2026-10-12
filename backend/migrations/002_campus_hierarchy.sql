-- 仅由migrate-campus.cjs执行；运行服务本身不自动激活本阶段迁移。
CREATE TABLE IF NOT EXISTS campus_schools(
 id TEXT PRIMARY KEY CHECK(length(trim(id)) BETWEEN 1 AND 100),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),
 code TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK(length(trim(code)) BETWEEN 1 AND 50),
 status TEXT NOT NULL CHECK(status IN ('启用','停用')),
 etag TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campus_colleges(
 id TEXT PRIMARY KEY,school_id TEXT NOT NULL REFERENCES campus_schools(id),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100),
 code TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(code)) BETWEEN 1 AND 50),
 status TEXT NOT NULL CHECK(status IN ('启用','停用')),
 etag TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 UNIQUE(id,school_id),UNIQUE(school_id,code),UNIQUE(school_id,name)
);
CREATE TABLE IF NOT EXISTS campus_members(
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
 school_id TEXT REFERENCES campus_schools(id),college_id TEXT,
 role TEXT NOT NULL CHECK(role IN ('平台管理员','校级管理员','学院负责人')),
 display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 100),
 duty TEXT CHECK(duty IS NULL OR length(duty)<=500),
 status TEXT NOT NULL CHECK(status IN ('启用','停用')),
 etag TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 CHECK((role='平台管理员' AND school_id IS NULL AND college_id IS NULL)
 OR (role='校级管理员' AND school_id IS NOT NULL AND college_id IS NULL)
 OR (role='学院负责人' AND school_id IS NOT NULL AND college_id IS NOT NULL)),
 FOREIGN KEY(college_id,school_id) REFERENCES campus_colleges(id,school_id),
 UNIQUE(id,school_id,college_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS campus_member_scope ON campus_members(user_id,role,coalesce(school_id,''),coalesce(college_id,''));
CREATE TABLE IF NOT EXISTS contest_maintenance(
 contest_id TEXT PRIMARY KEY REFERENCES contests(id),school_id TEXT NOT NULL REFERENCES campus_schools(id),
 college_id TEXT NOT NULL,responsible_member_id TEXT NOT NULL,
 etag TEXT NOT NULL,assigned_by TEXT NOT NULL REFERENCES users(id),assigned_at TEXT NOT NULL,
 FOREIGN KEY(college_id,school_id) REFERENCES campus_colleges(id,school_id),
 FOREIGN KEY(responsible_member_id,school_id,college_id) REFERENCES campus_members(id,school_id,college_id)
);
CREATE TRIGGER IF NOT EXISTS campus_assignment_insert BEFORE INSERT ON contest_maintenance BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM contests WHERE id=NEW.contest_id AND school_id=NEW.school_id) THEN RAISE(ABORT,'contest school mismatch') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM campus_members WHERE id=NEW.responsible_member_id AND role='学院负责人') THEN RAISE(ABORT,'responsible role required') END;
END;
CREATE TRIGGER IF NOT EXISTS campus_assignment_update BEFORE UPDATE ON contest_maintenance BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM contests WHERE id=NEW.contest_id AND school_id=NEW.school_id) THEN RAISE(ABORT,'contest school mismatch') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM campus_members WHERE id=NEW.responsible_member_id AND role='学院负责人') THEN RAISE(ABORT,'responsible role required') END;
END;
CREATE TABLE IF NOT EXISTS campus_audit_logs(
 id TEXT PRIMARY KEY,actor_user_id TEXT NOT NULL REFERENCES users(id),
 school_id TEXT REFERENCES campus_schools(id),college_id TEXT,entity_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('创建高校','修改高校','创建学院','修改学院','授权成员','修改成员','分配赛事')),
 before_json TEXT CHECK(before_json IS NULL OR json_valid(before_json)),
 after_json TEXT CHECK(after_json IS NULL OR json_valid(after_json)),created_at TEXT NOT NULL,
 CHECK(college_id IS NULL OR school_id IS NOT NULL),
 FOREIGN KEY(college_id,school_id) REFERENCES campus_colleges(id,school_id)
);
CREATE INDEX IF NOT EXISTS campus_audit_school ON campus_audit_logs(school_id,created_at);
INSERT OR IGNORE INTO schema_migrations VALUES(2,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
