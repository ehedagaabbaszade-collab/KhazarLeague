const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'khazar_league.json'), 'utf8'));
const source = JSON.parse(fs.readFileSync(path.join(root, 'data', 'khazar-league-source.json'), 'utf8'));

assert.equal(db.teams.length, 16, '16 real teams imported');
assert.equal(db.players.length, 128, '128 real players imported');
assert.equal(db.groups.filter(g => g.tournament_id === db.tournaments[0].id).length, 4, '4 groups exist');
assert.equal(db.matches.filter(m => m.tournament_id === db.tournaments[0].id).length, 24, '24 source fixtures imported');
assert.equal(source.teams.length, 16);
assert.equal(source.groupMatches.length, 24);
assert.equal(source.knockout.length, 0, 'knockout source remains empty');
assert.equal(db.teams.filter(t => t.logo_path && fs.existsSync(path.join(root, t.logo_path.replace(/^\//,'')))).length, 16, 'all 16 original logo files exist');
assert.ok(db.matches.every(m => m.home_score === null && m.away_score === null), 'no invented scores');
assert.ok(db.matches.every(m => m.match_date === null && m.kickoff_time === null), 'no invented dates or times');
for (const group of ['A','B','C','D']) {
  const groupTeams = source.groups[group];
  const importedGroup=db.groups.find(g=>g.name===group);
  for(const id of groupTeams) assert.equal(db.teams.find(t=>t.id===id)?.group_id,importedGroup.id,`${id} assigned to group ${group}`);
  assert.equal(groupTeams.length, 4, `group ${group} has 4 teams`);
  const fixtures = source.groupMatches.filter(m => m.group === group);
  assert.equal(fixtures.length, 6, `group ${group} has 6 fixtures`);
  for(const fixture of fixtures){
    const imported=db.matches.find(m=>m.id===fixture.id);
    assert.ok(imported,`fixture ${fixture.id} imported`);
    assert.equal(imported.home_team_id,fixture.a);
    assert.equal(imported.away_team_id,fixture.b);
    assert.equal(imported.home_score,fixture.ga);
    assert.equal(imported.away_score,fixture.gb);
  }
  for (const teamId of groupTeams) {
    assert.equal(source.teams.find(t => t.id === teamId)?.players.length, 8, `${teamId} has 8 registered players`);
  }
}
assert.ok(db.players.every(p => p.phone === null || typeof p.phone === 'string'));
for (const team of source.teams) {
  const imported=db.teams.find(t=>t.id===team.id);
  assert.equal(imported.name,team.name,`team name preserved for ${team.id}`);
  assert.equal(imported.captain_name,team.captain||null,`captain preserved for ${team.id}`);
  const logoFile=path.join(root,(imported.logo_path||'').replace(/^\//,''));
  const original=Buffer.from(String(team.logo||'').split(',')[1]||'','base64');
  assert.ok(fs.existsSync(logoFile),`logo file exists for ${team.id}`);
  assert.deepEqual(fs.readFileSync(logoFile),original,`logo bytes unchanged for ${team.id}`);
}
for (const group of ['A','B','C','D']) {
  for (const round of [1,2,3]) {
    const roundMatches=db.matches.filter(m=>m.group_name===group&&m.round_number===round);
    assert.equal(roundMatches.length,2,`${group} round ${round} has 2 matches`);
    const used=roundMatches.flatMap(m=>[m.home_team_id,m.away_team_id]);
    assert.equal(new Set(used).size,4,`${group} round ${round} has no repeated team`);
  }
}
console.log('Khazar League data integrity tests passed: 16 teams, 128 players, 4 groups, 24 fixtures, 16 original logos, no fabricated scores/dates.');
