// Idempotently import the supplied 2026 roster into the active JSON database.
// Run only after making a verified backup: node database/import-roster.js --apply
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const dbPath = path.join(root, 'data', 'khazar_league.json');
const legacyBackupPath = path.join(root, 'data', 'khazar_league.json.pre-roster-import.bak');
const rosterPath = path.join(root, 'imports', 'khazar_league_rosters_2026_az.json');
const reportPath = path.join(root, 'imports', 'roster-import-report.json');
const now = new Date().toISOString();
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('az').replace(/[^a-z0-9]/g, '');
const dateIso = value => {
  if (!value) return null;
  const match = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : null;
};

function importRoster({ apply = false } = {}) {
  const db = readJson(dbPath);
  const roster = readJson(rosterPath);
  let legacyBackup = null;
  if (apply) {
    if (!fs.existsSync(legacyBackupPath)) throw new Error('A pre-import database backup is required before applying the roster.');
    legacyBackup = readJson(legacyBackupPath);
    if (!Array.isArray(legacyBackup.teams) || !Array.isArray(legacyBackup.players)) throw new Error('Pre-import database backup is invalid.');
  }
  if (roster.team_count !== 16 || roster.player_count !== 128 || roster.teams?.length !== 16 || roster.teams.some(t => t.players?.length !== 8)) {
    throw new Error('Roster validation failed: expected 16 teams and 8 players per team.');
  }
  const aliases = new Map([
    ['turizmfk', 'turizimfk'], ['ghostfc', 'ghostfc'], ['khazareaglesfc', 'khazareagles'],
    ['khazarstormfc', 'khazarstorm'], ['zenithmfc', 'zenithfc']
  ]);
  const canonical = name => aliases.get(normalize(name)) || normalize(name);
  const teamsByName = new Map(db.teams.map(t => [canonical(t.name), t]));
  const sourcePlayers = [];
  const teamMapping = [];
  const usedTeams = new Set();
  for (const sourceTeam of roster.teams) {
    const team = teamsByName.get(canonical(sourceTeam.name));
    if (!team || usedTeams.has(team.id)) throw new Error(`Unable to map roster team uniquely: ${sourceTeam.name}`);
    usedTeams.add(team.id);
    teamMapping.push({ source: sourceTeam.name, database: team.name, team_id: team.id });
    for (const [index, player] of sourceTeam.players.entries()) sourcePlayers.push({ sourceTeam, team, player, index });
  }
  if (usedTeams.size !== 16) throw new Error('Roster does not map to all 16 existing teams.');

  const oldPlayers = db.players || [];
  const byTeamAndName = new Map(oldPlayers.map(p => [`${p.team_id}|${normalize(p.full_name || `${p.first_name} ${p.last_name}`)}`, p]));
  const seen = new Set();
  const players = sourcePlayers.map(({ team, player, index }) => {
    const key = `${team.id}|${normalize(player.full_name)}`;
    if (seen.has(key)) throw new Error(`Duplicate roster player: ${player.full_name} (${team.name})`);
    seen.add(key);
    const existing = byTeamAndName.get(key);
    return {
      ...(existing || {}),
      id: existing?.id || `${team.id}-roster-${String(index + 1).padStart(2, '0')}`,
      team_id: team.id,
      tournament_id: team.tournament_id || db.tournaments?.[0]?.id || null,
      season_id: team.season_id || db.seasons?.[0]?.id || null,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: player.full_name,
      jersey_number: player.shirt_number ?? null,
      phone: existing?.phone ?? null,
      student_id: existing?.student_id ?? null,
      position: player.position || null,
      date_of_birth: dateIso(player.date_of_birth),
      nationality: player.nationality || null,
      preferred_foot: player.preferred_foot || null,
      is_captain: player.captain === true ? 1 : 0,
      registration_status: player.registration_status || 'initial_roster',
      status: existing?.status || 'active',
      created_at: existing?.created_at || now,
      updated_at: now
    };
  });
  const captains = sourcePlayers.filter(x => x.player.captain === true).map(x => ({ team: x.team.name, player: x.player.full_name }));
  if (captains.length !== 2 || !captains.some(x => x.player === 'Həkimxan Həsənxanlı') || !captains.some(x => x.player === 'Ağa Ağazadə')) {
    throw new Error('Explicit captain validation failed.');
  }
  const report = {
    generated_at: now, source: path.relative(root, rosterPath), source_sha256: crypto.createHash('sha256').update(fs.readFileSync(rosterPath)).digest('hex'),
    mode: apply ? 'applied' : 'dry-run', totals: { teams: usedTeams.size, players: players.length, matched_existing_players: players.filter(p => byTeamAndName.has(`${p.team_id}|${normalize(p.full_name)}`)).length, added_players: players.filter(p => !byTeamAndName.has(`${p.team_id}|${normalize(p.full_name)}`)).length },
    captains, teams: teamMapping, validation: { teams: usedTeams.size === 16, eight_players_each: players.length === 128 && Object.values(players.reduce((a,p) => (a[p.team_id]=(a[p.team_id]||0)+1,a),{})).every(n => n === 8), unique_players: new Set(players.map(p => `${p.team_id}|${normalize(p.full_name)}`)).size === 128 }
  };
  if (!Object.values(report.validation).every(Boolean)) throw new Error('Post-import validation failed.');
  if (apply) {
    const priorPlayers = legacyBackup?.players || [];
    const currentKeys = new Set(players.map(p => `${p.team_id}|${normalize(p.full_name)}`));
    const archivedById = new Map((db.archived_players || []).map(p => [p.id, p]));
    for (const legacyPlayer of [...priorPlayers, ...oldPlayers]) {
      if (currentKeys.has(`${legacyPlayer.team_id}|${normalize(legacyPlayer.full_name || `${legacyPlayer.first_name} ${legacyPlayer.last_name}`)}`)) continue;
      if (!archivedById.has(legacyPlayer.id)) archivedById.set(legacyPlayer.id, { ...legacyPlayer, archived_at: now, archived_reason: '2026 roster reconciliation' });
    }
    db.archived_players = [...archivedById.values()];
    report.totals.archived_legacy_players = db.archived_players.length;
    const rosterTeams = new Map(teamMapping.map(x => [x.team_id, x]));
    for (const team of db.teams) {
      const mapping = rosterTeams.get(team.id);
      if (mapping) team.name = mapping.source;
      const captain = captains.find(x => team.name === x.team);
      team.captain_name = captain?.player || null;
      team.captain_id = captain ? players.find(p => p.team_id === team.id && p.full_name === captain.player)?.id || null : null;
      team.updated_at = now;
    }
    db.players = players;
    const tempDbPath = `${dbPath}.tmp`;
    fs.writeFileSync(tempDbPath, JSON.stringify(db, null, 2), 'utf8');
    readJson(tempDbPath);
    fs.renameSync(tempDbPath, dbPath);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  }
  return report;
}

if (require.main === module) {
  const result = importRoster({ apply: process.argv.includes('--apply') });
  console.log(JSON.stringify(result, null, 2));
  if (!process.argv.includes('--apply')) console.log('Dry run only. Re-run with --apply after verifying a backup.');
}

module.exports = { importRoster, dateIso };
