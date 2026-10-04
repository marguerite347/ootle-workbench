CREATE SCHEMA IF NOT EXISTS ootle_agents;
REVOKE ALL ON SCHEMA ootle_agents FROM PUBLIC;
CREATE TABLE IF NOT EXISTS ootle_agents.records(kind TEXT NOT NULL, id TEXT NOT NULL, value JSONB NOT NULL, expires BIGINT, PRIMARY KEY(kind,id));
CREATE TABLE IF NOT EXISTS ootle_agents.projects(id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL, version INTEGER NOT NULL, files JSONB NOT NULL);
CREATE TABLE IF NOT EXISTS ootle_agents.grants(id TEXT PRIMARY KEY, owner TEXT NOT NULL, project TEXT NOT NULL REFERENCES ootle_agents.projects(id), client TEXT NOT NULL, name TEXT NOT NULL, scopes JSONB NOT NULL, created BIGINT NOT NULL, expires BIGINT NOT NULL, revoked BIGINT);
CREATE TABLE IF NOT EXISTS ootle_agents.activity(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, owner TEXT NOT NULL, project TEXT NOT NULL, agent TEXT NOT NULL, action TEXT NOT NULL, at BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS projects_owner ON ootle_agents.projects(owner);
CREATE INDEX IF NOT EXISTS grants_owner ON ootle_agents.grants(owner);
CREATE INDEX IF NOT EXISTS activity_owner ON ootle_agents.activity(owner,id DESC);
ALTER TABLE ootle_agents.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE ootle_agents.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ootle_agents.grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ootle_agents.activity ENABLE ROW LEVEL SECURITY;
-- The schema is private and not exposed through the Supabase Data API.
-- A dedicated server-only role receives policies and DML grants at provisioning.
