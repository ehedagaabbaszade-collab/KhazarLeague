import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const {login}=useAuth(); const navigate=useNavigate();
  const submit=async e=>{e.preventDefault();setError('');setLoading(true);try{const result=await login(email,password);const role=result.user?.role;if(role==='team_captain')navigate('/captain');else if(role==='player')navigate('/player');else navigate('/admin/dashboard');}catch(err){setError(err.response?.data?.error||'Giriş məlumatları düzgün deyil.');}finally{setLoading(false);}};
  return <main className="login-page"><div className="login-card"><Link to="/" className="brand"><span className="brand-mark">KL</span><span>KHAZAR <b>LEAGUE</b></span></Link><span className="eyebrow">TƏHLÜKƏSİZ GİRİŞ</span><h1>Hesabınıza daxil olun</h1><p>Admin, komanda kapitanı və oyunçu hesabları üçün.</p>{error&&<div className="notice error">{error}</div>}<form onSubmit={submit}><label className="field">E-poçt<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required placeholder="email@example.com"/></label><label className="field">Şifrə<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required placeholder="Şifrəniz"/></label><button className="btn btn-primary login-submit" disabled={loading}>{loading?'Yoxlanılır...':'Daxil ol'}</button></form><Link to="/" className="back-link">← İctimai sayta qayıt</Link></div></main>;
}
