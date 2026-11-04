const assert = require('node:assert/strict');
const app = require('../backend/server');

assert.equal(app.isMatchOfficialRequestAllowed('POST', '/matches/match-1/events'), true,
    'match officials must be able to record match events');
assert.equal(app.isMatchOfficialRequestAllowed('POST', '/matches'), false,
    'match officials must not create matches');
assert.equal(app.isMatchOfficialRequestAllowed('POST', '/matches/match-1'), false,
    'match officials must not change match metadata through unrelated POST routes');
assert.equal(app.isMatchOfficialRequestAllowed('GET', '/matches/match-1/events'), true);
assert.equal(app.isMatchOfficialRequestAllowed('PUT', '/matches/match-1'), true);
assert.equal(app.isMatchOfficialRequestAllowed('DELETE', '/matches/match-1/events'), false,
    'match officials may not delete events through this access exception');

assert.equal(app.permissionKeyForRequest('POST', '/matches/match-1/events', 'match'), 'match.event.create');
assert.equal(app.permissionKeyForRequest('PUT', '/matches/match-1/events', 'match'), 'match.event.update');
assert.equal(app.permissionKeyForRequest('DELETE', '/matches/match-1/events', 'match'), 'match.event.delete');
assert.equal(app.permissionKeyForRequest('POST', '/matches', 'match'), 'match.create');

console.log('Backend match-event permission tests passed (10 assertions).');
// json-db owns a periodic persistence timer; this isolated policy test never
// marks it dirty, so exit without waiting for the timer.
process.exit(0);
