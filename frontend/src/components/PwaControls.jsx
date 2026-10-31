import { useEffect, useState } from 'react';
import { publicApi } from '../services/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const raw = atob((base64String + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}

export default function PwaControls() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState('');
  const [preference, setPreference] = useState('all');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
    const handler = e => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    publicApi.getOverview().then(r => { const list = r.data?.teams || r.data?.tournament?.teams || []; setTeams(Array.isArray(list) ? list : []); }).catch(() => {});
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  const install = async () => {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
    else setStatus('iPhone: Safari-də Paylaş düyməsi → Add to Home Screen / Ana ekrana əlavə et. Android-də brauzer menyusundan Install app seç.');
  };
  const subscribe = async () => {
    if (!supported) return setStatus('Bu brauzer push bildirişlərini dəstəkləmir. Saytı Chrome və ya Safari-də aç.');
    setBusy(true); setStatus('');
    try {
      const keyResponse = await publicApi.getPushKey();
      if (!keyResponse.data?.enabled || !keyResponse.data?.publicKey) throw new Error('Push sistemi serverdə hələ aktivləşdirilməyib.');
      if (preference === 'team' && !teamId) throw new Error('Əvvəl komanda seç.');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Bildiriş icazəsi verilmədi.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(keyResponse.data.publicKey) });
      await publicApi.savePushSubscription({ subscription, preference, team_id: preference === 'team' ? teamId : null });
      setStatus('Bildirişlər aktiv edildi!');
    } catch (error) { setStatus(error.response?.data?.error || error.message || 'Xəta baş verdi.'); }
    finally { setBusy(false); }
  };
  return <section className="pwa-controls" aria-label="Mobil tətbiq və bildirişlər">
    <div className="pwa-actions"><button type="button" className="pwa-install" onClick={install}>＋ Tətbiqi yüklə</button><span className="pwa-caption">Khazar League-i ana ekrana əlavə et</span></div>
    <div className="pwa-notifications"><strong>Bildirişlər</strong><select value={preference} onChange={e=>setPreference(e.target.value)}><option value="all">Bütün liqa</option><option value="team">Seçilmiş komanda</option></select>
      {preference === 'team' && <select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value="">Komanda seç</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
      <button type="button" onClick={subscribe} disabled={busy}>{busy ? 'Gözlə...' : 'Bildirişləri aktiv et'}</button>
      {status && <small role="status">{status}</small>}
    </div>
  </section>;
}
