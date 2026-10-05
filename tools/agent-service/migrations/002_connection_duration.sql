-- NULL means until disconnected. No existing grants change without owner authorization.
ALTER TABLE ootle_agents.grants ALTER COLUMN expires DROP NOT NULL;
