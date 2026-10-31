-- Khazar League Database Schema - Indexes, Views, Triggers

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(match_status);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_standings_tournament_group ON group_standings(tournament_id, group_id);
CREATE INDEX IF NOT EXISTS idx_announcements_org ON announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Views
CREATE VIEW IF NOT EXISTS v_team_summary AS
SELECT 
    t.id,
    t.name,
    t.short_name,
    t.logo_path,
    t.group_id,
    g.name as group_name,
    t.captain_id,
    p.first_name || ' ' || p.last_name as captain_name,
    COUNT(pl.id) as player_count,
    COALESCE(gs.played, 0) as matches_played,
    COALESCE(gs.won, 0) as wins,
    COALESCE(gs.drawn, 0) as draws,
    COALESCE(gs.lost, 0) as losses,
    COALESCE(gs.goals_for, 0) as goals_scored,
    COALESCE(gs.goals_against, 0) as goals_conceded,
    COALESCE(gs.goal_difference, 0) as goal_difference,
    COALESCE(gs.points, 0) as points,
    COALESCE(gs.position, 0) as position
FROM teams t
LEFT JOIN groups g ON t.group_id = g.id
LEFT JOIN players p ON t.captain_id = p.id
LEFT JOIN players pl ON pl.team_id = t.id AND pl.registration_status = 'approved'
LEFT JOIN group_standings gs ON gs.team_id = t.id
WHERE t.status = 'active'
GROUP BY t.id;

CREATE VIEW IF NOT EXISTS v_player_summary AS
SELECT 
    pl.id,
    pl.first_name,
    pl.last_name,
    pl.jersey_number,
    pl.position,
    pl.team_id,
    t.name as team_name,
    pl.goals,
    pl.assists,
    pl.appearances,
    pl.yellow_cards,
    pl.red_cards,
    (pl.goals + pl.assists) as goal_contributions
FROM players pl
JOIN teams t ON pl.team_id = t.id
WHERE pl.registration_status = 'approved' AND pl.status = 'active';

CREATE VIEW IF NOT EXISTS v_match_summary AS
SELECT 
    m.id,
    m.tournament_id,
    m.round_name,
    m.match_date,
    m.kickoff_time,
    m.venue,
    m.match_status,
    m.home_team_id,
    ht.name as home_team_name,
    ht.logo_path as home_team_logo,
    m.away_team_id,
    at.name as away_team_name,
    at.logo_path as away_team_logo,
    m.home_score,
    m.away_score,
    m.home_penalties,
    m.away_penalties,
    m.referee_id,
    r.full_name as referee_name
FROM matches m
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
LEFT JOIN users r ON m.referee_id = r.id;

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS tr_organizations_updated
AFTER UPDATE ON organizations
BEGIN
    UPDATE organizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_seasons_updated
AFTER UPDATE ON seasons
BEGIN
    UPDATE seasons SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_tournaments_updated
AFTER UPDATE ON tournaments
BEGIN
    UPDATE tournaments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_teams_updated
AFTER UPDATE ON teams
BEGIN
    UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_users_updated
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_players_updated
AFTER UPDATE ON players
BEGIN
    UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_matches_updated
AFTER UPDATE ON matches
BEGIN
    UPDATE matches SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_match_events_updated
AFTER UPDATE ON match_events
BEGIN
    UPDATE match_events SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_announcements_updated
AFTER UPDATE ON announcements
BEGIN
    UPDATE announcements SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_media_templates_updated
AFTER UPDATE ON media_templates
BEGIN
    UPDATE media_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_settings_updated
AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;