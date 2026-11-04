const crypto = require('node:crypto');

function isVotingPolicy(policy) {
  return policy === 'public' || policy === 'authenticated';
}

function hashAnonymousVoterToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function readCookie(cookieHeader, name) {
  for (const part of String(cookieHeader || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

function serializeVoterCookie(name, token, path, { secure = false, sameSite = 'Lax', maxAge = 15552000 } = {}) {
  const attributes = [`${name}=${token}`, 'HttpOnly', `Path=${path}`, `Max-Age=${maxAge}`, `SameSite=${sameSite}`];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

module.exports = { isVotingPolicy, hashAnonymousVoterToken, readCookie, serializeVoterCookie };
