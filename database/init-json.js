/**
 * Khazar League Database Initialization (JSON mode)
 */

const { insertDefaultData } = require('./insert-defaults-json');
const { insertRemainingData } = require('./insert-defaults-json2');
const { getDatabase } = require('./json-db');

function initializeDatabase() {
    console.log('Initializing Khazar League database (JSON mode)...');
    const db = getDatabase();
    if (db.db.organizations.length === 0) {
        const part1 = insertDefaultData();
        insertRemainingData(part1);
    }
    console.log('Database initialization completed successfully');
    return db;
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };