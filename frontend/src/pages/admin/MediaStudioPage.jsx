import { useEffect, useRef, useState } from 'react';
import api, { tournamentApi } from '../../services/api';
const API_ORIGIN=(import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api').replace(/\/api\/?$/,'');

export function MediaStudioPage(){
 const canvasRef=useRef(null);
 const [format,setFormat]=useState('post');
 const [headline,setHeadline]=useState('MATCH DAY');
 const [subtitle,setSubtitle]=useState('KHAZAR LEAGUE 2026');
 const [home,setHome]=useState('KHAZAR WAVES');
 const [away,setAway]=useState('OPPONENT');
 const [score,setScore]=useState('— : —');
 const [accent,setAccent]=useState('#d6b35e');
 const [tournament,setTournament]=useState(null);
 const [archive,setArchive]=useState([]);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);
 useEffect(()=>{Promise.all([tournamentApi.getAll().catch(()=>({data:[]})),api.get('/media-generations')]).then(([t,g])=>{const current=(t.data||[]).find(x=>x.status!=='archived')||(t.data||[])[0];setTournament(current||null);setArchive(g.data||[]);}).catch(e=>setError(e.response?.data?.error||'Media məlumatları yüklənmədi.'));},[]);
 useEffect(()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  const w=1080,h=format==='story'?1920:1350;canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#111d2b');bg.addColorStop(.55,'#0a111b');bg.addColorStop(1,'#202e40');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.strokeRect(38,38,w-76,h-76);
  ctx.fillStyle=accent;ctx.font='800 28px Arial';ctx.letterSpacing='8px';ctx.fillText('KHAZAR LEAGUE',85,125);
  ctx.fillStyle='#fff';ctx.font='900 92px Arial';ctx.letterSpacing='-2px';wrapText(ctx,headline.toUpperCase(),85,h*.30,w-170,108);
  ctx.fillStyle='#aebbd0';ctx.font='600 30px Arial';ctx.letterSpacing='4px';ctx.fillText(subtitle.toUpperCase(),85,h*.43);
  const cardY=h*.53,cardH=h*.23;
  ctx.fillStyle='#ffffff10';ctx.fillRect(85,cardY,w-170,cardH);
  ctx.strokeStyle='#ffffff30';ctx.lineWidth=2;ctx.strokeRect(85,cardY,w-170,cardH);
  ctx.fillStyle='#fff';ctx.font='800 46px Arial';ctx.textAlign='center';ctx.fillText(home.toUpperCase(),w*.28,cardY+cardH*.43);
  ctx.fillStyle=accent;ctx.font='900 70px Arial';ctx.fillText(score,w*.5,cardY+cardH*.43);
  ctx.fillStyle='#fff';ctx.font='800 46px Arial';ctx.fillText(away.toUpperCase(),w*.72,cardY+cardH*.43);
  ctx.textAlign='left';ctx.fillStyle=accent;ctx.fillRect(85,h-155,170,5);
  ctx.fillStyle='#9aa9bc';ctx.font='600 24px Arial';ctx.fillText('OFFICIAL TOURNAMENT PLATFORM',85,h-95);
  ctx.fillStyle='#fff';ctx.font='900 34px Arial';ctx.textAlign='right';ctx.fillText('KL / 26',w-85,h-95);
 },[format,headline,subtitle,home,away,score,accent]);
 const exportDesign=async()=>{
  const canvas=canvasRef.current;if(!canvas)return;
  setSaving(true);setError('');setNotice('');
  try{
   const image_data=canvas.toDataURL('image/png');
   const r=await api.post('/media-generations/export',{image_data,title:headline,tournament_id:tournament?.id,format});
   const link=document.createElement('a');link.href=image_data;link.download=`khazar-league-${format}.png`;link.click();
   setNotice('Dizayn PNG kimi endirildi və media arxivində saxlanıldı.');
   setArchive(prev=>[r.data,...prev]);
  }catch(e){setError(e.response?.data?.error||'Dizayn ixrac edilə bilmədi.');}
  finally{setSaving(false);}
 };
 return <section className="page-shell"><div className="page-heading"><div><span className="eyebrow">KREATİV İDARƏETMƏ</span><h1>Media Studio</h1><p>Turnir üçün post və story vizualları hazırla, PNG kimi ixrac et və arxivlə.</p></div><button className="btn btn-primary" onClick={exportDesign} disabled={saving}>{saving?'Hazırlanır...':'PNG ixrac et'}</button></div>
 {notice&&<div className="notice success">{notice}</div>}{error&&<div className="notice error">{error}</div>}
 <div className="media-layout"><div className="panel media-controls"><h2>Dizayn parametrləri</h2>
 <label className="field">Format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="post">Instagram Post · 1080 × 1350</option><option value="story">Instagram Story · 1080 × 1920</option></select></label>
 <label className="field">Başlıq<input value={headline} onChange={e=>setHeadline(e.target.value)}/></label>
 <label className="field">Alt başlıq<input value={subtitle} onChange={e=>setSubtitle(e.target.value)}/></label>
 <label className="field">Ev sahibi komanda<input value={home} onChange={e=>setHome(e.target.value)}/></label>
 <label className="field">Rəqib komanda<input value={away} onChange={e=>setAway(e.target.value)}/></label>
 <label className="field">Hesab<input value={score} onChange={e=>setScore(e.target.value)}/></label>
 <label className="field">Vurğu rəngi<input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label>
 <p className="field-hint">Loqoların orijinal faylları saxlanılır; bu ilkin redaktorda mətn, format və vurğu rəngi dəyişdirilir.</p></div>
 <div className="panel media-preview"><div className="panel-heading"><h2>Canlı önizləmə</h2><span className="status-pill">Canlı</span></div><div className="canvas-frame"><canvas ref={canvasRef}/></div></div></div>
 <div className="panel"><div className="panel-heading"><h2>Dizayn arxivi</h2><span>{archive.length} fayl</span></div>{archive.length===0?<p className="muted-note">Hələ ixrac edilmiş dizayn yoxdur.</p>:<div className="archive-grid">{archive.map(item=><a className="archive-item" key={item.id} href={`${API_ORIGIN}${item.output_path}`} target="_blank" rel="noreferrer"><span>PNG / MEDIA</span><b>{JSON.parse(item.custom_data||'{}').title||'Khazar League dizaynı'}</b><small>{new Date(item.generated_at).toLocaleString('az-AZ')}</small><em>Faylı aç ↗</em></a>)}</div>}</div>
 </section>;
}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const words=text.split(' ');let line='';for(let i=0;i<words.length;i++){const test=line+words[i]+' ';if(ctx.measureText(test).width>maxWidth&&i>0){ctx.fillText(line,x,y);line=words[i]+' ';y+=lineHeight;}else line=test;}ctx.fillText(line,x,y);}
