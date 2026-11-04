const assert = require('node:assert/strict');
const { getLineupRules, validateLineup } = require('../database/lineup-formations');

const six = getLineupRules({});
assert.equal(six.playersOnPitch, 6);
assert.equal(six.substitutes, 2);
assert.deepEqual(Object.keys(six.formations), ['2-2-1', '1-3-1', '2-1-2']);
for (const [name, positions] of Object.entries(six.formations)) assert.equal(positions.length, 6, `${name} has goalkeeper plus five outfield players`);

const eleven = getLineupRules({ players_on_pitch: 11, substitutes_per_team: 3 });
assert.equal(eleven.playersOnPitch, 11);
assert.equal(eleven.substitutes, 3);
assert.deepEqual(Object.keys(eleven.formations), ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-1-4-1', '3-4-3']);
for (const [name, positions] of Object.entries(eleven.formations)) assert.equal(positions.length, 11, `${name} has eleven positions`);

const players = Array.from({ length: 14 }, (_, i) => ({ player_id: `p${i}`, is_starter: i < 11 }));
assert.equal(validateLineup({ tournament: { players_on_pitch: 11, substitutes_per_team: 3 }, formation: '4-3-3', players, rosterPlayerIds: players.map(p => p.player_id) }), null);
assert.match(validateLineup({ tournament: {}, formation: '4-3-3', players, rosterPlayerIds: players.map(p => p.player_id) }), /uyğun deyil/);
assert.match(validateLineup({ tournament: { players_on_pitch: 11, substitutes_per_team: 3 }, formation: '4-3-3', players: players.slice(0, 13), rosterPlayerIds: players.map(p => p.player_id) }), /14 oyunçu/);
assert.match(validateLineup({ tournament: { players_on_pitch: 11, substitutes_per_team: 3 }, formation: '4-3-3', players: [...players.slice(0, 13), { ...players[0], is_starter: false }], rosterPlayerIds: players.map(p => p.player_id) }), /təkrar/);
assert.match(validateLineup({ tournament: { players_on_pitch: 11, substitutes_per_team: 3 }, formation: '4-3-3', players, rosterPlayerIds: players.slice(0, 13).map(p => p.player_id) }), /qeydiyyatlı/);
console.log('Lineup format rules passed: six-a-side defaults, eleven-a-side formations, roster and count validation.');
