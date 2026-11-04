const assert = require('node:assert/strict');
const { isVotingPolicy, hashAnonymousVoterToken, readCookie, serializeVoterCookie } = require('../database/voting-utils');

assert.equal(isVotingPolicy('public'), true);
assert.equal(isVotingPolicy('authenticated'), true);
assert.equal(isVotingPolicy('anonymous-unlimited'), false);
assert.equal(hashAnonymousVoterToken('token-1'), hashAnonymousVoterToken('token-1'));
assert.notEqual(hashAnonymousVoterToken('token-1'), hashAnonymousVoterToken('token-2'));
assert.doesNotMatch(hashAnonymousVoterToken('private-token'), /private-token/);
assert.equal(readCookie('first=one; kl_vote_session=abc_123; last=three', 'kl_vote_session'), 'abc_123');
assert.equal(readCookie('first=one', 'kl_vote_session'), null);
assert.match(serializeVoterCookie('kl_vote_session', 'abc', '/api/public/voting/session/votes'), /HttpOnly/);
assert.match(serializeVoterCookie('kl_vote_session', 'abc', '/api/public/voting/session/votes', { secure: true }), /Secure/);
console.log('Voting policy and anonymous voter token checks passed.');
