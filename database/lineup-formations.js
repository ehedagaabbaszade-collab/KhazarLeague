const SIX_A_SIDE = {
  '2-2-1': [[50, 84], [30, 65], [70, 65], [35, 43], [65, 43], [50, 23]],
  '1-3-1': [[50, 84], [50, 65], [25, 45], [50, 42], [75, 45], [50, 23]],
  '2-1-2': [[50, 84], [30, 65], [70, 65], [50, 45], [35, 24], [65, 24]],
};
const ELEVEN_A_SIDE = {
  '4-3-3': [[50, 90], [18, 72], [39, 75], [61, 75], [82, 72], [28, 49], [50, 55], [72, 49], [22, 25], [50, 19], [78, 25]],
  '4-4-2': [[50, 90], [18, 72], [39, 75], [61, 75], [82, 72], [18, 48], [39, 53], [61, 53], [82, 48], [37, 26], [63, 26]],
  '4-2-3-1': [[50, 90], [18, 72], [39, 75], [61, 75], [82, 72], [39, 57], [61, 57], [22, 37], [50, 39], [78, 37], [50, 21]],
  '3-5-2': [[50, 90], [27, 73], [50, 77], [73, 73], [15, 49], [34, 52], [50, 55], [66, 52], [85, 49], [38, 27], [62, 27]],
  '4-1-4-1': [[50, 90], [18, 72], [39, 75], [61, 75], [82, 72], [50, 62], [18, 43], [39, 47], [61, 47], [82, 43], [50, 24]],
  '3-4-3': [[50, 90], [27, 73], [50, 77], [73, 73], [18, 49], [39, 53], [61, 53], [82, 49], [22, 27], [50, 23], [78, 27]],
};

function getLineupRules(tournament = {}) {
  const playersOnPitch = Number(tournament.players_on_pitch ?? 6);
  const substitutes = Number(tournament.substitutes_per_team ?? 2);
  const supported = playersOnPitch === 11 ? ELEVEN_A_SIDE : SIX_A_SIDE;
  return { playersOnPitch, substitutes, formations: supported };
}

function validateLineup({ tournament, formation, players, rosterPlayerIds }) {
  const rules = getLineupRules(tournament);
  if (![6, 11].includes(rules.playersOnPitch) || !Number.isInteger(rules.substitutes) || rules.substitutes < 0 || rules.substitutes > 11) return 'Turnir heyət parametrləri düzgün deyil.';
  if (!rules.formations[formation]) return 'Seçilmiş düzülüş turnir formatına uyğun deyil.';
  if (!Array.isArray(players) || players.length !== rules.playersOnPitch + rules.substitutes) return `Heyətdə ${rules.playersOnPitch} əsas və ${rules.substitutes} ehtiyat oyunçu olmalıdır (cəmi ${rules.playersOnPitch + rules.substitutes} oyunçu).`;
  const starters = players.filter(player => player.is_starter === true || player.is_starter === 1);
  const substitutes = players.filter(player => player.is_starter === false || player.is_starter === 0);
  if (starters.length !== rules.playersOnPitch || substitutes.length !== rules.substitutes) return `Heyətdə ${rules.playersOnPitch} əsas və ${rules.substitutes} ehtiyat oyunçu olmalıdır.`;
  const playerIds = players.map(player => player.player_id);
  if (playerIds.some(id => !id) || new Set(playerIds).size !== playerIds.length) return 'Heyətdə oyunçular təkrar və ya boş seçilə bilməz.';
  const roster = rosterPlayerIds instanceof Set ? rosterPlayerIds : new Set(rosterPlayerIds || []);
  if (playerIds.some(id => !roster.has(id))) return 'Yalnız komandanın qeydiyyatlı oyunçuları seçilə bilər.';
  return null;
}

module.exports = { getLineupRules, validateLineup };
