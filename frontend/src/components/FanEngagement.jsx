import { useEffect, useMemo, useState } from 'react';
import { publicApi } from '../services/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function FanEngagement() {
  const [data,setData]=useState({players:[],teams:[],matches:[],tournament_id:null});
  const [fan,setFan]=useState(()=>{try{return JSON.parse(localStorage.getItem('kl_fan_google')||'null')}catch{return null}});
  const [status,setStatus]=useState({voted:false,predictions:[]});
  const [playerId,setPlayerId]=useState('');
  const [matchId,setMatchId]=useState('');
  const [prediction,setPrediction]=useState('home');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{publicApi.getFanData().then(r=>{
    const payload=r?.data||{};
    setData({
      tournament_id:payload.tournament_id||null,
      players:Array.isArray(payload.players)?payload.players:[],
      teams:Array.isArray(payload.teams)?payload.teams:[],
      matches:Array.isArray(payload.matches)?payload.matches:[]
    });
  }).catch(error=>console.error('Azarkeş məlumatları yüklənmədi:',error));},[]);
  useEffect(()=>{
    if(!fan?.google_sub)return;
    publicApi.getFanStatus(fan.session_token).then(r=>{
      const payload=r?.data||{};
      setStatus({voted:Boolean(payload.voted),predictions:Array.isArray(payload.predictions)?payload.predictions:[]});
    }).catch(()=>setStatus({voted:false,predictions:[]}));
  },[fan]);
  useEffect(()=>{
    if(!GOOGLE_CLIENT_ID)return;
    const scriptId='google-identity-services';
    const init=()=>{
      if(!window.google?.accounts?.id)return;
      window.google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:async response=>{
        setBusy(true);setMessage('');
        try{const r=await publicApi.googleSession(response.credential);setFan(r.data.account);localStorage.setItem('kl_fan_google',JSON.stringify(r.data.account));}
        catch(e){setMessage(e.response?.data?.error||'Google girişi alınmadı.');}
        finally{setBusy(false);}
      }});
      const target=document.getElementById('kl-google-button');
      if(target){target.innerHTML='';window.google.accounts.id.renderButton(target,{theme:'outline',size:'large',shape:'pill',text:'signin_with',width:240});}
    };
    if(window.google?.accounts?.id){init();return;}
    let script=document.getElementById(scriptId);
    if(!script){script=document.createElement('script');script.id=scriptId;script.src='https://accounts.google.com/gsi/client';script.async=true;script.defer=true;script.onload=init;document.head.appendChild(script);}
    else script.addEventListener('load',init);
  },[]);
  const teamName=id=>(Array.isArray(data.teams)?data.teams:[]).find(t=>t.id===id)?.name||'Komanda';
  const upcoming=useMemo(()=>(Array.isArray(data.matches)?data.matches:[]).filter(m=>!(Array.isArray(status.predictions)?status.predictions:[]).includes(m.id)),[data.matches,status.predictions]);
  const sendVote=async()=>{
    if(!fan||!playerId)return;
    setBusy(true);setMessage('');
    try{await publicApi.voteMvp({google_sub:fan.google_sub,player_id:playerId,tournament_id:data.tournament_id,session_token:fan.session_token});setStatus(s=>({...s,voted:true}));setMessage('Səsiniz qeydə alındı. Təşəkkürlər!');}
    catch(e){setMessage(e.response?.data?.error||'Səs qeydə alınmadı.');}
    finally{setBusy(false);}
  };
  const sendPrediction=async()=>{
    if(!fan||!matchId)return;
    setBusy(true);setMessage('');
    try{await publicApi.submitPrediction({google_sub:fan.google_sub,match_id:matchId,prediction,session_token:fan.session_token});setStatus(s=>({...s,predictions:[...(Array.isArray(s.predictions)?s.predictions:[]),matchId]}));setMessage('Proqnozunuz qeydə alındı.');setMatchId('');}
    catch(e){setMessage(e.response?.data?.error||'Proqnoz qeydə alınmadı.');}
    finally{setBusy(false);}
  };
  return <section className="public-section fan-engagement" id="fan-zone">
    <div className="section-title"><div><span className="eyebrow">AZARKEŞ ZONASI</span><h2>Səs ver. Proqnozunu paylaş.</h2></div><p>Google hesabı ilə daxil ol və turnirin bir hissəsi ol.</p></div>
    <div className="fan-login panel">
      {fan?<><div><span className="eyebrow">DAXİL OLUNUB</span><h3>{fan.name}</h3><small>{fan.email}</small></div><button className="btn btn-outline" onClick={()=>{setFan(null);localStorage.removeItem('kl_fan_google');setStatus({voted:false,predictions:[]});}}>Çıxış</button></>:<div><h3>Azarkeş hesabı</h3><p>Bir Google hesabı ilə daxil olaraq MVP səsverməsində və oyun proqnozlarında iştirak et.</p>{GOOGLE_CLIENT_ID?<div id="kl-google-button"/>:<p className="fan-config-note">Google girişi aktivləşməsi üçün VITE_GOOGLE_CLIENT_ID və GOOGLE_CLIENT_ID konfiqurasiya edilməlidir.</p>}</div>}
    </div>
    <div className="fan-actions">
      <article className="panel fan-card"><span className="eyebrow">MVP SƏSVERMƏSİ</span><h3>Turnirin ən yaxşı oyunçusu kimdir?</h3><p>Hər Google hesabı turnir üzrə yalnız bir dəfə səs verə bilər.</p>
        {status.voted?<div className="fan-success">Səsiniz qeydə alınıb.</div>:<><select value={playerId} onChange={e=>setPlayerId(e.target.value)} disabled={!fan}><option value="">Oyunçu seçin</option>{(Array.isArray(data.players)?data.players:[]).map(p=><option key={p.id} value={p.id}>{p.full_name} — {teamName(p.team_id)}</option>)}</select><button className="btn btn-primary" disabled={!fan||!playerId||busy} onClick={sendVote}>Səs ver</button></>}
      </article>
      <article className="panel fan-card"><span className="eyebrow">OYUN PROQNOZU</span><h3>Növbəti nəticəni təxmin et</h3><p>Hər oyun üçün bir proqnoz. Oyun başladıqdan sonra seçim bağlanır.</p>
        <select value={matchId} onChange={e=>setMatchId(e.target.value)} disabled={!fan}><option value="">Oyun seçin</option>{upcoming.map(m=><option key={m.id} value={m.id}>{teamName(m.home_team_id)} — {teamName(m.away_team_id)}</option>)}</select>
        <select value={prediction} onChange={e=>setPrediction(e.target.value)} disabled={!fan}><option value="home">Ev sahibi qalib</option><option value="draw">Heç-heçə</option><option value="away">Qonaq komanda qalib</option></select>
        <button className="btn btn-primary" disabled={!fan||!matchId||busy} onClick={sendPrediction}>Proqnozu göndər</button>
        <small>{(Array.isArray(status.predictions)?status.predictions.length:0)} oyun üçün proqnoz göndərilib</small>
      </article>
    </div>
    {message&&<p className="fan-message" role="status">{message}</p>}
  </section>;
}
