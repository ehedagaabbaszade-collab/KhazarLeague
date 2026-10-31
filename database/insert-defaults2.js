/**
 * Khazar League Default Data Insertion - Part 2
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
function generateId() { return crypto.randomUUID(); }

function insertAdminUser(db, orgId, adminId, now) {
    const passwordHash = bcrypt.hashSync('KhazarLeague2024!', 12);
    
    const insertUser = db.prepare(`
        INSERT INTO users (id, organization_id, email, password_hash, full_name, role, is_active, is_verified, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertUser.run(
        adminId,
        orgId,
        'admin@khazar.org',
        passwordHash,
        'Super Administrator',
        'super_admin',
        1,
        1,
        now,
        now
    );
    console.log('Created super admin user: admin@khazar.org');
    console.log('Default password: KhazarLeague2024! (CHANGE ON FIRST LOGIN)');
}

function insertAdminPermissions(db, adminId, now) {
    const permissions = [
        'tournament.create', 'tournament.read', 'tournament.update', 'tournament.delete', 'tournament.archive',
        'team.create', 'team.read', 'team.update', 'team.delete', 'team.approve',
        'player.create', 'player.read', 'player.update', 'player.delete', 'player.approve',
        'match.create', 'match.read', 'match.update', 'match.delete', 'match.report',
        'match.event.create', 'match.event.update', 'match.event.delete',
        'standings.read', 'standings.recalculate',
        'referee.create', 'referee.read', 'referee.update', 'referee.assign',
        'award.create', 'award.read', 'award.update', 'award.assign',
        'announcement.create', 'announcement.read', 'announcement.update', 'announcement.delete', 'announcement.publish',
        'document.generate', 'document.read', 'document.download',
        'media.template.create', 'media.template.read', 'media.template.update', 'media.template.delete',
        'media.generate', 'media.read', 'media.download',
        'analytics.read', 'analytics.export',
        'user.create', 'user.read', 'user.update', 'user.delete', 'user.manage_roles',
        'settings.read', 'settings.update',
        'backup.create', 'backup.read', 'backup.restore',
        'audit.read'
    ];
    
    const insertPermission = db.prepare(`
        INSERT INTO user_permissions (id, user_id, permission_key, granted_by, granted_at)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    permissions.forEach(perm => {
        insertPermission.run(generateId(), adminId, perm, adminId, now);
    });
    console.log('Assigned all permissions to super admin');
}

function insertSettings(db, orgId, now) {
    const insertSetting = db.prepare(`
        INSERT INTO settings (id, organization_id, key, value, description, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const settings = [
        ['site_name', 'Khazar League', 'Site name for public display', 1],
        ['site_tagline', 'Khazar University Student Football League', 'Site tagline', 1],
        ['default_language', 'az', 'Default language (az, en, ru)', 1],
        ['timezone', 'Asia/Baku', 'System timezone', 1],
        ['date_format', 'DD.MM.YYYY', 'Date display format', 1],
        ['time_format', 'HH:mm', 'Time display format', 1],
        ['currency', 'AZN', 'Currency code', 1],
        ['max_file_upload_mb', '10', 'Maximum file upload size in MB', 0],
        ['allowed_image_types', 'jpg,jpeg,png,webp', 'Allowed image file types', 0],
        ['session_timeout_minutes', '60', 'Session timeout in minutes', 0],
        ['max_login_attempts', '5', 'Maximum failed login attempts before lockout', 0],
        ['lockout_duration_minutes', '15', 'Lockout duration in minutes', 0],
        ['password_min_length', '8', 'Minimum password length', 0],
        ['require_2fa', 'false', 'Require two-factor authentication for admins', 0],
        ['email_notifications_enabled', 'true', 'Enable email notifications', 0],
        ['telegram_bot_token', '', 'Telegram bot token for notifications (optional)', 0],
        ['telegram_chat_id', '', 'Telegram chat ID for notifications (optional)', 0],
        ['maintenance_mode', 'false', 'Enable maintenance mode', 0],
        ['registration_open', 'true', 'Allow team/player registration', 1],
        ['public_standings_enabled', 'true', 'Show standings on public site', 1],
        ['public_player_stats_enabled', 'true', 'Show player stats on public site', 1]
    ];
    
    settings.forEach(([key, value, description, isPublic]) => {
        insertSetting.run(generateId(), orgId, key, value, description, isPublic, now, now);
    });
    console.log('Inserted default settings');
}

module.exports = { insertAdminUser, insertAdminPermissions, insertSettings };