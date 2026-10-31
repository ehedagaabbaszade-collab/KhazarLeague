
import { useEffect, useState } from 'react';
import api from '../../services/api';

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [form, setForm] = useState({ role: 'team_captain' });
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const load = async () => {
    try {
      const [u, t, p, c] = await Promise.all([
        api.get('/users'),
        api.get('/teams'),
        api.get('/players'),
        api.get('/permissions/catalog')
      ]);
      setUsers(u.data || []);
      setTeams(t.data || []);
      setPlayers(p.data || []);
      setPermissionCatalog(c.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'İstifadəçilər yüklənmədi.');
    }
  };

  const editPermissions = async (user) => {
    try {
      const r = await api.get(`/users/${user.id}/permissions`);
      setSelectedUser(user);
      setSelectedPermissions(r.data || []);
    } catch (e) {
      setError(e.response?.data?.error || 'İcazələr yüklənmədi.');
    }
  };

  const savePermissions = async () => {
    try {
      await api.put(`/users/${selectedUser.id}/permissions`, {
        permissions: selectedPermissions
      });
      setNotice('İcazələr yeniləndi.');
      setSelectedUser(null);
    } catch (e) {
      setError(e.response?.data?.error || 'İcazələr yadda saxlanmadı.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setNotice('İstifadəçi hesabı yaradıldı.');
      setOpen(false);
      setForm({ role: 'team_captain' });
      load();
    } catch (e) {
      setError(e.response?.data?.error || 'Hesab yaradılmadı.');
    }
  };

  return (
    <section className="page-shell">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HESAB VƏ İCAZƏLƏR</span>
          <h1>İstifadəçilər</h1>
          <p>Admin, kapitan və oyunçu hesablarının yaradılması.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Hesab yarat
        </button>
      </div>

      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}

      <div className="panel table-panel">
        <div className="table-responsive">
          <table className="data-table dark-table">
            <thead>
              <tr>
                <th>Ad soyad</th>
                <th>E-poçt</th>
                <th>Rol</th>
                <th>Status</th>
                <th>İcazələr</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? 'Aktiv' : 'Deaktiv'}</td>
                  <td>
                    {u.role === 'super_admin' ? 'Tam giriş' : (
                      <button
                        className="btn btn-small"
                        onClick={() => editPermissions(u)}
                      >
                        İcazələri idarə et
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card permission-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">FƏRDİ GİRİŞ HÜQUQLARI</span>
                <h2>{selectedUser.full_name}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedUser(null)}>×</button>
            </div>
            <div className="permission-grid">
              {permissionCatalog.map(key => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(key)}
                    onChange={e => setSelectedPermissions(prev =>
                      e.target.checked ? [...prev, key] : prev.filter(x => x !== key)
                    )}
                  />
                  <span>{key}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setSelectedUser(null)}>Ləğv et</button>
              <button className="btn btn-primary" onClick={savePermissions}>İcazələri saxla</button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={submit}>
            <div className="modal-head">
              <h2>Yeni hesab</h2>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}>×</button>
            </div>

            {['full_name', 'email', 'password'].map(k => (
              <label className="field" key={k}>
                {k === 'full_name' ? 'Ad soyad' : k === 'email' ? 'E-poçt' : 'İlkin şifrə'}
                <input
                  required
                  type={k === 'password' ? 'password' : k === 'email' ? 'email' : 'text'}
                  minLength={k === 'password' ? 8 : undefined}
                  value={form[k] || ''}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}

            <label className="field">
              Rol
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="team_captain">Komanda kapitanı</option>
                <option value="player">Oyunçu</option>
                <option value="tournament_admin">Turnir admini</option>
                <option value="match_official">Oyun rəsmisi</option>
                <option value="media_manager">Media admini</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </label>

            {form.role === 'team_captain' && (
              <label className="field">
                Komanda
                <select
                  required
                  value={form.team_id || ''}
                  onChange={e => setForm({ ...form, team_id: e.target.value })}
                >
                  <option value="">Komanda seçin</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            )}

            {form.role === 'player' && (
              <label className="field">
                Oyunçu
                <select
                  required
                  value={form.player_id || ''}
                  onChange={e => setForm({ ...form, player_id: e.target.value })}
                >
                  <option value="">Oyunçu seçin</option>
                  {players.map(p => (
                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                  ))}
                </select>
              </label>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Ləğv et</button>
              <button className="btn btn-primary">Hesab yarat</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
