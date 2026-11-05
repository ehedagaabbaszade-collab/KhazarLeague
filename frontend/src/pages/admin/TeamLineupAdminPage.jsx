import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import './TeamLineupAdminPage.css';

const FORMATIONS = ['1-2-2-1', '1-2-1-2', '1-3-1-1', '1-1-3-1'];
const START_POSITIONS = ['Qapıçı', 'Müdafiəçi', 'Müdafiəçi', 'Yarımmüdafiəçi', 'Hücumçu', 'Hücumçu'];

export function TeamLineupAdminPage() {
  const [teams,setTeams]=useState([]),[players,setPlayers]=useState([]),[teamId,setTeamId]=useState('');
  const [formation,setFormation]=useState(FORMATIONS[0]),[selected,setSelected]=useState(Array(8).fill(''));
  const [pending,setPending]=useState(null),[notice,setNotice]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const team=teams.find(t=>t.id===teamId);
  const roster=useMemo(()=>players.filter(p=>p.team_id===teamId),[players,teamId]);
  useEffect(()=>{Promise.all([api.get('/teams'),api.get('/players')]).then(([t,p])=>{setTeams(t.data||[]);setPlayers(p.data||[])}).catch(e=>setError(e.response?.data?.error||'Komandalar və oyunçular yüklənmədi.'));},[]);
  useEffect(()=>{setSelected(Array(8).fill(''));setPending(null);setNotice('');},[teamId]);
  const update=(index,value)=>setSelected(old=>old.map((x,i)=>i===index?value:x));
  const used=selected.filter(Boolean);
  const submit=async()=>{
    setError('');setNotice('');
    if(!teamId)return setError('Əvvəlcə komanda seçin.');
    if(selected.slice(0,6).some(x=>!x))return setError('6 əsas oyunçunun hamısını seçin.');
    if(new Set(used).size!==used.length)return setError('Eyni oyunçunu iki dəfə seçmək olmaz.');
    setBusy(true);
    try{
      const playersPayload=selected.map((id,i)=>id?({player_id:id,is_starter:i<6,position:i<6?START_POSITIONS[i]:`Ehtiyat ${i-5}`,x:i<6?[50,25,75,35,65,50][i]:null,y:i<6?[88,67,67,43,43,17][i]:null,sort_order:i}):null).filter(Boolean);
      const result=await api.put(`/teams/${teamId}/lineup`,{formation,players:playersPayload});
      setPending(result.data.lineup);
      setNotice('Heyət təsdiqə göndərildi. İctimai səhifədə hələ əvvəlki təsdiqlənmiş heyət görünür.');
    }catch(e){setError(e.response?.data?.error||'Heyət yadda saxlanmadı.');}
    finally{setBusy(false);}
  };
  const approve=async()=>{
    if(!pending)return;
    setBusy(true);setError('');setNotice('');
    try{await api.post(`/teams/${teamId}/lineup/${pending.id}/approve`);setNotice('Heyət təsdiqləndi və komandanın ictimai profilində dərc edildi.');setPending(null);}
    catch(e){setError(e.response?.data?.error||'Təsdiq mümkün olmadı.');}
    finally{setBusy(false);}
  };
  const previewPoints = {
    '1-2-2-1': [[50,88],[25,67],[75,67],[25,38],[75,38],[50,15]],
    '1-2-1-2': [[50,88],[25,67],[75,67],[50,48],[25,20],[75,20]],
    '1-3-1-1': [[50,88],[18,64],[50,64],[82,64],[50,38],[50,15]],
    '1-1-3-1': [[50,88],[50,67],[18,42],[50,42],[82,42],[50,15]]
  };
  const previewPlayers = selected.slice(0,6).map((id,i)=>({player:roster.find(p=>p.id===id),point:(previewPoints[formation]||previewPoints['1-2-2-1'])[i]}));
  const benchPlayers = selected.slice(6).map(id=>roster.find(p=>p.id===id)).filter(Boolean);
  return <main className="team-lineup-admin">
    <header><span>SUPER ADMIN · HEYƏT İDARƏETMƏSİ</span><h1>Komandanın daimi heyəti</h1><p>Bu bölmədə təsdiqlənən heyət komandanın ictimai profilində görünür. Matç heyətləri ayrıca idarə olunur.</p></header>
    <section className="team-lineup-panel">
      <label>Komanda<select value={teamId} onChange={e=>setTeamId(e.target.value)}><option value="">Komanda seçin</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Taktiki sxem<select value={formation} onChange={e=>setFormation(e.target.value)}>{FORMATIONS.map(x=><option key={x}>{x}</option>)}</select></label>
      {team&&<div className="team-lineup-roster"><h2>{team.name} · Start heyəti</h2>{Array.from({length:6},(_,i)=><label key={i}>{i+1}. {START_POSITIONS[i]}<select value={selected[i]} onChange={e=>update(i,e.target.value)}><option value="">Oyunçu seçin</option>{roster.filter(p=>!used.includes(p.id)||selected[i]===p.id).map(p=><option key={p.id} value={p.id}>#{p.jersey_number??'—'} · {p.full_name}</option>)}</select></label>)}<h2>Ehtiyat oyunçular</h2>{[6,7].map(i=><label key={i}>Ehtiyat {i-5}<select value={selected[i]} onChange={e=>update(i,e.target.value)}><option value="">Seçilməyib</option>{roster.filter(p=>!used.includes(p.id)||selected[i]===p.id).map(p=><option key={p.id} value={p.id}>#{p.jersey_number??'—'} · {p.full_name}</option>)}</select></label>)}</div>}
      {team&&<section className="lineup-3d-preview" aria-label="Heyətin 3D önizləməsi">
        <div className="lineup-3d-heading"><div><span>HEYƏTİN VİZUAL YOXLAMASI</span><h2>3D meydança önizləməsi</h2><p>Təsdiqdən əvvəl start heyətinin düzülüşünü yoxlayın.</p></div><strong>{formation}</strong></div>
        <div className="lineup-3d-stage">
          <div className="lineup-3d-pitch">
            <div className="lineup-3d-lines"><i className="lineup-3d-half"/><i className="lineup-3d-center"/><i className="lineup-3d-box lineup-3d-box-top"/><i className="lineup-3d-box lineup-3d-box-bottom"/></div>
            {previewPlayers.map(({player,point},i)=>player&&<div className="lineup-3d-player" key={player.id} style={{left:`${point[0]}%`,top:`${point[1]}%`}}>
              <span>{player.jersey_number??i+1}</span><b>{player.full_name}</b><small>{START_POSITIONS[i]}</small>
            </div>)}
          </div>
        </div>
        <div className="lineup-3d-bench"><b>EHTİYAT OYUNÇULARI</b>{benchPlayers.length?benchPlayers.map(p=><span key={p.id}>#{p.jersey_number??'—'} · {p.full_name}</span>):<small>Hələ ehtiyat seçilməyib</small>}</div>
      </section>}
      {error&&<p className="team-lineup-error" role="alert">{error}</p>}{notice&&<p className="team-lineup-notice" role="status">{notice}</p>}
      <div className="team-lineup-actions"><button disabled={busy||!teamId} onClick={submit}>{busy?'Gözləyin…':'Heyəti təsdiqə göndər'}</button><button className="approve" disabled={busy||!pending} onClick={approve}>Təsdiqlə və ictimai profildə dərc et</button></div>
    </section>
  </main>;
}
