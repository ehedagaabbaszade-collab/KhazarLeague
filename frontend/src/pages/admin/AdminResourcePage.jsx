import './AdminPages.css';
import { useEffect, useMemo, useState } from 'react';
import api, { tournamentApi } from '../../services/api';
const API_ORIGIN=(import.meta.env.VITE_API_BASE_URL||'http://localhost:3000/api').replace(/\/api\/?$/,'');

const config = {
  teams: { title: 'Komandalar', subtitle: 'Komanda heyətləri və qrup bölgüsü', endpoint: '/teams', fields: [
    ['name','Komanda adı','text',true], ['short_name','Qısa ad','text'], ['group_id','Qrup ID-si','text'], ['captain_name','Kapitan','text'], ['captain_phone','Kapitan telefonu','text'], ['student_ticket','Tələbə bileti','text'], ['contact_phone','Əlaqə telefonu','text'], ['coordinator','Əlaqələndirici','text'], ['description','Təsvir','text']
  ], columns: [['logo_path','Loqo'],['name','Komanda'],['captain_name','Kapitan'],['captain_phone','Kapitan telefonu'],['student_ticket','Tələbə bileti'],['contact_phone','Əlaqə telefonu'],['group_id','Qrup'],['registration_status','Qeydiyyat'],['coordinator','Əlaqələndirici']] },
  players: { title: 'Oyunçular', subtitle: 'Oyunçu reyestri və heyət məlumatları', endpoint: '/players', fields: [
    ['first_name','Ad','text',true], ['last_name','Soyad','text',true], ['team_id','Komanda ID-si','text',true], ['jersey_number','Forma nömrəsi','number'], ['position','Mövqe adı (AZ)','text'], ['position_code','Mövqe kodu','position'], ['course','Kurs','text'], ['phone','Telefon','text'], ['student_id','Tələbə bileti №','text']
  ], columns: [['first_name','Ad'],['last_name','Soyad'],['team_id','Komanda ID-si'],['jersey_number','№'],['position_label_az','Mövqe'],['position_code','Kod'],['position_status','Təsdiq'],['course','Kurs'],['phone','Telefon'],['student_id','Tələbə bileti'],['registration_status','Qeydiyyat']] },
  matches: { title: 'Oyun təqvimi', subtitle: '24 qrup oyunu, tarixlər admin tərəfindən təyin olunur', endpoint: '/matches', fields: [
    ['home_team_id','Ev sahibi ID','text',true], ['away_team_id','Qonaq ID','text',true], ['group_id','Qrup ID-si','text',true], ['match_date','Tarix (YYYY-MM-DD)','date',true], ['kickoff_time','Saat','time'], ['venue','Stadion','text']
  ], columns: [['group_name','Qrup'],['round_number','Tur'],['home_team_id','Ev sahibi'],['away_team_id','Qonaq'],['match_date','Tarix'],['kickoff_time','Saat'],['match_status','Status']] },
  awards: { title: 'Mükafatlar', subtitle: 'Komanda və fərdi mükafatların idarə edilməsi', endpoint: '/awards', fields: [
    ['award_type','Mükafat növü','text',true], ['recipient_type','Qalibin növü (team/player)','text',true], ['recipient_id','Qalib ID-si','text',true], ['description','Təsvir','text']
  ], columns: [['award_type','Növ'],['description','Mükafat'],['recipient_id','Qalib ID-si']] },
  announcements: { title: 'Xəbərlər və elanlar', subtitle: 'Tarix və kateqoriyalara görə elan arxivi', endpoint: '/announcements', fields: [
    ['title','Başlıq','text',true], ['content','Mətn','textarea',true], ['type','Kateqoriya','text']
  ], columns: [['title','Başlıq'],['type','Kateqoriya'],['is_published','Dərc olunub'],['created_at','Tarix']] },
  documents: { title: 'Sənəd mərkəzi', subtitle: 'Turnir sənədləri və yüklənmiş fayllar', endpoint: '/documents', fields: [
    ['document_type','Sənəd növü','text',true], ['title','Sənəd adı','text',true], ['file','PDF/DOCX faylı','file',true]
  ], columns: [['title','Sənəd'],['document_type','Kateqoriya'],['generated_at','Tarix']] },
  media: { title: 'Media Studio', subtitle: 'Sosial media şablonları və dizayn arxivi', endpoint: '/media-templates', fields: [
    ['name','Şablon adı','text',true], ['category','Format/kateqoriya','text',true], ['width','En','number'], ['height','Hündürlük','number']
  ], columns: [['name','Şablon'],['category','Format'],['width','En'],['height','Hündürlük']] },
  tournaments: { title: 'Turnir parametrləri', subtitle: 'Mövsüm, format və yarış parametrləri', endpoint: '/tournaments', fields: [
    ['name','Turnirin adı','text',true], ['short_name','Qısa ad','text'], ['players_on_pitch','Meydandakı oyunçu sayı (6 və ya 11)','number'], ['substitutes_per_team','Ehtiyat oyunçu sayı','number'], ['num_groups','Qrup sayı','number'], ['teams_per_group','Qrupda komanda','number'], ['qualification_per_group','Qrupdan çıxan','number']
  ], columns: [['name','Turnir'],['status','Status'],['current_stage','Mərhələ'],['num_groups','Qruplar']] },
  seasons: { title: 'Mövsümlər', subtitle: 'Cari və arxiv mövsümlərinin idarə edilməsi', endpoint: '/seasons', fields: [
    ['name','Mövsüm adı','text',true], ['short_name','Qısa ad','text'], ['description','Təsvir','text']
  ], columns: [['name','Mövsüm'],['short_name','Qısa ad'],['is_current','Cari'],['is_archived','Arxiv']] },
  sponsors: { title: 'Sponsorlar', subtitle: 'Sponsor adları, loqoları və veb-saytları', endpoint: '/sponsors', fields: [
    ['name','Sponsor adı','text',true], ['logo_path','Loqo URL/fayl yolu','text'], ['website','Veb-sayt','text']
  ], columns: [['name','Sponsor'],['logo_path','Loqo'],['website','Veb-sayt'],['is_active','Status']] },
};

