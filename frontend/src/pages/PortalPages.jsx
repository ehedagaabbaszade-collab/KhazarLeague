import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { publicApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
const API_ORIGIN=(import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api').replace(/\/api\/?$/,'');

export function PublicHome() {
  const [data,setData]=useState({teams:[],groups:[],matches:[],announcements:[],sponsors:[],awards:[],tournament:null});
  const [loading,setLoading]=useState(true);
  useEffect(()=>{publicApi.getOverview().then(r=>setData(r.data)).catch(console.error).finally(()=>setLoading(false));},[]);
  const {teams,groups,matches,tournament,players=[],announcements=[],sponsors=[],awards=[]}=data;
  return <div className="public-shell">
    <header className="public-nav"><Link to="/" className="brand"><span className="brand-mark">KL</span><span>KHAZAR <b>LEAGUE</b></span></Link><nav><a href="#teams">Komandalar</a><a href="#groups">Qruplar</a><a href="#matches">Oyunlar</a></nav><Link to="/login" className="btn btn-outline">İdarəetmə</Link></header>
    <section className="public-hero"><div className="public-hero-content"><span className="eyebrow">KHAZAR UNIVERSITY · 2026</span><h1>Bir liqa.<br/><em>Bir məqsəd.</em></h1><p>Universitet futbolunun rəqabət, komanda ruhu və idman mədəniyyəti ilə birləşdiyi turnir.</p><a className="btn btn-primary" href="#groups">Turnirə bax ↓</a></div><div className="hero-orbit"><span>16</span><small>KOMANDA</small><i>⚽</i></div></section>
    <section className="public-stats">{[['Komanda',teams.length],['Oyunçu',players.length],['Oyun',matches.length],['Müddət','60 dəq']].map(([l,v])=><div key={l}><b>{v}</b><span>{l}</span></div>)}</section>
    {loading?<div className="loading-panel">Turnir məlumatları yüklənir...</div>:<>
      <section className="public-section" id="groups"><div className="section-title"><div><span className="eyebrow">TURNİRİN STRUKTURU</span><h2>Qrup mərhələsi</h2></div><p>Hər qrupdan ilk iki komanda pley-offa yüksəlir.</p></div><div className="public-groups">{groups.map(g=><article className="public-group" key={g.id}><div className="group-title">QRUP <b>{g.name}</b></div>{teams.filter(t=>t.group_id===g.id).map(t=><div className="public-team" key={t.id}>{t.logo_path?<img className="team-logo-small" src={`${API_ORIGIN}${t.logo_path}`} alt={`${t.name} loqosu`}/>:<span className="team-crest">{t.name.slice(0,2).toUpperCase()}</span>}<b>{t.name}</b><small>0 xal</small></div>)}</article>)}</div></section>
      <section className="public-section" id="teams"><div className="section-title"><div><span className="eyebrow">İŞTİRAKÇILAR</span><h2>16 komanda</h2></div></div><div className="team-cards">{teams.map(t=><article className="team-card" key={t.id}>{t.logo_path?<img className="team-logo-large" src={`${API_ORIGIN}${t.logo_path}`} alt={`${t.name} loqosu`}/>:<div className="team-crest large">{t.name.slice(0,2).toUpperCase()}</div>}<h3>{t.name}</h3><span>Qrup {groups.find(g=>g.id===t.group_id)?.name||'—'}</span><details className="roster-details"><summary>Heyətə bax ({players.filter(p=>p.team_id===t.id).length})</summary><ul>{players.filter(p=>p.team_id===t.id).map(p=><li key={p.id}>{p.full_name||`${p.first_name} ${p.last_name}`}</li>)}</ul></details></article>)}</div></section>
      <section className="public-section" id="matches"><div className="section-title"><div><span className="eyebrow">OYUN TƏQVİMİ</span><h2>Qrup oyunları</h2></div></div><div className="public-match-list">{matches.map(m=><div className="public-match" key={m.id}><span>Qrup {m.group_name||'—'} · Tur {m.round_number}</span><b>{teams.find(t=>t.id===m.home_team_id)?.name||m.home_team_id}</b><strong>{m.home_score??'—'} : {m.away_score??'—'}</strong><b>{teams.find(t=>t.id===m.away_team_id)?.name||m.away_team_id}</b><small>{m.match_date||'Tarix təyin edilməyib'}</small></div>)}</div></section>
      <section className="public-section"><div className="section-title"><div><span className="eyebrow">RƏSMİ MƏLUMATLAR</span><h2>Xəbərlər və elanlar</h2></div></div>{announcements.length?<div className="public-groups">{announcements.map(a=><article className="public-group" key={a.id}><span className="eyebrow">{a.type||'ELAN'}</span><h3>{a.title}</h3><p>{a.summary||a.content}</p></article>)}</div>:<p>Hazırda dərc edilmiş elan yoxdur.</p>}</section>
      <section className="public-section"><div className="section-title"><div><span className="eyebrow">TƏRƏFDAŞLAR</span><h2>Rəsmi sponsorlar</h2></div></div>{sponsors.length?<div className="sponsor-row">{sponsors.map(s=><a key={s.id} href={s.website||'#'} target={s.website?'_blank':undefined} rel="noreferrer">{s.logo_path?<img src={s.logo_path.startsWith('http')?s.logo_path:`${API_ORIGIN}${s.logo_path}`} alt={s.name}/>:<b>{s.name}</b>}</a>)}</div>:<p>Sponsor məlumatları əlavə edildikdə burada görünəcək.</p>}</section>
    </>}
    <footer className="public-footer"><span>KHAZAR LEAGUE 2026</span><span>Khazar University · Bakı</span><Link to="/login">Admin girişi</Link></footer>
  </div>;
}

export function TeamCabinet() {
  const {user}=useAuth();
  const [team,setTeam]=useState(null),[players,setPlayers]=useState([]),[error,setError]=useState('');
  useEffect(()=>{(async()=>{try{const teamId=user?.team_id;if(!teamId){setError('Bu hesab üçün komanda əlaqələndirilməyib. Super Admin komanda kabinetini hesabla əlaqələndirməlidir.');return;}const [t,p]=await Promise.all([api.get(`/teams/${teamId}`),api.get(`/teams/${teamId}/players`)]);setTeam(t.data);setPlayers(p.data||[]);}catch(e){setError(e.response?.data?.error||'Komanda məlumatı yüklənmədi.');}})();},[user]);
  return <div className="cabinet-shell"><div className="page-heading"><div><span className="eyebrow">KAPİTAN KABİNETİ</span><h1>{team?.name||'Komanda kabineti'}</h1><p>Komanda məlumatları və heyətə baxış</p></div></div>{error&&<div className="notice error">{error}</div>}<div className="panel"><h2>Oyunçu heyəti</h2>{players.length?<div className="table-responsive"><table className="data-table dark-table"><thead><tr><th>Oyunçu</th><th>Forma</th><th>Mövqe</th></tr></thead><tbody>{players.map(p=><tr key={p.id}><td>{p.first_name} {p.last_name}</td><td>{p.jersey_number||'—'}</td><td>{p.position||'—'}</td></tr>)}</tbody></table></div>:<p className="muted-note">Təsdiqlənmiş oyunçu məlumatı yoxdur.</p>}</div></div>;
}

export function PlayerCabinet() {
  const {user}=useAuth();
  const [player,setPlayer]=useState(null),[team,setTeam]=useState(null),[error,setError]=useState('');
  useEffect(()=>{if(!user?.player_id)return;api.get(`/players/${user.player_id}`).then(async r=>{setPlayer(r.data);if(r.data.team_id){const t=await api.get(`/teams/${r.data.team_id}`);setTeam(t.data);}}).catch(e=>setError(e.response?.data?.error||'Profil məlumatı yüklənmədi.'));},[user]);
  return <div className="cabinet-shell"><div className="page-heading"><div><span className="eyebrow">OYUNÇU KABİNETİ</span><h1>Şəxsi profil</h1><p>Yalnız baxış rejimi</p></div></div>{error&&<div className="notice error">{error}</div>}<div className="panel profile-panel"><div className="profile-avatar">{(player?.full_name||user?.full_name||'O').slice(0,1)}</div><div><h2>{player?.full_name||user?.full_name||'Oyunçu'}</h2><p>{team?.name||'Komanda əlaqələndirilməyib'}</p><span className="status-pill">Profil məlumatları yalnız admin tərəfindən yenilənir</span></div></div><div className="panel"><h2>Profil məlumatları</h2><div className="settings-grid"><div><b>Forma nömrəsi</b><strong>{player?.jersey_number||'—'}</strong></div><div><b>Mövqe</b><strong>{player?.position||'—'}</strong></div><div><b>Kurs</b><strong>{player?.course||'—'}</strong></div></div></div></div>;
}
