/**
 * Khazar League Default Data Insertion - Part 1
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '..', 'khazar_league.db');

function generateId() {
    return crypto.randomUUID();
}
const Database = require('better-sqlite3');
const { insertAdminUser, insertAdminPermissions, insertSettings } = require('./insert-defaults2');

function insertDefaultData() {
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    
    const now = new Date().toISOString();
    const orgId = generateId();
    const seasonId = generateId();
    const tournamentId = generateId();
    const adminId = generateId();
    
    try {
        const existingOrg = db.prepare('SELECT id FROM organizations LIMIT 1').get();
        if (existingOrg) {
            console.log('Default data already exists, skipping...');
            return;
        }
        
        insertOrganization(db, orgId, now);
        insertSeason(db, orgId, seasonId, now);
        insertTournament(db, seasonId, tournamentId, now);
        insertGroups(db, tournamentId, now);
        insertAdminUser(db, orgId, adminId, now);
        insertAdminPermissions(db, adminId, now);
        insertSettings(db, orgId, now);
        
    } catch (error) {
        console.error('Default data insertion failed:', error);
        throw error;
    } finally {
        db.close();
    }
}

function insertOrganization(db, orgId, now) {
    const insertOrg = db.prepare(`
        INSERT INTO organizations (id, name, short_name, primary_color, secondary_color, accent_color, address, contact_email, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertOrg.run(
        orgId,
        'Khazar University',
        'Khazar Uni',
        '#1a3c5e',
        '#c8a951',
        '#ffffff',
        'Baku, Azerbaijan',
        'league@khazar.org',
        1,
        now,
        now
    );
    console.log('Created organization: Khazar University');
}

function insertSeason(db, orgId, seasonId, now) {
    const insertSeason = db.prepare(`
        INSERT INTO seasons (id, organization_id, name, short_name, start_date, end_date, registration_start, registration_end, is_current, is_archived, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertSeason.run(
        seasonId,
        orgId,
        'Khazar League 2024-2025',
        'KL 24/25',
        '2024-09-01',
        '2025-06-30',
        '2024-07-01',
        '2024-08-31',
        1,
        0,
        now,
        now
    );
    console.log('Created season: Khazar League 2024-2025');
}

function insertTournament(db, seasonId, tournamentId, now) {
    const insertTournament = db.prepare(`
        INSERT INTO tournaments (id, season_id, name, short_name, format_type, num_groups, teams_per_group, qualification_per_group, points_win, points_draw, points_loss, tie_break_rules, status, current_stage, start_date, end_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const tieBreakRules = JSON.stringify([
        'points',
        'goal_difference',
        'goals_scored',
        'head_to_head_points',
        'head_to_head_goal_difference',
        'head_to_head_goals_scored',
        'fair_play_points',
        'drawing_of_lots'
    ]);
    
    insertTournament.run(
        tournamentId,
        seasonId,
        'Khazar University Student Football League',
        'KL 2024',
        'group_knockout',
        4,
        4,
        2,
        3,
        1,
        0,
        tieBreakRules,
        'registration',
        'group',
        '2024-09-15',
        '2025-05-30',
        now,
        now
    );
    console.log('Created tournament: Khazar University Student Football League');
}

function insertGroups(db, tournamentId, now) {
    const insertGroup = db.prepare(`
        INSERT INTO groups (id, tournament_id, name, display_order, created_at)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const groups = ['A', 'B', 'C', 'D'];
    groups.forEach((groupName, index) => {
        insertGroup.run(generateId(), tournamentId, groupName, index, now);
    });
    console.log('Created groups: A, B, C, D');
}

module.exports = { insertDefaultData };