/**
 * Khazar League Database Initialization
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { insertDefaultData } = require('./insert-defaults');

const DB_PATH = path.join(__dirname, '..', 'khazar_league.db');
const SCHEMA_DIR = __dirname;

function generateId() {
    return crypto.randomUUID();
}

function readSchemaFiles() {
    const files = [
        'schema_core.sql',
        'schema_users.sql',
        'schema_players.sql',
        'schema_matches.sql',
        'schema_content.sql',
        'schema_system.sql',
        'schema_indexes.sql'
    ];
    
    let combinedSchema = '';
    for (const file of files) {
        const filePath = path.join(SCHEMA_DIR, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            combinedSchema += content + '\n\n';
        } else {
            console.warn(`Schema file not found: ${file}`);
        }
    }
    return combinedSchema;
}

function initializeDatabase() {
    console.log('Initializing Khazar League database...');
    
    const db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    
    try {
        const schema = readSchemaFiles();
        db.exec(schema);
        console.log('Database schema created successfully');
        
        db.close();
        insertDefaultData();
        
        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase, DB_PATH, generateId };