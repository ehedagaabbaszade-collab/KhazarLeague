/**
 * Khazar League Default Data Insertion - Part 2
 */

const { hashPasswordSync } = require('./password-utils');
const { getDatabase, generateId } = require('./json-db');
const { insertDefaultData: insertPart1 } = require('./insert-defaults-json');

function insertRemainingData({ db, now, orgId, adminId }) {
    // Admin user
    const passwordHash = hashPasswordSync('KhazarLeague2024!');
    db.table('users').insert({
        id: adminId, organization_id: orgId, email: 'admin@khazar.org',
        password_hash: passwordHash, full_name: 'Super Administrator', phone: null,
        role: 'super_admin', avatar_path: null, is_active: 1, is_verified: 1,
        last_login: null, failed_login_attempts: 0, locked_until: null,
        password_reset_token: null, password_reset_expires: null,
        email_verification_token: null, created_at: now, updated_at: now
    });
    console.log('Created super admin: admin@khazar.org');
    console.log('Default password: KhazarLeague2024! (CHANGE ON FIRST LOGIN)');
    
    // Permissions
    const perms = ['tournament.create','tournament.read','tournament.update','tournament.delete','tournament.archive','team.create','team.read','team.update','team.delete','team.approve','player.create','player.read','player.update','player.delete','player.approve','match.create','match.read','match.update','match.delete','match.report','match.event.create','match.event.update','match.event.delete','standings.read','standings.recalculate','referee.create','referee.read','referee.update','referee.assign','award.create','award.read','award.update','award.assign','announcement.create','announcement.read','announcement.update','announcement.delete','announcement.publish','document.generate','document.read','document.download','media.template.create','media.template.read','media.template.update','media.template.delete','media.generate','media.read','media.download','analytics.read','analytics.export','user.create','user.read','user.update','user.delete','user.manage_roles','settings.read','settings.update','backup.create','backup.read','backup.restore','audit.read'];
    perms.forEach(p=>db.table('user_permissions').insert({id:generateId(),user_id:adminId,permission_key:p,resource_type:null,resource_id:null,granted_by:adminId,granted_at:now,expires_at:null}));
    console.log('Assigned all permissions to super admin');
    
    // Settings
    const settings=[['site_name','Khazar League','Site name',1],['site_tagline','Khazar University Student Football League','Site tagline',1],['default_language','az','Default language',1],['timezone','Asia/Baku','Timezone',1],['date_format','DD.MM.YYYY','Date format',1],['time_format','HH:mm','Time format',1],['currency','AZN','Currency',1],['max_file_upload_mb','10','Max upload MB',0],['allowed_image_types','jpg,jpeg,png,webp','Image types',0],['session_timeout_minutes','60','Session timeout',0],['max_login_attempts','5','Max login attempts',0],['lockout_duration_minutes','15','Lockout duration',0],['password_min_length','8','Min password length',0],['require_2fa','false','Require 2FA',0],['email_notifications_enabled','true','Email notifications',0],['telegram_bot_token','','Telegram bot token',0],['telegram_chat_id','','Telegram chat ID',0],['maintenance_mode','false','Maintenance mode',0],['registration_open','true','Registration open',1],['public_standings_enabled','true','Public standings',1],['public_player_stats_enabled','true','Public player stats',1]];
    settings.forEach(([k,v,d,p])=>db.table('settings').insert({id:generateId(),organization_id:orgId,key:k,value:v,description:d,is_public:p,created_at:now,updated_at:now}));
    console.log('Inserted default settings');
    
    db.save();
}

function initializeDatabase() {
    console.log('Initializing Khazar League database (JSON mode)...');
    const db = getDatabase();
    if (db.db.organizations.length === 0) {
        const part1 = insertPart1();
        insertRemainingData(part1);
    }
    console.log('Database initialization completed successfully');
    return db;
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase, insertRemainingData };