const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { dateIso } = require('../database/import-roster');
const { hashPasswordSync, verifyPasswordSync } = require('../database/password-utils');

const root = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(root, 'data', 'khazar_league.json'), 'utf8'));
const source = JSON.parse(fs.readFileSync(path.join(root, 'data', 'khazar-league-source.json'), 'utf8'));
const roster = JSON.parse(fs.readFileSync(path.join(root, 'imports', 'khazar_league_rosters_2026_az.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(root, 'imports', 'roster-import-report.json'), 'utf8'));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
require('./lineup-formations.test');
require('./voting-utils.test');

assert.equal(roster.teams.length, 16);
assert.equal(roster.teams.reduce((n,t)=>n+t.players.length,0),128);
assert.equal(db.teams.length,16);
assert.equal(db.players.length,128);
assert.equal(db.groups.filter(g=>g.tournament_id===db.tournaments[0].id).length,4);
assert.equal(db.matches.filter(m=>m.tournament_id===db.tournaments[0].id).length,24);
assert.ok(db.archived_players.length>0,'legacy players absent from the new roster are retained in the archive');
assert.ok(db.archived_players.every(p=>p.id&&p.archived_at),'archived players retain their identities and archive timestamp');
assert.ok(db.matches.every(m=>m.home_score===null&&m.away_score===null));
assert.ok(db.matches.every(m=>m.match_date===null&&m.kickoff_time===null));
assert.equal(report.mode,'applied');
assert.equal(report.totals.teams,16);
assert.equal(report.totals.players,128);
assert.equal(new Set(db.teams.map(t=>t.id)).size,16);
assert.equal(new Set(db.players.map(p=>p.id)).size,128);
assert.ok(db.players.every(p=>p.phone===null||typeof p.phone==='string'));
assert.ok(db.players.every(p=>p.student_id===null||typeof p.student_id==='string'));

const teamsByName=new Map(report.teams.map(t=>[t.source,t.team_id]));
for(const sourceTeam of roster.teams){
  const teamId=teamsByName.get(sourceTeam.name);
  assert.ok(teamId,`team mapping exists for ${sourceTeam.name}`);
  const team=db.teams.find(t=>t.id===teamId);
  assert.equal(team.name,sourceTeam.name);
  const players=db.players.filter(p=>p.team_id===teamId);
  assert.equal(players.length,8,`${sourceTeam.name} has eight players`);
  for(const expected of sourceTeam.players){
    const actual=players.find(p=>p.full_name===expected.full_name);
    assert.ok(actual,`player ${expected.full_name} exists on ${sourceTeam.name}`);
    assert.equal(actual.first_name,expected.first_name);
    assert.equal(actual.last_name,expected.last_name);
    assert.equal(actual.jersey_number,expected.shirt_number);
    if (actual.position_status === 'needs_admin_review') {
      assert.equal(actual.position,expected.position);
      assert.equal(actual.position_code,null);
    } else {
      assert.ok(actual.position_code,`confirmed role code exists for ${expected.full_name}`);
    }
    assert.equal(actual.date_of_birth,dateIso(expected.date_of_birth));
    assert.equal(actual.nationality,expected.nationality);
    assert.equal(actual.preferred_foot,expected.preferred_foot);
    assert.equal(actual.is_captain,expected.captain?1:0);
  }
}
assert.deepEqual(db.players.filter(p=>p.is_captain===1).map(p=>p.full_name).sort(),['Ağa Ağazadə','Həkimxan Həsənxanlı'].sort());

for(const group of ['A','B','C','D']){
  const sourceIds=source.groups[group];
  const groupRow=db.groups.find(g=>g.name===group);
  assert.equal(sourceIds.length,4);
  for(const id of sourceIds)assert.equal(db.teams.find(t=>t.id===id)?.group_id,groupRow.id);
  for(const fixture of source.groupMatches.filter(m=>m.group===group)){
    const actual=db.matches.find(m=>m.id===fixture.id);
    assert.ok(actual,`fixture ${fixture.id} is preserved`);
    assert.equal(actual.home_team_id,fixture.a);
    assert.equal(actual.away_team_id,fixture.b);
    assert.equal(actual.home_score,null);
    assert.equal(actual.away_score,null);
  }
}
for(const originalTeam of source.teams){
  const imported=db.teams.find(t=>t.id===originalTeam.id);
  const file=path.join(root,(imported.logo_path||'').replace(/^\//,''));
  const original=Buffer.from(String(originalTeam.logo||'').split(',')[1]||'','base64');
  assert.ok(fs.existsSync(file),`logo exists for ${originalTeam.id}`);
  assert.equal(digest(fs.readFileSync(file)),digest(original),`original logo bytes restored for ${originalTeam.id}`);
}
for(const group of ['A','B','C','D'])for(const round of [1,2,3]){
  const matches=db.matches.filter(m=>m.group_name===group&&m.round_number===round);
  assert.equal(matches.length,2,`${group} round ${round} contains two matches`);
  assert.equal(new Set(matches.flatMap(m=>[m.home_team_id,m.away_team_id])).size,4,`${group} round ${round} uses four distinct teams`);
}
assert.equal(dateIso('25.09.2008'),'2008-09-25');
assert.equal(dateIso(''),null);
const passwordHash=hashPasswordSync('Az-test-2026');
assert.equal(verifyPasswordSync('Az-test-2026',passwordHash),true);
assert.equal(verifyPasswordSync('wrong-password',passwordHash),false);
console.log('Khazar League integrity checks passed: 16 teams, 128 roster players, captain assignments, original fixtures, standings groups, and exact logo assets.');
