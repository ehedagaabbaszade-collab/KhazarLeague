import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('khazar_session');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('khazar_session');
      localStorage.removeItem('khazar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Organizations
export const orgApi = {
  getAll: () => api.get('/organizations'),
  getById: (id) => api.get(`/organizations/${id}`),
};

// Seasons
export const seasonApi = {
  getAll: () => api.get('/seasons'),
  getById: (id) => api.get(`/seasons/${id}`),
};

// Tournaments
export const tournamentApi = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  getGroups: (tournamentId) => api.get(`/tournaments/${tournamentId}/groups`),
  getTeams: (tournamentId) => api.get(`/tournaments/${tournamentId}/teams`),
  getMatches: (tournamentId) => api.get(`/tournaments/${tournamentId}/matches`),
  getStandings: (tournamentId) => api.get(`/tournaments/${tournamentId}/standings`),
  recalculateStandings: (tournamentId) => api.post(`/tournaments/${tournamentId}/standings/recalculate`),
  getAwards: (tournamentId) => api.get(`/tournaments/${tournamentId}/awards`),
};

// Groups
export const groupApi = {
  getAll: () => api.get('/groups'),
  getByTournament: (tournamentId) => api.get(`/tournaments/${tournamentId}/groups`),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Teams
export const teamApi = {
  getAll: () => api.get('/teams'),
  getByTournament: (tournamentId) => api.get(`/tournaments/${tournamentId}/teams`),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getPlayers: (teamId) => api.get(`/teams/${teamId}/players`),
};

// Players
export const playerApi = {
  getAll: () => api.get('/players'),
  getByTeam: (teamId) => api.get(`/teams/${teamId}/players`),
  getById: (id) => api.get(`/players/${id}`),
  create: (data) => api.post('/players', data),
  update: (id, data) => api.put(`/players/${id}`, data),
  delete: (id) => api.delete(`/players/${id}`),
  update: (id, data) => api.put(`/players/${id}`, data),
};

// Matches
export const matchApi = {
  getAll: () => api.get('/matches'),
  getByTournament: (tournamentId) => api.get(`/tournaments/${tournamentId}/matches`),
  getById: (id) => api.get(`/matches/${id}`),
  create: (data) => api.post('/matches', data),
  update: (id, data) => api.put(`/matches/${id}`, data),
  delete: (id) => api.delete(`/matches/${id}`),
  update: (id, data) => api.put(`/matches/${id}`, data),
  addEvent: (matchId, data) => api.post(`/matches/${matchId}/events`, data),
  getEvents: (matchId) => api.get(`/matches/${matchId}/events`),
};

// Standings
export const standingsApi = {
  getByTournament: (tournamentId) => api.get(`/tournaments/${tournamentId}/standings`),
  recalculate: (tournamentId) => api.post(`/tournaments/${tournamentId}/standings/recalculate`),
};

// Awards
export const awardApi = {
  getAll: () => api.get('/awards'),
  getByTournament: (tournamentId) => api.get(`/tournaments/${tournamentId}/awards`),
  getById: (id) => api.get(`/awards/${id}`),
  create: (data) => api.post('/awards', data),
  update: (id, data) => api.put(`/awards/${id}`, data),
  delete: (id) => api.delete(`/awards/${id}`),
};

// Announcements
export const announcementApi = {
  getAll: () => api.get('/announcements'),
  getByOrg: (orgId) => api.get(`/organizations/${orgId}/announcements`),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  publish: (id) => api.post(`/announcements/${id}/publish`),
};

// Documents
export const documentApi = {
  getAll: (orgId) => api.get('/documents', { params: { organization_id: orgId } }),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', data),
  update: (id, data) => api.put(`/documents/${id}`, data),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Media
export const mediaApi = {
  getTemplates: (orgId) => api.get(`/organizations/${orgId}/media-templates`),
  createTemplate: (data) => api.post('/media-templates', data),
  getGenerations: (tournamentId) => api.get('/media-generations', { params: { tournament_id: tournamentId } }),
  createGeneration: (data) => api.post('/media-generations', data),
  updateTemplate: (id, data) => api.put(`/media-templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/media-templates/${id}`),
};

// Public endpoints (no auth required)
export const publicApi = {
  getOverview: () => api.get('/public/overview'),
  getTournament: (tournamentId) => api.get(`/public/tournament/${tournamentId}`),
  getTeam: (teamId) => api.get(`/public/team/${teamId}`),
  getPlayer: (playerId) => api.get(`/public/player/${playerId}`),
};

export default api;