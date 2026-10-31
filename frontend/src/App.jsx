import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { AdminResourcePage, StandingsPage } from './pages/admin/AdminResourcePage';
import { UsersPage } from './pages/admin/UsersPage';
import { MediaStudioPage } from './pages/admin/MediaStudioPage';
import { KnockoutPage } from './pages/admin/KnockoutPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicHome, TeamCabinet, PlayerCabinet } from './pages/PortalPages';
import './index.css';
import './App.css';
import './components/layout/Layout.css';
import './pages/auth/LoginPage.css';
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
    <Route path="/captain" element={<ProtectedRoute allowedRoles={['team_captain']}><TeamCabinet /></ProtectedRoute>} />
    <Route path="/player" element={<ProtectedRoute allowedRoles={['player']}><PlayerCabinet /></ProtectedRoute>} />
    <Route element={<ProtectedRoute allowedRoles={['super_admin','tournament_admin','match_official','media_manager']}><AdminLayout /></ProtectedRoute>}>
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/tournaments" element={<AdminResourcePage type="tournaments" />} />
      <Route path="/admin/seasons" element={<AdminResourcePage type="seasons" />} />
      <Route path="/admin/sponsors" element={<AdminResourcePage type="sponsors" />} />
      <Route path="/admin/teams" element={<AdminResourcePage type="teams" />} />
      <Route path="/admin/players" element={<AdminResourcePage type="players" />} />
      <Route path="/admin/matches" element={<AdminResourcePage type="matches" />} />
      <Route path="/admin/standings" element={<StandingsPage />} />
      <Route path="/admin/knockout" element={<KnockoutPage />} />
      <Route path="/admin/awards" element={<AdminResourcePage type="awards" />} />
      <Route path="/admin/announcements" element={<AdminResourcePage type="announcements" />} />
      <Route path="/admin/documents" element={<AdminResourcePage type="documents" />} />
      <Route path="/admin/media" element={<MediaStudioPage />} />
      <Route path="/admin/media-templates" element={<AdminResourcePage type="media" />} />
      <Route path="/admin/users" element={<UsersPage />} />
      <Route path="/admin/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /><PwaControls /></BrowserRouter></AuthProvider>;
}