function getRows(data) { return Array.isArray(data) ? data : (data?.data || []); }
function labelValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function AdminResourcePage({ type }) {
  const cfg = config[type];
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [groups,setGroups]=useState([]);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editRow,setEditRow]=useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [showSchedule,setShowSchedule]=useState(false);
  const [schedule,setSchedule]=useState({start_date:'',first_kickoff:'13:00',matches_per_day:4,interval_minutes:90});

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [result, ts, tournaments, gs] = await Promise.all([
        api.get(cfg.endpoint),
        api.get('/teams').catch(() => ({data:[]})),
        tournamentApi.getAll().catch(() => ({data:[]})),
        api.get('/groups').catch(()=>({data:[]})),
      ]);
      setRows(getRows(result.data));
      setTeams(getRows(ts.data));
      setGroups(getRows(gs.data));
      const active = getRows(tournaments.data).find(x => x.status !== 'archived') || getRows(tournaments.data)[0] || null;
      setTournament(active);
    } catch (e) { setError(e.response?.data?.error || 'Məlumatları yükləmək mümkün olmadı.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [type]);

  const filtered = useMemo(() => rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const generateSchedule = async (e) => {
    e.preventDefault();
    try { const result=await api.post(`/tournaments/${tournament.id}/generate-schedule`,schedule); setNotice(`${result.data.updated} oyunun təqvimi yaradıldı.`); setShowSchedule(false); await load(); }
    catch(err){setError(err.response?.data?.error||'Təqvim yaradıla bilmədi.');}
  };
  const openCreate = () => { setEditRow(null);setForm(type === 'matches' && tournament ? {tournament_id:tournament.id, match_status:'scheduled'} : type === 'tournaments' ? {players_on_pitch:6,substitutes_per_team:2} : {}); setShowForm(true); };
  const openEdit = row => {setEditRow(row);const values={};cfg.fields.forEach(([key])=>{values[key]=row[key]??(type==='tournaments'&&key==='players_on_pitch'?6:type==='tournaments'&&key==='substitutes_per_team'?2:'');});setForm(values);setShowForm(true);};
  const submit = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = {...form};
      if (['announcements','documents','media','awards'].includes(type) && tournament) payload.tournament_id = tournament.id;
      if (type === 'announcements') { payload.type = payload.type || 'general'; }
      if (type === 'documents') payload.document_type = payload.document_type || 'general';
      if (type === 'media') payload.category = payload.category || 'instagram';
      if (type === 'matches' && tournament) payload.tournament_id = tournament.id;
      if (type === 'teams' && tournament) { payload.tournament_id = tournament.id; payload.season_id = tournament.season_id; }
      if (type === 'documents') {
        const formData=new FormData();
        formData.append('file',form.file);
        formData.append('title',form.title);
        formData.append('document_type',form.document_type);
        if(tournament)formData.append('tournament_id',tournament.id);
        await api.post('/documents/upload',formData,{headers:{'Content-Type':'multipart/form-data'}});
      } else if (editRow) {
        await api.put(`${cfg.endpoint}/${editRow.id}`, payload);
      } else {
        await api.post(cfg.endpoint, payload);
      }
      setShowForm(false); setEditRow(null); setForm({}); setNotice(editRow?'Məlumat yeniləndi.':'Məlumat uğurla əlavə edildi.'); await load();
    } catch (err) { setError(err.response?.data?.error || 'Yadda saxlamaq mümkün olmadı.'); }
    finally { setSaving(false); }
  };
  const downloadDocument=async row=>{try{const r=await api.get(`/documents/${row.id}/download`,{responseType:'blob'});const url=window.URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download=row.title||'sened';a.click();window.URL.revokeObjectURL(url);}catch(e){setError(e.response?.data?.error||'Sənəd endirilə bilmədi.');}};
  const publishAnnouncement = async row => {try{await api.post(`/announcements/${row.id}/publish`);setNotice('Elan ictimai saytda dərc edildi.');await load();}catch(e){setError(e.response?.data?.error||'Elan dərc edilmədi.');}};
  const updateMatch = async (row, patch) => {
    try { await api.put(`/matches/${row.id}`, patch); setNotice('Oyun məlumatı yeniləndi.'); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Oyun yenilənmədi.'); }
  };
  const uploadPlayerPhoto = async (row, file) => {
    if (!file) return;
    const body = new FormData(); body.append('photo', file);
    try { await api.put(`/players/${row.id}/photo`, body, { headers: { 'Content-Type': 'multipart/form-data' } }); setNotice('Oyunçu şəkli yeniləndi.'); await load(); }
    catch (err) { setError(err.response?.data?.error || 'Oyunçu şəklini yükləmək mümkün olmadı.'); }
  };
  const autoAwards = async()=>{if(!tournament)return;try{await api.post(`/tournaments/${tournament.id}/awards/auto`);setNotice('Komanda mükafatları turnir nəticələrinə əsasən təyin edildi.');await load();}catch(e){setError(e.response?.data?.error||'Mükafatlar təyin edilə bilmədi.');}};
  const recalc = async () => {
    if (!tournament) return;
    try { await api.post(`/tournaments/${tournament.id}/standings/recalculate`); setNotice('Turnir cədvəli yenidən hesablandı.'); }
    catch (err) { setError(err.response?.data?.error || 'Cədvəl hesablana bilmədi.'); }
  };

  if (!cfg) return <div className="empty-state">Bu bölmə tapılmadı.</div>;
  return <section className="page-shell admin-workspace kl-motion-enter">
    <div className="page-heading">
      <div><span className="eyebrow">KHAZAR LEAGUE / İDARƏETMƏ</span><h1>{cfg.title}</h1><p>{cfg.subtitle}</p></div>
      <div className="heading-actions">
         {type === 'standings' ? <button className="btn btn-primary" onClick={recalc}>Cədvəli hesabla</button> : null}
        {type === 'awards' ? <button className="btn btn-outline" onClick={autoAwards}>Komanda mükafatlarını hesabla</button> : null}
        {type === 'matches' ? <button className="btn btn-outline" onClick={()=>setShowSchedule(true)}>Təqvimi avtomatik yarat</button> : null}
        <button className="btn btn-primary" onClick={openCreate}>＋ Yeni əlavə et</button>
      </div>
    </div>
    {notice && <div className="notice success">{notice}<button onClick={()=>setNotice('')}>Bağla</button></div>}
    {error && <div className="notice error">{error}</div>}
    <div className="toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Axtarış..." /><span>{filtered.length} qeyd</span></div>
    {loading ? <div className="loading-panel">Məlumatlar yüklənir...</div> :
      filtered.length === 0 ? <div className="empty-state"><div className="empty-icon">◫</div><h3>Hələ məlumat yoxdur</h3><p>Bu bölməyə ilk məlumatı əlavə edə bilərsiniz. Mövcud olmayan məlumatlar avtomatik yaradılmır.</p><button className="btn btn-primary" onClick={openCreate}>İlk qeydi əlavə et</button></div> :
      <div className="panel table-panel"><div className="table-responsive"><table className="data-table dark-table"><thead><tr>{cfg.columns.map(([key,title])=><th key={key}>{title}</th>)}{type==='matches'&&<><th>Hesab</th><th>Tarix / saat / stadion</th></>}{type==='announcements'&&<th>Əməliyyat</th>}{['teams','players','matches','tournaments','seasons','sponsors','media'].includes(type)&&<th>Redaktə</th>}</tr></thead><tbody>
        {filtered.map((row,i)=><tr key={row.id || i}>{cfg.columns.map(([key])=><td key={key}>{type==='documents'&&key==='file_path'&&row[key]?<button className="btn btn-small" onClick={()=>downloadDocument(row)}>Endir ↗</button>:type==='teams'&&key==='logo_path'&&row[key]?<img className="table-team-logo" src={`${API_ORIGIN}${row[key]}`} alt="Komanda loqosu"/>:(['home_team_id','away_team_id','team_id'].includes(key)&&teams.find(t=>t.id===row[key])?teams.find(t=>t.id===row[key]).name:key==='group_id'&&String(row[key]).startsWith('khazar-group-')?String(row[key]).replace('khazar-group-','').toUpperCase():labelValue(row[key]))}</td>)}{type==='announcements'&&<td>{row.is_published? <span className="status-pill">Dərc edilib</span>:<button className="btn btn-small" onClick={()=>publishAnnouncement(row)}>Dərc et</button>}</td>}{type==='matches'&&<><td><div className="score-editor"><input aria-label="Ev sahibi hesabı" type="number" min="0" defaultValue={row.home_score ?? ''} id={`h-${row.id}`} /><b>:</b><input aria-label="Qonaq hesabı" type="number" min="0" defaultValue={row.away_score ?? ''} id={`a-${row.id}`} /><button className="btn btn-small" onClick={()=>{const h=document.getElementById(`h-${row.id}`).value;const a=document.getElementById(`a-${row.id}`).value;if(h===''||a===''){setError('Hər iki hesabı daxil edin.');return;}updateMatch(row,{home_score:Number(h),away_score:Number(a),match_status:'completed'});}}>Təsdiqlə</button></div></td><td><div className="schedule-editor"><input aria-label="Oyun tarixi" type="date" defaultValue={row.match_date||''} id={`d-${row.id}`}/><input aria-label="Oyun saatı" type="time" defaultValue={row.kickoff_time||''} id={`t-${row.id}`}/><input aria-label="Stadion" placeholder="Stadion" defaultValue={row.venue||''} id={`v-${row.id}`}/><button className="btn btn-small" onClick={()=>updateMatch(row,{match_date:document.getElementById(`d-${row.id}`).value||null,kickoff_time:document.getElementById(`t-${row.id}`).value||null,venue:document.getElementById(`v-${row.id}`).value||null})}>Yadda saxla</button></div></td></>}{['teams','players','matches','tournaments','seasons','sponsors','media'].includes(type)&&<td><button className="btn btn-small" onClick={()=>openEdit(row)} disabled={type==='matches'&&row.result_locked}>Redaktə</button></td>}{type==='players'&&<td><label className="btn btn-small">Şəkil yüklə<input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={e=>uploadPlayerPhoto(row,e.target.files?.[0])}/></label></td>}</tr>)}
      </tbody></table></div></div>
    }
    {showSchedule && <div className="modal-backdrop"><form className="modal-card" onSubmit={generateSchedule}><div className="modal-head"><div><span className="eyebrow">AVTOMATİK PLANLAŞDIRMA</span><h2>Həftəsonu təqvimi</h2></div><button type="button" className="icon-button" onClick={()=>setShowSchedule(false)}>×</button></div>
      <label className="field">Başlanğıc şənbə/bazar tarixi<input type="date" required value={schedule.start_date} onChange={e=>setSchedule({...schedule,start_date:e.target.value})}/></label>
      <label className="field">İlk oyunun saatı<input type="time" required value={schedule.first_kickoff} onChange={e=>setSchedule({...schedule,first_kickoff:e.target.value})}/></label>
      <label className="field">Gündəlik oyun sayı<input type="number" min="1" max="12" required value={schedule.matches_per_day} onChange={e=>setSchedule({...schedule,matches_per_day:Number(e.target.value)})}/></label>
      <label className="field">Oyunlararası interval (dəqiqə)<input type="number" min="60" max="360" required value={schedule.interval_minutes} onChange={e=>setSchedule({...schedule,interval_minutes:Number(e.target.value)})}/></label>
      <p className="field-hint">Sistem yalnız şənbə və bazar günlərini seçəcək. Tamamlanmış oyunlar dəyişdirilməyəcək.</p><div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={()=>setShowSchedule(false)}>Ləğv et</button><button className="btn btn-primary">Təqvimi yarat</button></div></form></div>}
    {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false);}}><form className="modal-card" onSubmit={submit}>
      <div className="modal-head"><div><span className="eyebrow">{editRow?'REDAKTƏ':'YENİ QEYD'}</span><h2>{cfg.title}</h2></div><button type="button" className="icon-button" onClick={()=>setShowForm(false)}>×</button></div>
      {cfg.fields.map(([key,label,inputType,required])=><label className="field" key={key}>{label}
        {inputType==='textarea' ? <textarea required={!!required} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}/> :
        inputType==='file' ? <input required={!!required} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>setForm({...form,[key]:e.target.files?.[0]||null})}/> :
        key==='players_on_pitch' ? <select required value={form[key]??6} onChange={e=>setForm({...form,[key]:Number(e.target.value)})}><option value={6}>6 n?f?r</option><option value={11}>11 n?f?r</option></select> :
        inputType==='position' ? <select value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Təsdiq gözləyir</option>{['GK','CB','RB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','CF','ST'].map(code=><option key={code} value={code}>{code}</option>)}</select> :
        ['team_id','home_team_id','away_team_id'].includes(key) ? <select required={!!required} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Komanda seçin</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select> :
        key==='group_id' ? <select required={!!required} value={form[key]||''} onChange={e=>setForm({...form,[key]:e.target.value})}><option value="">Qrup seçin</option>{groups.map(g=><option key={g.id} value={g.id}>Qrup {g.name}</option>)}</select> :
        <input required={!!required} type={inputType} value={form[key]??''} onChange={e=>setForm({...form,[key]:inputType==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value})}/>}
      </label>)}
      {type==='players' && <p className="field-hint">Şəxsi tələbə məlumatları yalnız səlahiyyətli adminlər üçün nəzərdə tutulub.</p>}
      <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Ləğv et</button><button disabled={saving} className="btn btn-primary">{saving?'Yadda saxlanılır...':'Yadda saxla'}</button></div>
    </form></div>}
  </section>;
}

