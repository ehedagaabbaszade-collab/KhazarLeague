/**
 * Khazar League Database Abstraction Layer - Core Classes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'khazar_league.json');

function generateId() {
    return crypto.randomUUID();
}

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadDatabase() {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load database, creating new:', e);
            return createEmptyDatabase();
        }
    }
    return createEmptyDatabase();
}

function createEmptyDatabase() {
    return {
        organizations: [], seasons: [], tournaments: [], groups: [],
        teams: [], users: [], user_permissions: [], players: [],
        matches: [], match_events: [], match_lineups: [],
        group_standings: [], player_tournament_stats: [], awards: [],
        announcements: [], notifications: [], push_subscriptions: [], documents: [],
        media_templates: [], media_generations: [], sponsors: [], audit_logs: [],
        settings: [], backup_records: []
    };
}

function saveDatabase(db) {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

class JsonDatabase {
    constructor() {
        this.db = loadDatabase();
        this.dirty = false;
        setInterval(() => { if (this.dirty) this.save(); }, 5000);
    }
    
    save() {
        saveDatabase(this.db);
        this.dirty = false;
        if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            this.remoteSave = (this.remoteSave || Promise.resolve()).then(() => this.persistRemote()).catch(err => console.error('Supabase persistence error:', err.message));
        }
    }
    table(name) { if (!this.db[name]) this.db[name] = []; return new TableProxy(this, name); }
    exec(sql) { console.warn('SQL not supported:', sql.substring(0,100)); return { changes: 0 }; }
    pragma() {}
    close() { this.save(); }

    // Optional durable remote JSON store backed by a single Supabase Postgres row.
    // The in-memory API remains synchronous for compatibility with existing routes.
    async loadRemote() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return { enabled: false };
        const endpoint = `${url.replace(/\/$/, '')}/rest/v1/league_state?id=eq.1&select=payload`;
        const response = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
        if (!response.ok) throw new Error(`Supabase load failed (${response.status}): ${await response.text()}`);
        const rows = await response.json();
        if (rows.length && rows[0].payload) {
            this.db = rows[0].payload;
            this.dirty = false;
            return { enabled: true, loaded: true };
        }
        await this.persistRemote();
        return { enabled: true, loaded: false, seeded: true };
    }

    async persistRemote() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return;
        const endpoint = `${url.replace(/\/$/, '')}/rest/v1/league_state`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify({ id: 1, payload: this.db, updated_at: new Date().toISOString() })
        });
        if (!response.ok) throw new Error(`Supabase save failed (${response.status}): ${await response.text()}`);
    }

    prepare(sql) { return new PreparedStatement(this, sql); }
    
    // Convenience methods
    findOne(tableName, conditions) {
        const rows = this.db[tableName] || [];
        return rows.find(r => Object.entries(conditions).every(([k, v]) => r[k] === v));
    }
    
    findAll(tableName, conditions) {
        const rows = this.db[tableName] || [];
        return rows.filter(r => Object.entries(conditions).every(([k, v]) => r[k] === v));
    }
    
    findById(tableName, id) {
        const rows = this.db[tableName] || [];
        return rows.find(r => r.id === id);
    }
}

class TableProxy {
    constructor(db, tableName) { this.db = db; this.tableName = tableName; }
    get all() { return this.db.db[this.tableName] || []; }
    find(id) { return (this.db.db[this.tableName] || []).find(r => r.id === id); }
    findOne(cond) { return (this.db.db[this.tableName] || []).find(r => Object.entries(cond).every(([k,v])=>r[k]===v)); }
    findAll(cond) { return (this.db.db[this.tableName] || []).filter(r => Object.entries(cond).every(([k,v])=>r[k]===v)); }
    insert(row) { const nr={...row,id:row.id||generateId()}; this.db.db[this.tableName].push(nr); this.db.dirty=true; return {lastInsertRowid:nr.id,changes:1}; }
    update(id,updates) { const rows=this.db.db[this.tableName]||[]; const i=rows.findIndex(r=>r.id===id); if(i>=0){rows[i]={...rows[i],...updates,updated_at:new Date().toISOString()};this.db.dirty=true;return{changes:1}}return{changes:0};}
    delete(id) { const rows=this.db.db[this.tableName]||[]; const i=rows.findIndex(r=>r.id===id); if(i>=0){rows.splice(i,1);this.db.dirty=true;return{changes:1}}return{changes:0};}
}

class PreparedStatement {
    constructor(db, sql) { this.db = db; this.sql = sql; }
    run(...params) {
        const sql=this.sql.trim().toLowerCase();
        if(sql.startsWith('insert')) return this.handleInsert(params);
        if(sql.startsWith('update')) return this.handleUpdate(params);
        if(sql.startsWith('delete')) return this.handleDelete(params);
        if(sql.startsWith('select')) return this.handleSelect(params);
        return {changes:0,lastInsertRowid:null};
    }
    get(...p){const r=this.run(...p);return Array.isArray(r)?r[0]:r;}
    all(...p){const r=this.run(...p);return Array.isArray(r)?r:[];}
    handleInsert(params){
        const m=this.sql.match(/insert into (\w+) \((.+)\) values \((.+)\)/i); if(!m)return{changes:0};
        const t=m[1],c=m[2].split(',').map(s=>s.trim()),ph=m[3].split(',').map(s=>s.trim());
        const row={id:generateId()};c.forEach((col,i)=>row[col]=params[i]);
        this.db.db[t]=this.db.db[t]||[];this.db.db[t].push(row);this.db.dirty=true;
        return{changes:1,lastInsertRowid:row.id};
    }
    handleUpdate(){return{changes:0};}
    handleDelete(){return{changes:0};}
    handleSelect(){return[];}
}

let dbInstance=null;
function getDatabase(){if(!dbInstance)dbInstance=new JsonDatabase();return dbInstance;}

module.exports={getDatabase,generateId,DB_FILE,JsonDatabase,TableProxy,PreparedStatement};