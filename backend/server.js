/**
 * Khazar League Backend API Server - Part 1: Setup & Core
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { getDatabase, generateId } = require('../database/json-db');
const db = getDatabase();

const app = express();
const DOCUMENT_UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'documents');
fs.mkdirSync(DOCUMENT_UPLOAD_DIR, { recursive: true });
const documentUpload = multer({
    storage: multer.diskStorage({
        destination: (_req,_file,cb) => cb(null, DOCUMENT_UPLOAD_DIR),
        filename: (_req,file,cb) => cb(null, `${generateId()}${path.extname(file.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req,file,cb) => {
        const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        cb(allowed.includes(file.mimetype) ? null : new Error('Yalnız PDF və DOCX faylları qəbul edilir'), allowed.includes(file.mimetype));
    }
});
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(v => v.trim()) : '*' }));

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - images are not rate limited
app.use('/uploads/teams', express.static(
    path.join(__dirname, '..', 'uploads', 'teams')
));

app.use('/uploads/media', express.static(
    path.join(__dirname, '..', 'uploads', 'media')
));

// API rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/public/')
});

app.use('/api', limiter);
// In-memory sessions
const sessions = {};

// Seed only verified tournament metadata when the project has no teams.
// Player records, logos, match dates and scores are never fabricated.
const { seedKhazar2026 } = require('../database/seed-khazar-2026');
const seedResult = seedKhazar2026();
if (seedResult.seeded) console.log('Khazar League seed:', seedResult);

// Protect management APIs. Public routes and login remain accessible.
app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/auth/login' || req.path.startsWith('/public/')) return next();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const session = sessions[token];
    if (!session || new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    req.session = session;
    req.currentUser = db.findById('users', session.userId);
    if (!req.currentUser || !req.currentUser.is_active) return res.status(401).json({ error: 'Account inactive' });

    const role = req.currentUser.role;
    if (role === 'team_captain') {
        const ownTeam = req.currentUser.team_id;
        const isOwnTeamRead = req.method === 'GET' && (
            req.path === `/teams/${ownTeam}` || req.path === `/teams/${ownTeam}/players`
        );
        const isOwnTeamUpdate = req.method === 'PUT' && req.path === `/teams/${ownTeam}`;
        const isOwnPlayerCreate = req.method === 'POST' && req.path === '/players' && req.body?.team_id === ownTeam;
        const playerId = req.path.match(/^\/players\/([^/]+)$/)?.[1];
        const player = playerId ? db.findById('players', playerId) : null;
        const isOwnPlayerUpdate = ['PUT','DELETE'].includes(req.method) && player && player.team_id === ownTeam;
        if (!isOwnTeamRead && !isOwnTeamUpdate && !isOwnPlayerCreate && !isOwnPlayerUpdate && req.path !== '/auth/me') {
            return res.status(403).json({ error: 'Bu əməliyyat üçün icazə yoxdur' });
        }
    }
    if (role === 'player') {
        const player = db.findById('players', req.currentUser.player_id);
        const ownTeam = player?.team_id;
        const isOwnProfile = req.method === 'GET' && req.path === `/players/${req.currentUser.player_id}`;
        const isOwnTeamRead = req.method === 'GET' && ownTeam && (
            req.path === `/teams/${ownTeam}` || req.path === `/teams/${ownTeam}/players`
        );
        if (!isOwnProfile && !isOwnTeamRead && req.path !== '/auth/me') return res.status(403).json({ error: 'Bu əməliyyat üçün icazə yoxdur' });
    }
    if (role === 'match_official' && (!['GET','PUT'].includes(req.method) || !(req.path.startsWith('/matches') || req.path.includes('/matches')))) {
        return res.status(403).json({ error: 'Bu əməliyyat üçün icazə yoxdur' });
    }
    if (role === 'media_manager' && !['/announcements','/media-templates','/media-generations'].some(prefix => req.path.startsWith(prefix)) && req.path !== '/auth/me') {
        return res.status(403).json({ error: 'Bu əməliyyat üçün icazə yoxdur' });
    }

    if (role !== 'super_admin' && !['team_captain','player'].includes(role)) {
        const p=req.path;
        let resource=null;
        if (p.includes('/standings')) resource='standings';
        else if (p.includes('/matches')) resource='match';
        else if (p.includes('/teams')) resource='team';
        else if (p.includes('/players')) resource='player';
        else if (p.includes('/awards')) resource='award';
        else if (p.startsWith('/announcements')) resource='announcement';
        else if (p.startsWith('/documents')) resource='document';
        else if (p.startsWith('/media-templates') || p.startsWith('/media-generations')) resource='media';
        else if (p.startsWith('/users')) resource='user';
        else if (p.startsWith('/sponsors')) resource='sponsor';
        else if (p.startsWith('/tournaments') || p.startsWith('/seasons')) resource='tournament';
        if (resource) {
            let permissionKey;
            if (p.startsWith('/media-generations')) permissionKey=req.method==='GET'?'media.read':'media.generate';
            else if (p.startsWith('/media-templates')) permissionKey=req.method==='GET'?'media.read':req.method==='POST'?'media.template.create':req.method==='DELETE'?'media.template.delete':'media.template.update';
            else if (p.endsWith('/publish') && resource==='announcement') permissionKey='announcement.publish';
            else if (p.endsWith('/recalculate') && resource==='standings') permissionKey='standings.recalculate';
            else if (p.includes('/knockout')) permissionKey='tournament.update';
            else if (resource==='document' && req.method==='POST') permissionKey='document.generate';
            else {
                const verb=req.method==='GET'?'read':req.method==='POST'?'create':req.method==='PUT'?'update':req.method==='DELETE'?'delete':'update';
                permissionKey=`${resource}.${verb}`;
            }
            const granted=(db.db.user_permissions||[]).some(x=>x.user_id===req.currentUser.id&&x.permission_key===permissionKey);
            if (!granted) return res.status(403).json({error:`İcazə yoxdur: ${permissionKey}`});
        }
    }
    next();
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'json', organizations: db.db.organizations.length });
});

// Organizations
app.get('/api/organizations', (req, res) => {
    res.json(db.db.organizations);
});

app.get('/api/organizations/:id', (req, res) => {
    const org = db.findOne('organizations', { id: req.params.id });
    if (org) res.json(org);
    else res.status(404).json({ error: 'Organization not found' });
});

// Seasons
app.get('/api/seasons', (req, res) => {
    res.json(db.db.seasons);
});

app.get('/api/seasons/:id', (req, res) => {
    const season = db.findOne('seasons', { id: req.params.id });
    if (season) res.json(season);
    else res.status(404).json({ error: 'Season not found' });
});

// Tournaments
app.get('/api/tournaments', (req, res) => {
    res.json(db.db.tournaments);
});

app.get('/api/tournaments/:id', (req, res) => {
    const tournament = db.findOne('tournaments', { id: req.params.id });
    if (tournament) res.json(tournament);
    else res.status(404).json({ error: 'Tournament not found' });
});

app.post('/api/tournaments', (req, res) => {
    try {
        const { name, short_name, format_type, num_groups, teams_per_group, qualification_per_group, points_win, points_draw, points_loss, tie_break_rules, status, start_date, end_date, venue } = req.body;
        if (!name) return res.status(400).json({ error: 'Tournament name required' });

        const tournamentId = generateId();
        const now = new Date().toISOString();

        const newTournament = {
            id: tournamentId,
            name,
            short_name: short_name || name,
            format_type: format_type || 'group_knockout',
            num_groups: num_groups !== undefined ? num_groups : 4,
            teams_per_group: teams_per_group !== undefined ? teams_per_group : 4,
            qualification_per_group: qualification_per_group !== undefined ? qualification_per_group : 2,
            points_win: points_win !== undefined ? points_win : 3,
            points_draw: points_draw !== undefined ? points_draw : 1,
            points_loss: points_loss !== undefined ? points_loss : 0,
            tie_break_rules: tie_break_rules || JSON.stringify(['points', 'goal_difference', 'goals_scored']),
            status: status || 'draft',
            current_stage: 'group',
            start_date: start_date || new Date().toISOString().split('T')[0],
            end_date: end_date || null,
            created_at: now,
            updated_at: now
        };

        db.table('tournaments').insert(newTournament);
        console.log('Created tournament:', tournamentId);
        res.status(201).json(newTournament);
    } catch (err) {
        console.error('Create tournament error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tournaments/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, short_name, format_type, num_groups, teams_per_group, qualification_per_group, points_win, points_draw, points_loss, tie_break_rules, status, start_date, end_date, venue } = req.body;
        
        const tournament = db.findById('tournaments', id);
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        const updated = {
            ...tournament,
            name: name || tournament.name,
            short_name: short_name || tournament.short_name,
            format_type: format_type || tournament.format_type,
            num_groups: num_groups !== undefined ? num_groups : tournament.num_groups,
            teams_per_group: teams_per_group !== undefined ? teams_per_group : tournament.teams_per_group,
            qualification_per_group: qualification_per_group !== undefined ? qualification_per_group : tournament.qualification_per_group,
            points_win: points_win !== undefined ? points_win : tournament.points_win,
            points_draw: points_draw !== undefined ? points_draw : tournament.points_draw,
            points_loss: points_loss !== undefined ? points_loss : tournament.points_loss,
            tie_break_rules: tie_break_rules || tournament.tie_break_rules,
            status: status || tournament.status,
            start_date: start_date || tournament.start_date,
            end_date: end_date !== undefined ? end_date : tournament.end_date,
            venue: venue !== undefined ? venue : tournament.venue,
            updated_at: new Date().toISOString()
        };

        db.table('tournaments').update(id, updated);
        console.log('Updated tournament:', id);
        res.json(updated);
    } catch (err) {
        console.error('Update tournament error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tournaments/:id', (req, res) => {
    try {
        const { id } = req.params;
        const tournament = db.findById('tournaments', id);
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        // Check if tournament has matches or teams
        const hasMatches = (db.db.matches || []).some(m => m.tournament_id === id);
        const hasTeams = (db.db.teams || []).some(t => t.tournament_id === id);
        if (hasMatches || hasTeams) {
            return res.status(409).json({ error: 'Cannot delete tournament with matches or teams' });
        }

        db.table('tournaments').delete(id);
        console.log('Deleted tournament:', id);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete tournament error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Groups
app.get('/api/tournaments/:tournamentId/groups', (req, res) => {
    const groups = db.findAll('groups', { tournament_id: req.params.tournamentId });
    res.json(groups);
});

/**
 * Khazar League Backend API Server - Part 2: Teams & Players
 */

