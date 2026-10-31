import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { tournamentApi } from '../../services/api';

export function DashboardPage() {
  const [data,setData]=useState({teams:[],players:[],matches:[],tournament:null,groups:[]});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{(async()=>{try{
    const [tr,teams,players,matches,groups]=await Promise.all([
      tournamentApi.getAll(),api.get('/teams'),api.get('/players'),api.get('/matches'),api.get('/groups')
    ]);
    const tournaments=tr.data||[];
    setData({teams:teams.data||[],players:players.data||[],matches:matches.data||[],groups:groups.data||[],tournament:tournaments.find(t=>t.status!=='archived')||tournaments[0]||null});
  }catch(e){setError(e.response?.data?.error||'Dashboard məlumatları yüklənmədi.');}finally{setLoading(false);}})();},[]);
  if(loading)return <div className="loading-panel">Turnir məlumatları yüklənir...</div>;
  const {teams,players,matches,tournament,groups}=data;
  const completed=matches.filter(m=>m.match_status==='completed');
  const upcoming=matches.filter(m=>m.match_status!=='completed');
  const stats=[
    ['Komandalar',teams.length,'16 komandalı turnir','/admin/teams','♧'],
    ['Oyunçular',players.length,'Məlumat bazasında','/admin/players','♙'],
    ['Oyunlar',matches.length,'Qrup mərhələsi','/admin/matches','⚽'],
    ['Tamamlanan',completed.length,'Təsdiqlənmiş nəticələr','/admin/matches','✓']
  ];
  return <section className="page-shell">
    <div className="hero-panel"><div><span className="eyebrow">KHAZAR LEAGUE / 2026</span><h1>Turnirin idarəetmə mərkəzi</h1><p>{tournament?.name||'Khazar League 2026'} · 4 qrup · 8 pley-off iştirakçısı</p></div><div className="hero-mark">KL<span>26</span></div></div>
    {error&&<div className="notice error">{error}</div>}
    <div className="stats-grid dark-stats">{stats.map(([label,value,sub,to,icon])=><Link to={to} className="stat-card dark-stat" key={label}><div className="stat-icon">{icon}</div><div><strong>{value}</strong><span>{label}</span><small>{sub}</small></div></Link>)}</div>
    <div className="dashboard-grid">
      <div className="panel"><div className="panel-heading"><div><span className="eyebrow">QRUP MƏRHƏLƏSİ</span><h2>Qruplar</h2></div><Link to="/admin/standings">Cədvəllərə bax →</Link></div><div className="group-grid">{['A','B','C','D'].map(name=>{const g=groups.find(x=>x.name===name);const members=teams.filter(t=>t.group_id===g?.id);return <div className="group-tile" key={name}><b>QRUP {name}</b><span>{members.length}/4 komanda</span><small>{members.map(t=>t.name).join(' · ')||'Komandalar gözlənilir'}</small></div>})}</div></div>
      <div className="panel"><div className="panel-heading"><div><span className="eyebrow">NÖVBƏTİ ADDIM</span><h2>Turnir hazırlığı</h2></div></div><ul className="check-list"><li className={teams.length===16?'done':''}><span/>{teams.length}/16 komanda əlavə edilib</li><li className={matches.length===24?'done':''}><span/>{matches.length}/24 qrup oyunu yaradılıb</li><li className={players.length===128?'done':''}><span/>{players.length}/128 oyunçu məlumatı mövcuddur</li><li className={matches.some(m=>m.match_date)?'done':''}> <span/>Oyun tarixləri təyin edilib</li></ul><p className="muted-note">Məlumatı olmayan oyunçu, tarix və loqolar uydurulmur; admin panelindən əlavə edilə bilər.</p></div>
    </div>
    <div className="panel"><div className="panel-heading"><div><span className="eyebrow">OYUN MƏRKƏZİ</span><h2>Son və qarşıdakı oyunlar</h2></div><Link to="/admin/matches">Bütün oyunlar →</Link></div>{matches.length===0?<div className="empty-state compact">Oyun məlumatı yoxdur.</div>:<div className="match-list">{[...matches].sort((a,b)=>String(a.match_date||'9999').localeCompare(String(b.match_date||'9999'))).slice(0,6).map(m=><div className="match-item" key={m.id}><span className="match-group">Qrup {m.group_name||'—'} · Tur {m.round_number||'—'}</span><b>{teams.find(t=>t.id===m.home_team_id)?.name||m.home_team_id}</b><strong>{m.home_score??'—'} : {m.away_score??'—'}</strong><b>{teams.find(t=>t.id===m.away_team_id)?.name||m.away_team_id}</b><span className="match-date">{m.match_date||'Tarix təyin edilməyib'}</span></div>)}</div>}</div>
  </section>;
}
