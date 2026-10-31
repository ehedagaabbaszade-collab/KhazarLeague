/**
 * Import the exact user-supplied Khazar League JSON.
 * Original team/player fields and Base64 logos are preserved.
 * No missing match dates, scores, or knockout fixtures are fabricated.
 */
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./json-db');
const SOURCE = path.join(__dirname, '..', 'data', 'khazar-league-source.json');

function seedKhazar2026() {
  const db = getDatabase();
  if ((db.db.teams || []).length > 0 || (db.db.players || []).length > 0 || (db.db.matches || []).length > 0) {
    return { seeded: false, reason: 'existing_competition_data_preserved' };
  }
  if (!fs.existsSync(SOURCE)) return { seeded: false, reason: 'source_json_missing' };
  const source = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  if (!Array.isArray(source.teams) || source.teams.length !== 16 ||
      !Array.isArray(source.groupMatches) || source.groupMatches.length !== 24 ||
      !source.groups || Object.keys(source.groups).length !== 4) {
    throw new Error('Khazar League source JSON validation failed');
  }

  const tournament = (db.db.tournaments || []).find(t => t.status !== 'archived') || db.db.tournaments[0];
  if (!tournament) throw new Error('No tournament record exists to receive imported teams');
  const now = new Date().toISOString();
  const groups = {};
  for (const name of ['A','B','C','D']) {
    let group = (db.db.groups || []).find(g => g.tournament_id === tournament.id && g.name === name);
    if (!group) {
      group = { id: `khazar-group-${name.toLowerCase()}`, tournament_id:tournament.id, name, display_order:name.charCodeAt(0)-65, created_at:now };
      db.db.groups.push(group);
    }
    groups[name] = group;
  }

  const teamIds = new Set(source.teams.map(t => t.id));
  const teamMap = {};
  let playerCount = 0;
  for (const item of source.teams) {
    const groupName = Object.keys(source.groups).find(name => source.groups[name].includes(item.id));
    if (!groupName) throw new Error(`Group assignment missing for ${item.id}`);
    const team = {
      id:item.id, name:item.name, short_name:item.name,
      organization_id:tournament.organization_id||null, season_id:tournament.season_id||null,
      tournament_id:tournament.id, group_id:groups[groupName].id,
      captain_name:item.captain||null, captain_phone:item.phone||null,
      student_ticket:item.ticket||null, contact_phone:item.contact||null,
      coordinator:item.coordinator||null, submitted_team_name:item.submittedTeamName||null,
      registration_status:item.registrationStatus||'Məlumat göstərilməyib',
      status:'active', registration_date:null, captain_id:null,
      logo_path:null, created_at:now, updated_at:now
    };
    if (item.logo) {
      const match=String(item.logo).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (match) {
        const ext=match[1].split('/')[1].replace('jpeg','jpg').replace('svg+xml','svg');
        const uploadDir=path.join(__dirname,'..','uploads','teams');
        fs.mkdirSync(uploadDir,{recursive:true});
        const filename=`${item.id}.${ext}`;
        fs.writeFileSync(path.join(uploadDir,filename),Buffer.from(match[2],'base64'));
        team.logo_path=`/uploads/teams/${filename}`;
      }
    }
    db.db.teams.push(team);
    teamMap[item.id]=team;
    for (let index=0; index<(item.players||[]).length; index++) {
      const player=item.players[index];
      const fullName=String(player.name||'').trim();
      const parts=fullName.split(/\s+/);
      const firstName=parts.shift()||'';
      const lastName=parts.join(' ');
      db.db.players.push({
        id:`${item.id}-player-${String(index+1).padStart(2,'0')}`,
        team_id:item.id, tournament_id:tournament.id, season_id:tournament.season_id||null,
        first_name:firstName, last_name:lastName, full_name:fullName,
        phone:player.phone||null, student_id:player.ticket||null,
        jersey_number:player.jersey||null, course:player.course||null,
        position:null, nationality:'Azerbaijan', registration_status:'registered',
        status:'active', is_captain:fullName===item.captain?1:0,
        created_at:now, updated_at:now
      });
      playerCount++;
    }
  }

  const roundPairs=[[[0,3],[1,2]],[[0,2],[3,1]],[[0,1],[2,3]]];
  for (const fixture of source.groupMatches) {
    if (!teamIds.has(fixture.a)||!teamIds.has(fixture.b)) throw new Error(`Invalid team reference in ${fixture.id}`);
    const group=groups[fixture.group];
    if (!group) throw new Error(`Invalid group in ${fixture.id}`);
    const groupOrder=source.groups[fixture.group];
    const ia=groupOrder.indexOf(fixture.a), ib=groupOrder.indexOf(fixture.b);
    const roundIndex=roundPairs.findIndex(pairs=>pairs.some(pair=>(pair[0]===ia&&pair[1]===ib)||(pair[0]===ib&&pair[1]===ia)));
    db.db.matches.push({
      id:fixture.id, tournament_id:tournament.id, season_id:tournament.season_id||null,
      group_id:group.id, group_name:fixture.group, stage:'group',
      home_team_id:fixture.a, away_team_id:fixture.b,
      home_score:fixture.ga, away_score:fixture.gb,
      home_penalties:null, away_penalties:null, venue:null, match_date:null, kickoff_time:null,
      round_name:`${roundIndex+1}-ci tur`, round_number:roundIndex+1, match_number:null,
      match_status:fixture.ga===null||fixture.gb===null?'scheduled':'completed',
      result_locked:0, result_approved:0, created_at:now, updated_at:now
    });
  }

  // JSON explicitly contains an empty knockout list; keep it empty.
  db.db.knockout_matches = Array.isArray(source.knockout) ? source.knockout : [];
  tournament.name='Khazar League 2026';
  tournament.short_name='KL 2026';
  tournament.num_groups=4; tournament.teams_per_group=4; tournament.qualification_per_group=2;
  tournament.points_win=3; tournament.points_draw=1; tournament.points_loss=0;
  tournament.tie_break_rules=JSON.stringify(['points','goal_difference','goals_scored','head_to_head']);
  tournament.start_date=null; tournament.end_date=null; tournament.venue=null;
  tournament.status='registration'; tournament.current_stage='group'; tournament.updated_at=now;
  const season=(db.db.seasons||[]).find(x=>x.id===tournament.season_id);
  if(season){season.name='Khazar League 2026';season.short_name='KL 2026';season.start_date=null;season.end_date=null;season.updated_at=now;}
  db.db.group_standings=(db.db.group_standings||[]).filter(s=>s.tournament_id!==tournament.id);
  const defaults={max_teams:'16',max_players_per_team:'8',match_duration_minutes:'60',match_days:'saturday,sunday',first_kickoff:'13:00',matches_per_day:'4',match_interval_minutes:'90',registration_mode:'free',registration_fee:'0',payment_enabled:'false',default_stadium:'',default_language:'az'};
  for(const [key,value] of Object.entries(defaults)){
    let setting=(db.db.settings||[]).find(x=>x.key===key);
    if(!setting)db.db.settings.push({id:require('crypto').randomUUID(),organization_id:null,key,value,description:key,is_public:0,created_at:now,updated_at:now});
  }
  db.dirty=true;db.save();
  return {seeded:true,teams:source.teams.length,players:playerCount,groups:4,matches:source.groupMatches.length,knockout:source.knockout.length,logosPreserved:source.teams.filter(t=>t.logo).length};
}
module.exports={seedKhazar2026};
