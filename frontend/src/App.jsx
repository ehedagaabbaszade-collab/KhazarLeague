import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { AdminResourcePage, StandingsPage } from './pages/admin/AdminResourcePage';
import { MediaStudioPage } from './pages/admin/MediaStudioPage';
import { KnockoutPage } from './pages/admin/KnockoutPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { LineupBuilderPage, MatchProfilePage, NewsArticlePage, PlayerProfilePage, TeamProfilePage } from './pages/PublicProfiles';
import { StatisticsPage } from './pages/StatisticsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { PlayerPositionImportPage } from './pages/admin/PlayerPositionImportPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicHome } from './pages/PortalPages';
import './index.css';
import './App.css';
import './components/layout/Layout.css';
import './pages/auth/LoginPage.css';
import './khazar-design.css';
import PwaControls from './components/PwaControls';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="loading-panel">Yüklənir...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<PublicHome />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/teams/:teamId" element={<TeamProfilePage />} />
    <Route path="/players/:playerId" element={<PlayerProfilePage />} />
    <Route path="/matches/:matchId" element={<MatchProfilePage />} />
    <Route path="/statistics" element={<StatisticsPage />} />
    <Route path="/news/:newsId" element={<NewsArticlePage />} />
    <Route element={<ProtectedRoute allowedRoles={['super_admin']}><AdminLayout /></ProtectedRoute>}>
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/tournaments" element={<AdminResourcePage type="tournaments" />} />
      <Route path="/admin/seasons" element={<AdminResourcePage type="seasons" />} />
      <Route path="/admin/sponsors" element={<AdminResourcePage type="sponsors" />} />
      <Route path="/admin/teams" element={<AdminResourcePage type="teams" />} />
      <Route path="/admin/players" element={<AdminResourcePage type="players" />} />
      <Route path="/admin/player-positions" element={<PlayerPositionImportPage />} />
      <Route path="/admin/matches" element={<AdminResourcePage type="matches" />} />
      <Route path="/admin/lineups" element={<LineupBuilderPage />} />
      <Route path="/admin/standings" element={<StandingsPage />} />
      <Route path="/admin/knockout" element={<KnockoutPage />} />
      <Route path="/admin/awards" element={<AdminResourcePage type="awards" />} />
      <Route path="/admin/announcements" element={<AdminResourcePage type="announcements" />} />
      <Route path="/admin/documents" element={<AdminResourcePage type="documents" />} />
      <Route path="/admin/media" element={<MediaStudioPage />} />
      <Route path="/admin/media-templates" element={<AdminResourcePage type="media" />} />
      <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
      <Route path="/admin/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /><PwaControls /></BrowserRouter></AuthProvider>;
}
