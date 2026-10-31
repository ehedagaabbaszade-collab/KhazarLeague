-- Khazar League Database Schema - Matches and Events

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    season_id TEXT NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
    round_name TEXT,
    round_number INTEGER,
    match_number INTEGER,
    home_team_id TEXT NOT NULL REFERENCES teams(id),
    away_team_id TEXT NOT NULL REFERENCES teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    home_penalties INTEGER,
    away_penalties INTEGER,
    venue TEXT,
    match_date DATE NOT NULL,
    kickoff_time TIME,
    referee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_referee_1_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    assistant_referee_2_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    fourth_official_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    match_status TEXT DEFAULT 'scheduled',
    attendance INTEGER,
    weather TEXT,
    pitch_condition TEXT,
    match_report TEXT,
    started_at DATETIME,
    ended_at DATETIME,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Match events
CREATE TABLE IF NOT EXISTS match_events (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id),
    player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
    assist_player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    minute INTEGER NOT NULL,
    added_time INTEGER DEFAULT 0,
    period TEXT DEFAULT 'first_half',
    description TEXT,
    is_confirmed INTEGER DEFAULT 1,
    confirmed_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Match lineups
CREATE TABLE IF NOT EXISTS match_lineups (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id),
    player_id TEXT NOT NULL REFERENCES players(id),
    is_starter INTEGER DEFAULT 1,
    position TEXT,
    jersey_number INTEGER,
    substituted_at INTEGER,
    substituted_by TEXT REFERENCES players(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Group standings
CREATE TABLE IF NOT EXISTS group_standings (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id),
    position INTEGER,
    played INTEGER DEFAULT 0,
    won INTEGER DEFAULT 0,
    drawn INTEGER DEFAULT 0,
    lost INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    form TEXT,
    qualified INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, group_id, team_id)
);

-- Player tournament stats
CREATE TABLE IF NOT EXISTS player_tournament_stats (
    id TEXT PRIMARY KEY,
    tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL REFERENCES teams(id),
    appearances INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    minutes_played INTEGER DEFAULT 0,
    penalties_scored INTEGER DEFAULT 0,
    penalties_missed INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, player_id)
);