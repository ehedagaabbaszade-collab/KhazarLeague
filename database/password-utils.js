/**
 * Password utilities using Node.js built-in crypto (no native dependencies)
 */

const crypto = require('crypto');

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha256';
const SALT_LENGTH = 16;

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH);
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(`${salt.toString('hex')}:${derivedKey.toString('hex')}`);
        });
    });
}

function verifyPassword(password, hash) {
    return new Promise((resolve, reject) => {
        const [saltHex, keyHex] = hash.split(':');
        if (!saltHex || !keyHex) {
            return resolve(false);
        }
        const salt = Buffer.from(saltHex, 'hex');
        crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
            if (err) reject(err);
            else resolve(derivedKey.toString('hex') === keyHex);
        });
    });
}

// Synchronous versions for simplicity
function hashPasswordSync(password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

function verifyPasswordSync(password, hash) {
    const [saltHex, keyHex] = hash.split(':');
    if (!saltHex || !keyHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const derivedKey = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
    return derivedKey.toString('hex') === keyHex;
}

module.exports = { hashPassword, verifyPassword, hashPasswordSync, verifyPasswordSync };