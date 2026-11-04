// Restore logo assets from the project's preserved original source JSON.
// Existing variants are backed up outside the public uploads directory first.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'data', 'khazar-league-source.json');
const dbPath = path.join(root, 'data', 'khazar_league.json');
const backupDir = path.join(root, 'data', 'team-logo-backup');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
fs.mkdirSync(backupDir, { recursive: true });
const repaired = [];
for (const sourceTeam of source.teams || []) {
  const team = db.teams.find(item => item.id === sourceTeam.id);
  if (!team?.logo_path || !sourceTeam.logo) continue;
  const target = path.join(root, team.logo_path.replace(/^\//, ''));
  const original = Buffer.from(String(sourceTeam.logo).split(',')[1] || '', 'base64');
  if (!original.length) continue;
  const digest = value => crypto.createHash('sha256').update(value).digest('hex');
  if (fs.existsSync(target) && digest(fs.readFileSync(target)) === digest(original)) continue;
  const backup = path.join(backupDir, `${path.basename(target)}.pre-repair.bak`);
  if (fs.existsSync(target) && !fs.existsSync(backup)) fs.copyFileSync(target, backup);
  fs.writeFileSync(target, original);
  if (digest(fs.readFileSync(target)) !== digest(original)) throw new Error(`Logo verification failed: ${team.id}`);
  repaired.push({ team_id: team.id, path: path.relative(root, target), sha256: digest(original) });
}
console.log(JSON.stringify({ repaired: repaired.length, files: repaired, backup_directory: path.relative(root, backupDir) }, null, 2));
