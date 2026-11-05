import { useState } from 'react';
import { playerPositionImportApi } from '../../services/api';
import './AdminPages.css';

export function PlayerPositionImportPage() {
  const [file, setFile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState(null);
  const chooseFile = (next) => { setFile(next); setValidation(null); setResult(null); setError(''); setDiagnostics(null); };
  const validate = async () => {
    if (!file) return;
    setBusy(true); setError(''); setResult(null); setDiagnostics(null);
    try { const response = await playerPositionImportApi.validate(file); setValidation(response.data); }
    catch (e) {
      setValidation(null);
      setError(e.response?.data?.error || 'Fayl yoxlanarkən xəta baş verdi.');
      setDiagnostics(e.response?.data || null);
    }
    finally { setBusy(false); }
  };
  const apply = async () => {
    if (!file || !validation?.summary) return;
    if (!window.confirm('128 oyunçunun mövqeləri tətbiq edilsin? Əməliyyatdan əvvəl avtomatik backup yaradılacaq.')) return;
    setBusy(true); setError('');
    try { const response = await playerPositionImportApi.apply(file); setResult(response.data); setValidation(null); }
    catch (e) { setError(e.response?.data?.error || 'Import zamanı xəta baş verdi.'); }
    finally { setBusy(false); }
  };
  return <section className="admin-page">
    <div className="page-header"><div><span className="eyebrow">OYUNÇU BAZASI</span><h1>Mövqelərin toplu təsdiqi</h1><p>128 oyunçunun ilkin mövqelərini JSON faylı ilə yoxlayın və bazaya tətbiq edin.</p></div></div>
    <div className="admin-card" style={{maxWidth:900,padding:24}}>
      <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:18}}><span style={{fontSize:26}}>◎</span><div><h2 style={{margin:0}}>Mövqe təsdiqi faylı</h2><p style={{margin:'4px 0 0',opacity:.7}}>Khazar League mövqe təsdiqi JSON faylı (16 komanda, 128 oyunçu).</p></div></div>
      <label style={{display:'block',fontWeight:600,marginBottom:8}}>JSON faylını seçin</label>
      <input type="file" accept=".json,application/json" onChange={e=>chooseFile(e.target.files?.[0]||null)} style={{display:'block',width:'100%',padding:14,border:'1px dashed var(--border-color, #555)',borderRadius:12,marginBottom:16}} />
      {file && <p style={{fontSize:13,opacity:.75}}>Seçilmiş fayl: <b>{file.name}</b> · {(file.size/1024).toFixed(1)} KB</p>}
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="primary-btn" onClick={validate} disabled={!file||busy}>{busy?'Yoxlanılır…':'1. Faylı yoxla'}</button>
        <button className="secondary-btn" onClick={apply} disabled={!validation?.summary||busy}>2. Təsdiqləri tətbiq et</button>
      </div>
      {error && <div role="alert" style={{marginTop:16,padding:14,borderRadius:10,background:'rgba(220,60,60,.12)',color:'#ff8a8a'}}>
        <strong>{error}</strong>
        {diagnostics && <div style={{marginTop:10,color:'inherit'}}>
          {Number.isFinite(diagnostics.matched) && <p style={{margin:'6px 0'}}>Uyğunlaşdırılan: <b>{diagnostics.matched}/{diagnostics.expected || 128}</b></p>}
          {diagnostics.hint && <p style={{margin:'6px 0'}}>{diagnostics.hint}</p>}
          {Array.isArray(diagnostics.errors) && diagnostics.errors.length > 0 && <details open>
            <summary>Xəta siyahısı ({diagnostics.errorCount || diagnostics.errors.length})</summary>
            <ul style={{maxHeight:260,overflowY:'auto',paddingLeft:22}}>
              {diagnostics.errors.map((item,index)=><li key={`${index}-${item}`} style={{margin:'5px 0'}}>{item}</li>)}
            </ul>
          </details>}
        </div>}
      </div>}
      {validation?.summary && <div style={{marginTop:20,padding:18,borderRadius:12,background:'rgba(30,160,110,.10)',border:'1px solid rgba(30,160,110,.3)'}}>
        <h3 style={{marginTop:0}}>Yoxlama uğurludur</h3>
        <div style={{display:'flex',gap:28,flexWrap:'wrap'}}><div><strong style={{fontSize:26}}>{validation.summary.teams}</strong><div>Komanda</div></div><div><strong style={{fontSize:26}}>{validation.summary.players}</strong><div>Uyğunlaşdırılan oyunçu</div></div><div><strong style={{fontSize:26}}>{validation.summary.provisional}</strong><div>İlkin / dəyişdirilə bilən mövqe</div></div></div>
        <p>{validation.message}</p>
        <details><summary>Mövqe bölgüsünə bax</summary><ul>{Object.entries(validation.summary.positionCounts).sort((a,b)=>a[0].localeCompare(b[0])).map(([code,count])=><li key={code}>{code}: {count} oyunçu</li>)}</ul></details>
        <p style={{fontSize:13,opacity:.75}}>Tətbiq zamanı mövcud oyunçu qeydləri silinməyəcək. Hər oyunçunun mövqe sahələri yenilənəcək və əvvəlki baza üçün backup yaradılacaq.</p>
      </div>}
      {result?.applied && <div style={{marginTop:20,padding:18,borderRadius:12,background:'rgba(30,160,110,.12)'}}><h3 style={{marginTop:0}}>Mövqelər tətbiq edildi</h3><p>{result.message}</p><p>{result.summary.players} oyunçu · {result.summary.teams} komanda</p><small>Backup: {result.backup}</small></div>}
    </div>
  </section>;
}
