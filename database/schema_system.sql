-- Khazar League Database Schema - Documents, Media, Audit, Settings, Backups

-- Documents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_format TEXT DEFAULT 'pdf',
    generated_by TEXT REFERENCES users(id),
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 0
);

-- Media templates
CREATE TABLE IF NOT EXISTS media_templates (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    template_data TEXT NOT NULL,
    thumbnail_path TEXT,
    is_default INTEGER DEFAULT 0,
    created_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Media generations
CREATE TABLE IF NOT EXISTS media_generations (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES media_templates(id) ON DELETE CASCADE,
    tournament_id TEXT REFERENCES tournaments(id) ON DELETE SET NULL,
    match_id TEXT REFERENCES matches(id) ON DELETE SET NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    player_id TEXT REFERENCES players(id) ON DELETE SET NULL,
    output_path TEXT NOT NULL,
    custom_data TEXT,
    generated_by TEXT REFERENCES users(id),
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key)
);

-- Backup records
CREATE TABLE IF NOT EXISTS backup_records (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    backup_type TEXT DEFAULT 'full',
    status TEXT DEFAULT 'completed',
    tables_included TEXT,
    initiated_by TEXT REFERENCES users(id),
    started_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);