// Teams
app.get('/api/tournaments/:tournamentId/teams', (req, res) => {
    const allTeams = db.db.teams || [];
    const tournamentTeams = allTeams.filter(t => t.tournament_id === req.params.tournamentId);
    res.json(tournamentTeams);
});

app.post('/api/teams', (req, res) => {
    try {
        const { name, short_name, organization_id, season_id, tournament_id, group_id, coach_name, contact_email, contact_phone, founded_year, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Team name required' });

        const teamId = generateId();
        const now = new Date().toISOString();

        const newTeam = {
            id: teamId,
            name,
            short_name: short_name || name,
            organization_id: organization_id || null,
            season_id: season_id || null,
            tournament_id: tournament_id || null,
            group_id: group_id || null,
            coach_name: coach_name || null,
            contact_email: contact_email || null,
            contact_phone: contact_phone || null,
            founded_year: founded_year || null,
            description: description || null,
            status: 'active',
            registration_status: 'pending',
            registration_date: now,
            captain_id: null,
            logo_path: null,
            created_at: now,
            updated_at: now
        };

        db.table('teams').insert(newTeam);
        console.log('Created team:', teamId);
        res.status(201).json(newTeam);
    } catch (err) {
        console.error('Create team error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teams', (req, res) => {
    res.json(db.db.teams || []);
});

app.get('/api/teams/:id', (req, res) => {
    const team = db.findById('teams', req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (['team_captain','player'].includes(req.currentUser?.role)) {
        const { captain_phone, student_ticket, contact_phone, ...safeTeam } = team;
        return res.json(safeTeam);
    }
    res.json(team);
});

app.put('/api/teams/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, short_name, organization_id, season_id, tournament_id, group_id, coach_name, contact_email, contact_phone, founded_year, description, status, registration_status, logo_path, captain_name, captain_phone, student_ticket, coordinator, submitted_team_name } = req.body;
        
        const team = db.findById('teams', id);
        if (!team) return res.status(404).json({ error: 'Team not found' });
        if (req.currentUser?.role === 'team_captain' && req.currentUser.team_id !== id) {
            return res.status(403).json({ error: 'Yalnız öz komandanızı redaktə edə bilərsiniz' });
        }
        if (req.currentUser?.role === 'team_captain') {
            const safeFields = ['coach_name','contact_email','contact_phone','description','captain_name','captain_phone'];
            for (const key of Object.keys(req.body || {})) {
                if (!safeFields.includes(key)) return res.status(403).json({ error: 'Bu komanda sahəsini dəyişmək icazəniz yoxdur' });
            }
        }

        const updated = {
            ...team,
            name: name || team.name,
            short_name: short_name || team.short_name,
            organization_id: organization_id !== undefined ? organization_id : team.organization_id,
            season_id: season_id !== undefined ? season_id : team.season_id,
            tournament_id: tournament_id !== undefined ? tournament_id : team.tournament_id,
            group_id: group_id !== undefined ? group_id : team.group_id,
            coach_name: coach_name !== undefined ? coach_name : team.coach_name,
            contact_email: contact_email !== undefined ? contact_email : team.contact_email,
            contact_phone: contact_phone !== undefined ? contact_phone : team.contact_phone,
            founded_year: founded_year !== undefined ? founded_year : team.founded_year,
            description: description !== undefined ? description : team.description,
            status: status || team.status,
            registration_status: registration_status || team.registration_status,
            logo_path: logo_path !== undefined ? logo_path : team.logo_path,
            captain_name: captain_name !== undefined ? captain_name : team.captain_name,
            captain_phone: captain_phone !== undefined ? captain_phone : team.captain_phone,
            student_ticket: student_ticket !== undefined ? student_ticket : team.student_ticket,
            coordinator: coordinator !== undefined ? coordinator : team.coordinator,
            submitted_team_name: submitted_team_name !== undefined ? submitted_team_name : team.submitted_team_name,
            updated_at: new Date().toISOString()
        };

        db.table('teams').update(id, updated);
        console.log('Updated team:', id);
        res.json(updated);
    } catch (err) {
        console.error('Update team error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/teams/:id', (req, res) => {
    try {
        const { id } = req.params;
        const team = db.findById('teams', id);
        if (!team) return res.status(404).json({ error: 'Team not found' });

        // Check if team has players or matches
        const hasPlayers = (db.db.players || []).some(p => p.team_id === id);
        const hasMatches = (db.db.matches || []).some(m => m.home_team_id === id || m.away_team_id === id);
        if (hasPlayers || hasMatches) {
            return res.status(409).json({ error: 'Cannot delete team with players or matches' });
        }

        db.table('teams').delete(id);
        console.log('Deleted team:', id);
        res.json({ success: true });
    } catch (err) {
        console.error('Delete team error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Players
app.get('/api/teams/:teamId/players', (req, res) => {
    const allPlayers = db.db.players || [];
    const teamPlayers = allPlayers.filter(p => p.team_id === req.params.teamId);
    if (req.currentUser?.role === 'team_captain') {
        return res.json(teamPlayers.map(p => ({id:p.id,team_id:p.team_id,first_name:p.first_name,last_name:p.last_name,full_name:p.full_name,jersey_number:p.jersey_number,position:p.position,course:p.course})));
    }
    res.json(teamPlayers);
});

app.post('/api/players', (req, res) => {
    try {
        let { first_name, last_name, team_id, jersey_number, position, preferred_foot, date_of_birth, nationality, student_id, photo_path, phone, course } = req.body;
        if (req.currentUser?.role === 'team_captain') team_id = req.currentUser.team_id;
        if (!first_name || !last_name || !team_id) {
            return res.status(400).json({ error: 'First name, last name, and team_id required' });
        }

        const playerId = generateId();
        const now = new Date().toISOString();

        const newPlayer = {
            id: playerId,
            first_name,
            last_name,
            team_id,
            jersey_number: jersey_number || null,
            position: position || 'UNKNOWN',
            preferred_foot: preferred_foot || null,
            date_of_birth: date_of_birth || null,
            nationality: nationality || 'Azerbaijan',
            student_id: student_id || null,
            phone: phone || null,
            course: course || null,
            full_name: `${first_name} ${last_name}`.trim(),
            photo_path: photo_path || null,
            registration_status: 'pending',
            registration_date: now,
            approved_by: null,
            approved_at: null,
            is_captain: 0,
            is_vice_captain: 0,
            status: 'active',
            appearances: 0,
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            minutes_played: 0,
            created_at: now,
            updated_at: now
        };

        db.table('players').insert(newPlayer);
        console.log('Created player:', playerId);
        res.status(201).json(newPlayer);
    } catch (err) {
        console.error('Create player error:', err);
        res.status(500).json({ error: err.message });
    }
});


app.put('/api/players/:id', (req, res) => {
    const player = db.findById('players', req.params.id);
    if (!player) return res.status(404).json({ error: 'Oyunçu tapılmadı' });
    if (req.currentUser?.role === 'team_captain' && player.team_id !== req.currentUser.team_id) return res.status(403).json({ error: 'Yalnız öz komandanızın oyunçularını redaktə edə bilərsiniz' });
    const allowed = req.currentUser?.role === 'team_captain'
        ? ['first_name','last_name','jersey_number','position','course']
        : ['first_name','last_name','team_id','jersey_number','position','preferred_foot','date_of_birth','nationality','student_id','phone','course','registration_status','status','is_captain'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    if (updates.first_name !== undefined || updates.last_name !== undefined) updates.full_name = `${updates.first_name ?? player.first_name} ${updates.last_name ?? player.last_name}`.trim();
    db.table('players').update(req.params.id, updates);
    res.json(db.findById('players', req.params.id));
});

app.delete('/api/players/:id', (req, res) => {
    const existing = db.findById('players', req.params.id);
    if (req.currentUser?.role === 'team_captain' && (!existing || existing.team_id !== req.currentUser.team_id)) return res.status(403).json({ error: 'Yalnız öz komandanızın oyunçularını silə bilərsiniz' });
    const result = db.table('players').delete(req.params.id);
    if (!result.changes) return res.status(404).json({ error: 'Oyunçu tapılmadı' });
    res.json({ success: true });
});

/**
 * Khazar League Backend API Server - Part 3: Matches & Standings (Part A)
 */

// Matches
app.get('/api/tournaments/:tournamentId/matches', (req, res) => {
    const allMatches = db.db.matches || [];
    const tournamentMatches = allMatches.filter(m => m.tournament_id === req.params.tournamentId);
    res.json(tournamentMatches);
});

app.post('/api/matches', (req, res) => {
    try {
        const { tournament_id, season_id, group_id, home_team_id, away_team_id, match_date, kickoff_time, venue, referee_id, round_name, round_number, match_number } = req.body;
        if (!home_team_id || !away_team_id || !match_date) {
            return res.status(400).json({ error: 'home_team_id, away_team_id, and match_date required' });
        }

        const existing = (db.db.matches || []).find(m =>
            m.home_team_id === home_team_id &&
            m.away_team_id === away_team_id &&
            m.tournament_id === tournament_id
        );
        if (existing) return res.status(409).json({ error: 'Duplicate fixture exists' });

        const matchId = generateId();
        const now = new Date().toISOString();

        const newMatch = {
            id: matchId,
            tournament_id: tournament_id || null,
            season_id: season_id || null,
            group_id: group_id || null,
            home_team_id,
            away_team_id,
            home_score: null,
            away_score: null,
            home_penalties: null,
            away_penalties: null,
            venue: venue || '',
            match_date: match_date,
            kickoff_time: kickoff_time || null,
            referee_id: referee_id || null,
            assistant_referee_1_id: null,
            assistant_referee_2_id: null,
            fourth_official_id: null,
            match_status: 'scheduled',
            attendance: null,
            weather: null,
            pitch_condition: null,
            match_report: null,
            started_at: null,
            ended_at: null,
            created_by: null,
            created_at: now,
            updated_at: now
        };

        db.table('matches').insert(newMatch);
        console.log('Created match:', matchId);
        res.status(201).json(newMatch);
    } catch (err) {
        console.error('Create match error:', err);
        res.status(500).json({ error: err.message });
    }
});



app.post('/api/tournaments/:tournamentId/generate-schedule', (req,res) => {
    const tournament=db.findById('tournaments',req.params.tournamentId);
    if(!tournament)return res.status(404).json({error:'Turnir tapılmadı'});
    const {start_date,first_kickoff,matches_per_day,interval_minutes}=req.body;
    if(!start_date||!first_kickoff||!matches_per_day||!interval_minutes)return res.status(400).json({error:'Başlanğıc tarixi, ilk saat, gündəlik oyun sayı və fasilə tələb olunur'});
    const start=new Date(`${start_date}T12:00:00`);
    if(Number.isNaN(start.getTime())||![0,6].includes(start.getDay()))return res.status(400).json({error:'Başlanğıc tarixi şənbə və ya bazar olmalıdır'});
    const pending=(db.db.matches||[]).filter(m=>m.tournament_id===tournament.id&&m.match_status!=='completed')
      .sort((a,b)=>(a.round_number||0)-(b.round_number||0)||String(a.group_name||'').localeCompare(String(b.group_name||'')));
    const maxPerDay=Math.max(1,Math.min(12,Number(matches_per_day)));
    const interval=Math.max(60,Math.min(360,Number(interval_minutes)));
    const [hh,mm]=first_kickoff.split(':').map(Number);
    if(!Number.isInteger(hh)||!Number.isInteger(mm)||hh>23||mm>59)return res.status(400).json({error:'Saat formatı düzgün deyil'});
    let dayOffset=0,slot=0;
    pending.forEach((match,index)=>{
      while(true){
        const d=new Date(start);d.setDate(start.getDate()+dayOffset);
        if(d.getDay()===0||d.getDay()===6)break;
        dayOffset++;
      }
      const d=new Date(start);d.setDate(start.getDate()+dayOffset);
      const minutes=hh*60+mm+slot*interval;
      const date=d.toISOString().slice(0,10);
      const time=`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
      match.match_date=date;match.kickoff_time=time;
      if(tournament.venue)match.venue=tournament.venue;
      match.updated_at=new Date().toISOString();
      slot++;
      if(slot>=maxPerDay){slot=0;dayOffset++;}
    });
    db.table('audit_logs').insert({id:generateId(),user_id:req.currentUser?.id||null,action:'schedule.generated',resource_type:'tournament',resource_id:tournament.id,details:JSON.stringify({updated:pending.length,start_date,first_kickoff,matches_per_day:maxPerDay,interval_minutes:interval}),created_at:new Date().toISOString()});
    db.dirty=true;db.save();
    res.json({updated:pending.length,matches:pending});
});

app.put('/api/matches/:id', (req, res) => {
    const match = db.findById('matches', req.params.id);
    if (!match) return res.status(404).json({ error: 'Oyun tapılmadı' });
    if (match.result_locked && req.currentUser?.role !== 'super_admin') {
        return res.status(403).json({ error: 'Təsdiqlənmiş nəticəni yalnız Super Admin dəyişə bilər' });
    }
    const allowed = ['match_date','kickoff_time','venue','home_score','away_score','match_status','home_penalties','away_penalties','round_name','round_number'];
    const updates = {};
    allowed.forEach(key => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    if (updates.match_status === 'completed') {
        const homeScore=Number(updates.home_score ?? match.home_score), awayScore=Number(updates.away_score ?? match.away_score);
        if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore<0 || awayScore<0) {
            return res.status(400).json({ error: 'Yekun hesab düzgün daxil edilməlidir' });
        }
        if (match.stage && match.stage!=='group' && homeScore===awayScore) {
            const hp=Number(updates.home_penalties ?? match.home_penalties), ap=Number(updates.away_penalties ?? match.away_penalties);
            if (!Number.isInteger(hp)||!Number.isInteger(ap)||hp===ap) return res.status(400).json({error:'Bərabər pley-off hesabında penalti nəticəsi də daxil edilməlidir'});
            updates.winner_team_id=hp>ap?match.home_team_id:match.away_team_id;
            updates.loser_team_id=hp>ap?match.away_team_id:match.home_team_id;
        } else if (match.stage && match.stage!=='group') {
            updates.winner_team_id=homeScore>awayScore?match.home_team_id:match.away_team_id;
            updates.loser_team_id=homeScore>awayScore?match.away_team_id:match.home_team_id;
        }
        updates.result_approved = 1;
        updates.result_locked = 1;
        updates.result_approved_at = new Date().toISOString();
        updates.result_approved_by = req.currentUser?.id || null;
    }
    if (match.result_locked && req.currentUser?.role === 'super_admin') {
        updates.result_change_reason = String(req.body.reason || '').trim();
        if (!updates.result_change_reason) return res.status(400).json({ error: 'Nəticə dəyişikliyi üçün səbəb yazılmalıdır' });
        updates.result_locked = 1;
        updates.result_approved = 1;
        updates.result_approved_at = new Date().toISOString();
        updates.result_approved_by = req.currentUser.id;
    }
    db.table('matches').update(req.params.id, updates);
    db.table('audit_logs').insert({
        id:generateId(), user_id:req.currentUser?.id||null,
        action:match.result_locked?'match.result.corrected':(updates.match_status==='completed'?'match.result.approved':'match.updated'),
        resource_type:'match', resource_id:match.id,
        details:JSON.stringify({reason:updates.result_change_reason||null,home_score:updates.home_score??match.home_score,away_score:updates.away_score??match.away_score}),
        created_at:new Date().toISOString()
    });
    db.dirty = true;
    res.json(db.findById('matches', req.params.id));
});


// Knockout bracket: create each stage only after the previous stage is complete.
app.get('/api/tournaments/:tournamentId/knockout',(req,res)=>{
    res.json((db.db.matches||[]).filter(m=>m.tournament_id===req.params.tournamentId&&m.stage&&m.stage!=='group'));
});
app.post('/api/tournaments/:tournamentId/knockout/generate',(req,res)=>{
    try{
        const tournamentId=req.params.tournamentId;
        const tournament=db.findById('tournaments',tournamentId);
        if(!tournament)return res.status(404).json({error:'Turnir tapılmadı'});
        const knockout=(db.db.matches||[]).filter(m=>m.tournament_id===tournamentId&&m.stage&&m.stage!=='group');
        const now=new Date().toISOString();
        const addMatch=(stage,roundNumber,homeId,awayId,matchNumber)=>{
            const m={id:generateId(),tournament_id:tournamentId,season_id:tournament.season_id||null,group_id:null,group_name:null,
                stage,round_name:stage,round_number:roundNumber,match_number:matchNumber,
                home_team_id:homeId,away_team_id:awayId,home_score:null,away_score:null,home_penalties:null,away_penalties:null,
                venue:null,match_date:null,kickoff_time:null,match_status:'scheduled',result_locked:0,result_approved:0,
                created_at:now,updated_at:now};
            db.db.matches.push(m);return m;
        };
        if(knockout.length===0){
            const groupMatches=(db.db.matches||[]).filter(m=>m.tournament_id===tournamentId&&(!m.stage||m.stage==='group'));
            if(groupMatches.length!==24||groupMatches.some(m=>m.match_status!=='completed'))return res.status(400).json({error:'Pley-off yalnız 24 qrup oyununun hamısı tamamlandıqdan sonra yaradıla bilər'});
            const standings=(db.db.group_standings||[]).filter(s=>s.tournament_id===tournamentId);
            if(standings.length!==16)return res.status(400).json({error:'Əvvəlcə qrup cədvəllərini yenidən hesablayın'});
            const groupIds={};
            (db.db.groups||[]).filter(g=>g.tournament_id===tournamentId).forEach(g=>groupIds[g.name]=g.id);
            const qualified={};
            for(const name of ['A','B','C','D']){
                const rows=standings.filter(s=>s.group_id===groupIds[name]).sort((a,b)=>a.position-b.position);
                if(rows.length!==4||rows[0].position!==1||rows[1].position!==2)return res.status(400).json({error:`${name} qrupu üzrə sıralama tamamlanmayıb`});
                qualified[name]=rows;
            }
            const pairs=[
                [qualified.A[0].team_id,qualified.B[1].team_id],
                [qualified.B[0].team_id,qualified.A[1].team_id],
                [qualified.C[0].team_id,qualified.D[1].team_id],
                [qualified.D[0].team_id,qualified.C[1].team_id]
            ];
            pairs.forEach((pair,i)=>addMatch('quarter_final',4,pair[0],pair[1],i+1));
            db.dirty=true;db.save();
            return res.status(201).json({stage:'quarter_final',matches:(db.db.matches||[]).filter(m=>m.tournament_id===tournamentId&&m.stage==='quarter_final')});
        }
        const qf=knockout.filter(m=>m.stage==='quarter_final');
        const sf=knockout.filter(m=>m.stage==='semi_final');
        const finalExists=knockout.some(m=>m.stage==='final');
        const winner=m=>Number(m.home_score)>Number(m.away_score)?m.home_team_id:Number(m.away_score)>Number(m.home_score)?m.away_team_id:Number(m.home_penalties)>Number(m.away_penalties)?m.home_team_id:m.away_team_id;
        const loser=m=>winner(m)===m.home_team_id?m.away_team_id:m.home_team_id;
        if(qf.length===4&&qf.every(m=>m.match_status==='completed')&&sf.length===0){
            addMatch('semi_final',5,winner(qf[0]),winner(qf[1]),1);
            addMatch('semi_final',5,winner(qf[2]),winner(qf[3]),2);
            db.dirty=true;db.save();
            return res.status(201).json({stage:'semi_final',matches:(db.db.matches||[]).filter(m=>m.tournament_id===tournamentId&&m.stage==='semi_final')});
        }
        if(sf.length===2&&sf.every(m=>m.match_status==='completed')&&!finalExists){
            addMatch('final',6,winner(sf[0]),winner(sf[1]),1);
            addMatch('third_place',6,loser(sf[0]),loser(sf[1]),2);
            db.dirty=true;db.save();
            return res.status(201).json({stage:'final_and_third_place',matches:(db.db.matches||[]).filter(m=>m.tournament_id===tournamentId&&['final','third_place'].includes(m.stage))});
        }
        return res.status(400).json({error:'Növbəti pley-off mərhələsi üçün əvvəlki mərhələnin bütün oyunları tamamlanmalıdır'});
    }catch(err){res.status(500).json({error:err.message});}
});

// Match Events
app.post('/api/matches/:matchId/events', (req, res) => {
    try {
        const { match_id } = req.params;
        const { event_type, team_id, player_id, assist_player_id, minute, period, description } = req.body;
        if (!event_type || !team_id || !minute) {
            return res.status(400).json({ error: 'event_type, team_id, and minute required' });
        }

        const newEvent = {
            id: generateId(),
            match_id,
            team_id,
            player_id: player_id || null,
            assist_player_id: assist_player_id || null,
            event_type,
            minute,
            added_time: 0,
            period: period || 'first_half',
            description: description || '',
            is_confirmed: 1,
            confirmed_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.table('match_events').insert(newEvent);
        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Create match event error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Khazar League Backend API Server - Part 3B: Standings
 */

// Standings
app.get('/api/tournaments/:tournamentId/standings', (req, res) => {
    const allStandings = db.db.group_standings || [];
    const tournamentStandings = allStandings.filter(s => s.tournament_id === req.params.tournamentId);
    tournamentStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        return b.goals_for - a.goals_for;
    });
    res.json(tournamentStandings);
});

app.post('/api/tournaments/:tournamentId/standings/recalculate', (req, res) => {
    try {
        const tournamentId = req.params.tournamentId;
        const matches = (db.db.matches || []).filter(m => m.tournament_id === tournamentId &&
            m.match_status === 'completed' && m.home_score !== null && m.away_score !== null &&
            Number.isInteger(Number(m.home_score)) && Number.isInteger(Number(m.away_score)));
        const teams = (db.db.teams || []).filter(t => t.tournament_id === tournamentId);
        const groups = (db.db.groups || []).filter(g => g.tournament_id === tournamentId);
        const tournament = db.findById('tournaments', tournamentId);
        if (!tournament) return res.status(404).json({ error: 'Turnir tapılmadı' });
        const result = [];
        for (const group of groups) {
            const entries = teams.filter(t => t.group_id === group.id).map(team => {
                const row = { id: generateId(), tournament_id:tournamentId, group_id:group.id, team_id:team.id,
                    position:0, played:0, won:0, drawn:0, lost:0, goals_for:0, goals_against:0,
                    goal_difference:0, points:0, form:'', qualified:0, updated_at:new Date().toISOString() };
                const playedMatches = matches.filter(m => m.group_id === group.id && (m.home_team_id === team.id || m.away_team_id === team.id));
                for (const m of playedMatches) {
                    row.played++;
                    const home = Number(m.home_score), away = Number(m.away_score);
                    const isHome = m.home_team_id === team.id;
                    const gf = isHome ? home : away, ga = isHome ? away : home;
                    row.goals_for += gf; row.goals_against += ga;
                    if (gf > ga) row.won++;
                    else if (gf === ga) row.drawn++;
                    else row.lost++;
                }
                row.goal_difference = row.goals_for - row.goals_against;
                row.points = row.won * Number(tournament.points_win ?? 3) + row.drawn * Number(tournament.points_draw ?? 1);
                return row;
            });
            // Confirmed order: points, goal difference, goals scored, then head-to-head.
            entries.sort((a,b) => {
                if (b.points !== a.points) return b.points-a.points;
                if (b.goal_difference !== a.goal_difference) return b.goal_difference-a.goal_difference;
                if (b.goals_for !== a.goals_for) return b.goals_for-a.goals_for;
                const direct = matches.filter(m => m.group_id === group.id &&
                    ((m.home_team_id === a.team_id && m.away_team_id === b.team_id) ||
                     (m.home_team_id === b.team_id && m.away_team_id === a.team_id)));
                let ap=0,bp=0;
                direct.forEach(m => {
                    const hs=Number(m.home_score), as=Number(m.away_score);
                    if (hs===as) { ap++; bp++; }
                    else if ((m.home_team_id===a.team_id && hs>as)||(m.away_team_id===a.team_id && as>hs)) ap+=3;
                    else bp+=3;
                });
                if (bp!==ap) return bp-ap;
                return String(teams.find(t=>t.id===a.team_id)?.name||'').localeCompare(String(teams.find(t=>t.id===b.team_id)?.name||''),'az');
            });
            entries.forEach((row,index)=>{row.position=index+1;row.qualified=index<Number(tournament.qualification_per_group||2)?1:0;});
            result.push(...entries);
        }
        db.db.group_standings = (db.db.group_standings||[]).filter(s=>s.tournament_id!==tournamentId).concat(result);
        db.dirty=true; db.save();
        res.json(result);
    } catch (err) {
        console.error('Recalculate standings error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Khazar League Backend API Server - Part 4A: Awards & Announcements
 */

// Awards
app.get('/api/tournaments/:tournamentId/awards', (req, res) => {
    const allAwards = db.db.awards || [];
    res.json(allAwards.filter(a => a.tournament_id === req.params.tournamentId));
});

app.post('/api/tournaments/:tournamentId/awards/auto',(req,res)=>{
    const tid=req.params.tournamentId;
    const final=(db.db.matches||[]).find(m=>m.tournament_id===tid&&m.stage==='final');
    const third=(db.db.matches||[]).find(m=>m.tournament_id===tid&&m.stage==='third_place');
    if(!final||!third||final.match_status!=='completed'||third.match_status!=='completed')
        return res.status(400).json({error:'Komanda mükafatları üçün final və üçüncü yer oyunu tamamlanmalıdır'});
    const winners=[
        ['champion',final.winner_team_id,'Çempion'],
        ['runner_up',final.loser_team_id,'İkinci yer'],
        ['third_place',third.winner_team_id,'Üçüncü yer']
    ];
    const created=[];
    for(const [type,teamId,label] of winners){
        if(!teamId)return res.status(400).json({error:`${label} qalibi müəyyən edilməyib`});
        let award=(db.db.awards||[]).find(a=>a.tournament_id===tid&&a.award_type===type);
        if(!award){award={id:generateId(),tournament_id:tid,season_id:null,award_type:type,recipient_type:'team',recipient_id:teamId,description:label,awarded_by:req.currentUser?.id||null,awarded_at:new Date().toISOString(),is_official:1};db.table('awards').insert(award);}
        created.push(award);
    }
    db.save();res.json(created);
});

app.post('/api/awards', (req, res) => {
    try {
        const { tournament_id, award_type, recipient_type, recipient_id, description } = req.body;
        if (!tournament_id || !award_type || !recipient_type || !recipient_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newAward = {
            id: generateId(),
            tournament_id,
            season_id: null,
            award_type,
            recipient_type,
            recipient_id,
            description: description || '',
            awarded_by: null,
            awarded_at: new Date().toISOString(),
            is_official: 1
        };

        db.table('awards').insert(newAward);
        console.log('Created award:', newAward.id);
        res.status(201).json(newAward);
    } catch (err) {
        console.error('Create award error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Announcements
app.get('/api/organizations/:orgId/announcements', (req, res) => {
    const allAnnouncements = db.db.announcements || [];
    res.json(allAnnouncements.filter(a => a.organization_id === req.params.orgId));
});

app.post('/api/announcements', (req, res) => {
    try {
        const { organization_id, tournament_id, title, content, summary, type, priority, target_audience } = req.body;
        const organizationId=organization_id||req.currentUser?.organization_id;
        if (!organizationId || !title || !content) {
            return res.status(400).json({ error: 'Elan başlığı və mətni tələb olunur' });
        }

        const newAnnouncement = {
            id: generateId(),
            organization_id:organizationId,
            tournament_id: tournament_id || null,
            title,
            content,
            summary: summary || title,
            type: type || 'general',
            priority: priority || 'normal',
            target_audience: target_audience || 'all',
            is_published: 0,
            published_at: null,
            published_by: null,
            expires_at: null,
            attachment_path: null,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.table('announcements').insert(newAnnouncement);
        console.log('Created announcement:', newAnnouncement.id);
        res.status(201).json(newAnnouncement);
    } catch (err) {
        console.error('Create announcement error:', err);
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/announcements/:id/publish',(req,res)=>{
    const item=db.findById('announcements',req.params.id);
    if(!item)return res.status(404).json({error:'Elan tapılmadı'});
    db.table('announcements').update(item.id,{is_published:1,published_at:new Date().toISOString(),published_by:req.currentUser?.id||null});
    res.json(db.findById('announcements',item.id));
});

// Secure document upload (PDF/DOCX only, 10 MB maximum).
app.get('/api/documents/:id/download',(req,res)=>{
    const doc=db.findById('documents',req.params.id);
    if(!doc)return res.status(404).json({error:'Sənəd tapılmadı'});
    const absolute=path.resolve(__dirname,'..',String(doc.file_path||'').replace(/^\/uploads\//,'uploads/'));
    const allowedRoot=path.resolve(__dirname,'..','uploads','documents');
    if(!absolute.startsWith(allowedRoot+path.sep)||!fs.existsSync(absolute))return res.status(404).json({error:'Fayl tapılmadı'});
    res.download(absolute,path.basename(absolute));
});

app.post('/api/documents/upload', documentUpload.single('file'), (req,res) => {
    try {
        if (!req.file) return res.status(400).json({error:'Fayl seçilməyib'});
        const {title,document_type,tournament_id}=req.body;
        if(!title||!document_type){fs.unlinkSync(req.file.path);return res.status(400).json({error:'Sənəd adı və növü tələb olunur'});}
        const doc={id:generateId(),organization_id:(db.db.organizations[0]||{}).id||null,tournament_id:tournament_id||null,
            team_id:null,player_id:null,document_type,title,file_path:`/uploads/documents/${req.file.filename}`,
            file_format:path.extname(req.file.originalname).slice(1).toLowerCase(),generated_by:req.currentUser?.id||null,
            generated_at:new Date().toISOString(),download_count:0,is_public:0};
        db.table('documents').insert(doc);db.save();res.status(201).json(doc);
    } catch(err) { if(req.file?.path&&fs.existsSync(req.file.path))fs.unlinkSync(req.file.path);res.status(500).json({error:err.message}); }
});

// Documents
app.get('/api/documents', (req, res) => {
    const allDocuments = db.db.documents || [];
    const orgId = req.query.organization_id;
    if (orgId) {
        res.json(allDocuments.filter(d => d.organization_id === orgId));
    } else {
        res.json(allDocuments);
    }
});

app.post('/api/documents', (req, res) => {
    try {
        const { organization_id, tournament_id, team_id, player_id, document_type, title, file_path, file_format, generated_by } = req.body;
        if (!organization_id || !document_type || !title || !file_path) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newDoc = {
            id: generateId(),
            organization_id,
            tournament_id: tournament_id || null,
            team_id: team_id || null,
            player_id: player_id || null,
            document_type,
            title,
            file_path,
            file_format: file_format || 'pdf',
            generated_by: generated_by || null,
            generated_at: new Date().toISOString(),
            download_count: 0,
            is_public: 0
        };

        db.table('documents').insert(newDoc);
        console.log('Created document:', newDoc.id);
        res.status(201).json(newDoc);
    } catch (err) {
        console.error('Create document error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Khazar League Backend API Server - Part 4B: Media, Auth, Public
 */

// Media Templates
app.get('/api/organizations/:orgId/media-templates', (req, res) => {
    const allTemplates = db.db.media_templates || [];
    res.json(allTemplates.filter(t => t.organization_id === req.params.orgId));
});

app.post('/api/media-templates', (req, res) => {
    try {
        const { organization_id, name, category, width, height, template_data } = req.body;
        const organizationId=organization_id||req.currentUser?.organization_id;
        if (!organizationId || !name || !category) {
            return res.status(400).json({ error: 'Şablon adı və kateqoriyası tələb olunur' });
        }

        const newTemplate = {
            id: generateId(),
            organization_id:organizationId,
            name,
            category,
            width: width || 1080,
            height: height || 1080,
            template_data: template_data || '{}',
            thumbnail_path: null,
            is_default: 0,
            created_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        db.table('media_templates').insert(newTemplate);
        console.log('Created media template:', newTemplate.id);
        res.status(201).json(newTemplate);
    } catch (err) {
        console.error('Create media template error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Media Generations
app.get('/api/media-generations', (req, res) => {
    const allGenerations = db.db.media_generations || [];
    const tournamentId = req.query.tournament_id;
    if (tournamentId) {
        res.json(allGenerations.filter(g => g.tournament_id === tournamentId));
    } else {
        res.json(allGenerations);
    }
});

app.post('/api/media-generations/export', (req,res) => {
    try {
        const { image_data, title, tournament_id, format } = req.body;
        const match=String(image_data||'').match(/^data:image\/(png|jpeg);base64,(.+)$/);
        if(!match)return res.status(400).json({error:'PNG və ya JPG şəkil məlumatı tələb olunur'});
        const buffer=Buffer.from(match[2],'base64');
        if(buffer.length>8*1024*1024)return res.status(413).json({error:'Şəkil maksimum 8 MB ola bilər'});
        const id=generateId(),ext=match[1]==='jpeg'?'jpg':'png';
        const dir=path.join(__dirname,'..','uploads','media');fs.mkdirSync(dir,{recursive:true});
        const filename=`${id}.${ext}`;fs.writeFileSync(path.join(dir,filename),buffer);
        const item={id,template_id:null,tournament_id:tournament_id||null,match_id:null,team_id:null,player_id:null,
            output_path:`/uploads/media/${filename}`,custom_data:JSON.stringify({title:title||'Khazar League dizaynı',format:format||'post'}),
            generated_by:req.currentUser?.id||null,generated_at:new Date().toISOString()};
        db.table('media_generations').insert(item);db.save();res.status(201).json(item);
    } catch(err){res.status(500).json({error:err.message});}
});

app.post('/api/media-generations', (req, res) => {
    try {
        const { template_id, tournament_id, match_id, team_id, player_id, output_path, custom_data } = req.body;
        if (!template_id || !output_path) {
            return res.status(400).json({ error: 'template_id and output_path required' });
        }

        const newGeneration = {
            id: generateId(),
            template_id,
            tournament_id: tournament_id || null,
            match_id: match_id || null,
            team_id: team_id || null,
            player_id: player_id || null,
            output_path,
            custom_data: custom_data || '{}',
            generated_by: null,
            generated_at: new Date().toISOString()
        };

        db.table('media_generations').insert(newGeneration);
        console.log('Created media generation:', newGeneration.id);
        res.status(201).json(newGeneration);
    } catch (err) {
        console.error('Create media generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Players
app.get('/api/players', (req, res) => {
    res.json(db.db.players || []);
});

app.get('/api/players/:id', (req, res) => {
    const player = db.findById('players', req.params.id);
    if (player) res.json(player);
    else res.status(404).json({ error: 'Player not found' });
});

// Match Events
app.get('/api/matches/:matchId/events', (req, res) => {
    const events = (db.db.match_events || []).filter(e => e.match_id === req.params.matchId);
    res.json(events);
});

app.get('/api/match-events/:id', (req, res) => {
    const event = db.findById('match_events', req.params.id);
    if (event) res.json(event);
    else res.status(404).json({ error: 'Match event not found' });
});

// Matches - Full CRUD
app.get('/api/matches', (req, res) => {
    res.json(db.db.matches || []);
});

app.get('/api/matches/:id', (req, res) => {
    const match = db.findById('matches', req.params.id);
    if (match) res.json(match);
    else res.status(404).json({ error: 'Match not found' });
});

// Standings
app.get('/api/standings', (req, res) => {
    res.json(db.db.group_standings || []);
});

app.get('/api/standings/:id', (req, res) => {
    const standing = db.findById('group_standings', req.params.id);
    if (standing) res.json(standing);
    else res.status(404).json({ error: 'Standing not found' });
});

// Groups
app.get('/api/groups', (req, res) => {
    res.json(db.db.groups || []);
});

app.get('/api/groups/:id', (req, res) => {
    const group = db.findById('groups', req.params.id);
    if (group) res.json(group);
    else res.status(404).json({ error: 'Group not found' });
});

// Awards
app.get('/api/awards', (req, res) => {
    res.json(db.db.awards || []);
});

app.get('/api/awards/:id', (req, res) => {
    const award = db.findById('awards', req.params.id);
    if (award) res.json(award);
    else res.status(404).json({ error: 'Award not found' });
});

// Announcements
app.get('/api/announcements', (req, res) => {
    res.json(db.db.announcements || []);
});

app.get('/api/announcements/:id', (req, res) => {
    const announcement = db.findById('announcements', req.params.id);
    if (announcement) res.json(announcement);
    else res.status(404).json({ error: 'Announcement not found' });
});

// Documents
app.get('/api/documents/:id', (req, res) => {
    const document = db.findById('documents', req.params.id);
    if (document) res.json(document);
    else res.status(404).json({ error: 'Document not found' });
});

// Media Templates
app.get('/api/media-templates', (req, res) => {
    res.json(db.db.media_templates || []);
});

app.get('/api/media-templates/:id', (req, res) => {
    const template = db.findById('media_templates', req.params.id);
    if (template) res.json(template);
    else res.status(404).json({ error: 'Template not found' });
});


// Season creation
app.post('/api/seasons', (req,res) => {
    const { name, short_name, description, organization_id } = req.body;
    if (!name) return res.status(400).json({error:'Mövsüm adı tələb olunur'});
    const now=new Date().toISOString();
    const season={id:generateId(),organization_id:organization_id||(db.db.organizations[0]||{}).id||null,name,short_name:short_name||name,
        start_date:null,end_date:null,registration_start:null,registration_end:null,is_current:0,is_archived:0,description:description||null,created_at:now,updated_at:now};
    db.table('seasons').insert(season); res.status(201).json(season);
});
app.put('/api/seasons/:id',(req,res)=>{
    const season=db.findById('seasons',req.params.id);if(!season)return res.status(404).json({error:'Mövsüm tapılmadı'});
    const allowed=['name','short_name','description','start_date','end_date','is_current','is_archived'];
    const updates={};allowed.forEach(k=>{if(req.body[k]!==undefined)updates[k]=req.body[k];});
    db.table('seasons').update(req.params.id,updates);res.json(db.findById('seasons',req.params.id));
});

// Tournament and platform settings
app.get('/api/settings',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    res.json(db.db.settings||[]);
});
app.put('/api/settings',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    const values=req.body.values||{};
    const allowed=['max_teams','max_players_per_team','match_duration_minutes','match_days','first_kickoff','matches_per_day','match_interval_minutes','registration_mode','registration_fee','payment_enabled','default_stadium','default_language'];
    const org=(db.db.organizations||[])[0];
    for(const key of allowed){
        if(values[key]===undefined)continue;
        let row=(db.db.settings||[]).find(x=>x.key===key);
        if(!row){row={id:generateId(),organization_id:org?.id||null,key,value:String(values[key]),description:key,is_public:0,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};db.db.settings.push(row);}
        else {row.value=String(values[key]);row.updated_at=new Date().toISOString();}
    }
    db.dirty=true;db.save();res.json(db.db.settings.filter(x=>allowed.includes(x.key)));
});

// Sponsor management
app.get('/api/sponsors',(req,res)=>res.json(db.db.sponsors||[]));
app.post('/api/sponsors',(req,res)=>{
    const {name,logo_path,website}=req.body;
    if(!name)return res.status(400).json({error:'Sponsor adı tələb olunur'});
    const item={id:generateId(),name,logo_path:logo_path||null,website:website||null,is_active:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    db.table('sponsors').insert(item);res.status(201).json(item);
});
app.put('/api/sponsors/:id',(req,res)=>{
    const item=db.findById('sponsors',req.params.id);if(!item)return res.status(404).json({error:'Sponsor tapılmadı'});
    db.table('sponsors').update(item.id,{name:req.body.name??item.name,logo_path:req.body.logo_path??item.logo_path,website:req.body.website??item.website,is_active:req.body.is_active??item.is_active});
    res.json(db.findById('sponsors',item.id));
});
app.delete('/api/sponsors/:id',(req,res)=>{
    const r=db.table('sponsors').delete(req.params.id);if(!r.changes)return res.status(404).json({error:'Sponsor tapılmadı'});res.json({success:true});
});

// Individual permission management.
const PERMISSION_CATALOG = [
 'tournament.read','tournament.create','tournament.update','tournament.delete','tournament.archive',
 'team.read','team.create','team.update','team.delete','team.approve',
 'player.read','player.create','player.update','player.delete','player.approve',
 'match.read','match.create','match.update','match.delete','match.report',
 'standings.read','standings.recalculate','award.read','award.create','award.update','award.assign',
 'announcement.read','announcement.create','announcement.update','announcement.delete','announcement.publish',
 'document.read','document.generate','document.download',
 'media.read','media.generate','media.template.create','media.template.update','media.template.delete',
 'user.read','user.create','user.update','user.delete','user.manage_roles',
 'sponsor.read','sponsor.create','sponsor.update','sponsor.delete',
 'settings.read','settings.update','analytics.read','analytics.export'
];
app.get('/api/permissions/catalog',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    res.json(PERMISSION_CATALOG);
});
app.get('/api/users/:id/permissions',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    res.json((db.db.user_permissions||[]).filter(x=>x.user_id===req.params.id).map(x=>x.permission_key));
});
app.put('/api/users/:id/permissions',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    const user=db.findById('users',req.params.id);
    if(!user)return res.status(404).json({error:'İstifadəçi tapılmadı'});
    if(user.role==='super_admin')return res.status(400).json({error:'Super Admin icazələri dəyişdirilmir'});
    const selected=Array.isArray(req.body.permissions)?req.body.permissions:[];
    const invalid=selected.filter(x=>!PERMISSION_CATALOG.includes(x));
    if(invalid.length)return res.status(400).json({error:'Naməlum icazə mövcuddur'});
    db.db.user_permissions=(db.db.user_permissions||[]).filter(x=>x.user_id!==user.id);
    selected.forEach(key=>db.db.user_permissions.push({id:generateId(),user_id:user.id,permission_key:key,resource_type:null,resource_id:null,granted_by:req.currentUser.id,granted_at:new Date().toISOString(),expires_at:null}));
    db.dirty=true;db.save();res.json({user_id:user.id,permissions:selected});
});

// User administration (password hashes are never returned).
app.get('/api/users',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    res.json((db.db.users||[]).map(({password_hash,...u})=>u));
});
app.post('/api/users',(req,res)=>{
    if(req.currentUser?.role!=='super_admin')return res.status(403).json({error:'Yalnız Super Admin'});
    const {email,password,full_name,role,team_id,player_id}=req.body;
    if(!email||!password||!full_name||!['super_admin','tournament_admin','team_captain','player','match_official','media_manager'].includes(role))
        return res.status(400).json({error:'Ad, e-poçt, şifrə və düzgün rol daxil edin'});
    if((db.db.users||[]).some(u=>u.email.toLowerCase()===String(email).toLowerCase()))return res.status(409).json({error:'Bu e-poçt artıq istifadə olunur'});
    if((role==='team_captain'&&!team_id)||(role==='player'&&!player_id))return res.status(400).json({error:'Kapitan üçün komanda, oyunçu üçün oyunçu ID-si tələb olunur'});
    const {hashPasswordSync}=require('../database/password-utils');
    const user={id:generateId(),organization_id:req.currentUser.organization_id,email:String(email).trim().toLowerCase(),password_hash:hashPasswordSync(password),
        full_name,role,team_id:team_id||null,player_id:player_id||null,is_active:1,is_verified:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
    db.table('users').insert(user);const {password_hash,...safe}=user;res.status(201).json(safe);
});

// Authentication
app.get('/api/auth/me', (req, res) => {
    const { password_hash, ...user } = req.currentUser || {};
    res.json(user);
});

app.post('/api/auth/logout', (req, res) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    delete sessions[token];
    res.json({ success: true });
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const allUsers = db.db.users || [];
        const user = allUsers.find(u => u.email === email);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const { verifyPasswordSync } = require('../database/password-utils');
        const isValid = verifyPasswordSync(password, user.password_hash);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const sessionId = generateId();
        sessions[sessionId] = {
            userId: user.id,
            organizationId: user.organization_id,
            role: user.role,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        const { password_hash, ...userInfo } = user;
        res.json({
            sessionId,
            user: userInfo,
            message: 'Login successful'
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Khazar League Backend API Server - Part 4C: Public Routes & Server Start
 */

// Public Routes
app.get('/api/public/overview', (req, res) => {
    const tournament = (db.db.tournaments || []).find(t => t.status !== 'archived') || (db.db.tournaments || [])[0] || null;
    if (!tournament) return res.json({ tournament: null, teams: [], groups: [], matches: [], announcements: [] });
    const teams = (db.db.teams || []).filter(t => t.tournament_id === tournament.id).map(t => ({
        id:t.id, name:t.name, short_name:t.short_name, group_id:t.group_id, logo_path:t.logo_path
    }));
    const groups = (db.db.groups || []).filter(g => g.tournament_id === tournament.id);
    const matches = (db.db.matches || []).filter(m => m.tournament_id === tournament.id);
    const announcements = (db.db.announcements || []).filter(a => a.is_published === 1);
    const players = (db.db.players || []).map(p => ({
        id:p.id, first_name:p.first_name, last_name:p.last_name, full_name:p.full_name,
        team_id:p.team_id, jersey_number:p.jersey_number, position:p.position
    }));
    const awards=(db.db.awards||[]).filter(a=>a.tournament_id===tournament.id);
    const sponsors=(db.db.sponsors||[]).filter(s=>s.is_active!==0).map(({contact_email,contact_phone,...s})=>s);
    res.json({ tournament, teams, groups, matches, announcements, players, awards, sponsors });
});

app.get('/api/public/tournament/:tournamentId', (req, res) => {
    const tournament = db.findOne('tournaments', { id: req.params.tournamentId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const allGroups = db.findAll('groups', { tournament_id: req.params.tournamentId });
    const allTeams = (db.db.teams || []).filter(t => t.tournament_id === req.params.tournamentId);
    const allStandings = db.findAll('group_standings', { tournament_id: req.params.tournamentId });

    const groupSummaries = allGroups.map(group => {
        const groupTeams = allTeams.filter(t => t.group_id === group.id);
        const groupStandings = allStandings.filter(s => s.group_id === group.id && s.team_id);

        const teamDetails = groupTeams.map(team => {
            const standing = groupStandings.find(s => s.team_id === team.id);
            return {
                id: team.id,
                name: team.name,
                short_name: team.short_name,
                logo_path: team.logo_path,
                position: standing ? standing.position : null,
                played: standing ? standing.played : 0,
                won: standing ? standing.won : 0,
                drawn: standing ? standing.drawn : 0,
                lost: standing ? standing.lost : 0,
                goals_for: standing ? standing.goals_for : 0,
                goals_against: standing ? standing.goals_against : 0,
                goal_difference: standing ? standing.goal_difference : 0,
                points: standing ? standing.points : 0,
                qualified: standing ? standing.qualified : 0
            };
        });

        return { group_name: group.name, teams: teamDetails };
    });

    res.json({ tournament, groups: groupSummaries });
});

app.get('/api/public/team/:teamId', (req, res) => {
    const team = db.findOne('teams', { id: req.params.teamId });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const teamPlayers = (db.db.players || []).filter(p => p.team_id === team.id && p.registration_status === 'approved');
    const teamStandings = (db.db.group_standings || []).find(s => s.team_id === team.id);

    const publicTeam = { id:team.id, name:team.name, short_name:team.short_name, logo_path:team.logo_path, group_id:team.group_id, registration_status:team.registration_status };
    res.json({ team:publicTeam, players: teamPlayers.length, standings: teamStandings || null });
});

app.get('/api/public/player/:playerId', (req, res) => {
    const player = db.findOne('players', { id: req.params.playerId });
    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json({
        id: player.id,
        first_name: player.first_name,
        last_name: player.last_name,
        jersey_number: player.jersey_number,
        position: player.position,
        team_id: player.team_id
    });
});

// Start server only after durable database state is loaded.
async function startServer() {
    try {
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const state = await db.loadRemote();
            console.log('Supabase database initialized:', state);
        } else {
            console.warn('Supabase is not configured; using local JSON storage.');
        }
        app.listen(PORT, () => {
            console.log(`Khazar League API Server running on port ${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}
startServer();

module.exports = app;
