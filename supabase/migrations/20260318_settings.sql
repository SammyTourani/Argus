-- Settings: add description column to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
