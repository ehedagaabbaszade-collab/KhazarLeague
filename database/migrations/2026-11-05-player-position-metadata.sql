-- Khazar League 2.0 player role metadata
-- Review and apply only in the intended Supabase environment after approval.
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_code TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_label_az TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_status TEXT NOT NULL DEFAULT 'needs_admin_review';
ALTER TABLE players ADD COLUMN IF NOT EXISTS secondary_positions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_source TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS position_review_note TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS identity_review_status TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS identity_review_note TEXT;