export function StandingsPage() {
  const [tournament,setTournament] = useState(null), [standings,setStandings] = useState([]), [teams,setTeams] = useState([]), [groups,setGroups] = useState([]);
  useEffect(()=>{(async()=>{try{const [tr,tm,gr]=await Promise.all([tournamentApi.getAll(),api.get('/teams'),api.get('/groups')]);const t=(tr.data||[]).find(x=>x.status!=='archived')||(tr.data||[])[0];setTournament(t);setTeams(tm.data||[]);setGroups(gr.data||[]);if(t){const st=await api.get(`/tournaments/${t.id}/standings`);setStandings(st.data||[]);}}catch(e){console.error(e);}})();},[]);
  return <section className="page-shell admin-workspace kl-motion-enter"><div className="page-heading"><div><span className="eyebrow">TURNİR STATİSTİKASI</span><h1>Qrup cədvəlləri</h1><p>Yalnız təsdiqlənmiş nəticələr xallara təsir edir.</p></div></div>
  {groups.filter(g=>!tournament||g.tournament_id===tournament.id).map(g=>{const list=teams.filter(t=>t.group_id===g.id);return <div className="panel group-panel" key={g.id}><h2>Qrup {g.name}</h2><div className="table-responsive"><table className="data-table dark-table"><thead><tr><th>#</th><th>Komanda</th><th>O</th><th>Q</th><th>H</th><th>M</th><th>TF</th><th>X</th></tr></thead><tbody>{list.map((t,i)=>{const st=standings.find(s=>s.team_id===t.id)||{};return <tr key={t.id}><td>{st.position||i+1}</td><td>{t.name}</td><td>{st.played||0}</td><td>{st.won||0}</td><td>{st.drawn||0}</td><td>{st.lost||0}</td><td>{st.goal_difference||0}</td><td><b>{st.points||0}</b></td></tr>})}</tbody></table></div></div>})}
  </section>;
}
