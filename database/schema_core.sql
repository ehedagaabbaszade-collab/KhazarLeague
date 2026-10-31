-- Khazar League Database Schema - Core Tables
PRAGMA foreign_keys = ON;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    logo_path TEXT,
    primary_color TEXT DEFAULT '#1a3c5e',
    secondary_color TEXT DEFAULT '#c8a951',
    accent_color TEXT DEFAULT '#ffffff',
    address TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    start_date DATE,
    end_date DATE,
    registration_start DATE,
    registration_end DATE,
    is_current INTEGER DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
    id TEXT PRIMARY KEY,
    season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    format_type TEXT DEFAULT 'group_knockout',
    num_groups INTEGER DEFAULT 4,
    teams_per_group INTEGER DEFAULT 4,
    qualification_per_group INTEGER DEFAULT 2,
    points_win INTEGER DEFAULT 3,
    points_draw INTEGER DEFAULT 1,
    points_loss INTEGER DEFAULT 0,
    tie_break_rules TEXT,
    status TEXT DEFAULT 'draft',
    current_stage TEXT DEFAULT 'group',
    start_date DATE,
    end_date DATE,
    venue TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    season_id TEXT REFERENCES seasons(id) ON DELETE SET NULL,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL,
    group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    short_name TEXT,
    logo_path TEXT,
    captain_id TEXT,
    coach_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    founded_year INTEGER,
    description TEXT,
    status TEXT DEFAULT 'active',
    registration_status TEXT DEFAULT 'pending',
    registration_date DATETIME,
    approved_by TEXT REFERENCES users(id),
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);