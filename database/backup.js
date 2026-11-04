const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const source = path.join(root, 'data', 'khazar_league.json');
const outputDir = path.join(root, 'data', 'backups');
if (!fs.existsSync(source)) throw new Error(`Active database not found: ${source}`);
fs.mkdirSync(outputDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(outputDir, `khazar_league_${stamp}.json`);
const bytes = fs.readFileSync(source);
JSON.parse(bytes.toString('utf8'));
fs.writeFileSync(target, bytes);
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if (hash(source) !== hash(target)) {
  fs.unlinkSync(target);
  throw new Error('Backup verification failed: SHA-256 mismatch');
}
console.log(JSON.stringify({ backup: path.relative(root, target), bytes: bytes.length, sha256: hash(target), verified: true }, null, 2));
