-- Khazar League Database Schema - Awards, Announcements, Notifications

-- Awards
CREATE TABLE IF NOT EXISTS awards (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    recipient_type TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    description TEXT,
    awarded_by TEXT REFERENCES users(id),
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_official INTEGER DEFAULT 1
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    type TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'normal',
    target_audience TEXT DEFAULT 'all',
    is_published INTEGER DEFAULT 0,
    published_at DATETIME,
    published_by TEXT REFERENCES users(id),
    expires_at DATETIME,
    attachment_path TEXT,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    announcement_id TEXT REFERENCES announcements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    read_at DATETIME,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);