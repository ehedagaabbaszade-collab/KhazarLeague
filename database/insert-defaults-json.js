/**
 * Khazar League Default Data Insertion - Part 1
 */

const { hashPasswordSync } = require('./password-utils');
const { getDatabase, generateId } = require('./json-db');

function insertDefaultData() {
    console.log('Inserting default data...');
    const db = getDatabase();
    const now = new Date().toISOString();
    const orgId = generateId();
    const seasonId = generateId();
    const tournamentId = generateId();
    const adminId = generateId();
    
    // Organization
    db.table('organizations').insert({
        id: orgId, name: 'Khazar University', short_name: 'Khazar Uni',
        logo_path: null, primary_color: '#1a3c5e', secondary_color: '#c8a951',
        accent_color: '#ffffff', address: 'Baku, Azerbaijan', contact_email: 'league@khazar.org',
        contact_phone: null, website: null, is_active: 1, created_at: now, updated_at: now
    });
    console.log('Created organization: Khazar University');
    
    // Season
    db.table('seasons').insert({
        id: seasonId, organization_id: orgId, name: 'Khazar League 2024-2025',
        short_name: 'KL 24/25', start_date: '2024-09-01', end_date: '2025-06-30',
        registration_start: '2024-07-01', registration_end: '2024-08-31',
        is_current: 1, is_archived: 0, description: null, created_at: now, updated_at: now
    });
    console.log('Created season: Khazar League 2024-2025');
    
    // Tournament
    const tieBreakRules = JSON.stringify([
        'points','goal_difference','goals_scored','head_to_head_points',
        'head_to_head_goal_difference','head_to_head_goals_scored',
        'fair_play_points','drawing_of_lots'
    ]);
    
    db.table('tournaments').insert({
        id: tournamentId, season_id: seasonId, name: 'Khazar University Student Football League',
        short_name: 'KL 2024', format_type: 'group_knockout', num_groups: 4,
        teams_per_group: 4, qualification_per_group: 2, points_win: 3,
        points_draw: 1, points_loss: 0, tie_break_rules: tieBreakRules,
        status: 'registration', current_stage: 'group',
        start_date: '2024-09-15', end_date: '2025-05-30', venue: null, description: null,
        created_at: now, updated_at: now
    });
    console.log('Created tournament: Khazar University Student Football League');
    
    // Groups
    ['A','B','C','D'].forEach((g,i)=>db.table('groups').insert({id:generateId(),tournament_id:tournamentId,name:g,display_order:i,created_at:now}));
    console.log('Created groups: A, B, C, D');
    
    return { db, now, orgId, adminId };
}

module.exports = { insertDefaultData, hashPasswordSync };