import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  {path:'/admin/audit-logs',label:'Audit jurnalı',icon:'◷',roles:['super_admin']},
  {path:'/admin/team-lineups',label:'Komanda heyətləri',icon:'⚽',roles:['super_admin']},
  {path:'/admin/lineups',label:'Matç heyətləri',icon:'◉',roles:['super_admin','tournament_admin','match_official']},
  {path:'/admin/dashboard',label:'İcmal',icon:'▦',roles:['super_admin','tournament_admin']},
  {path:'/admin/tournaments',label:'Turnir',icon:'◇',roles:['super_admin','tournament_admin']},
  {path:'/admin/seasons',label:'Mövsümlər',icon:'◷',roles:['super_admin','tournament_admin']},
  {path:'/admin/teams',label:'Komandalar',icon:'▦',roles:['super_admin','tournament_admin']},
  {path:'/admin/players',label:'Oyunçular',icon:'◉',roles:['super_admin','tournament_admin']},
  {path:'/admin/player-positions',label:'Mövqe təsdiqi',icon:'✓',roles:['super_admin']},
  {path:'/admin/matches',label:'Oyun təqvimi',icon:'◎',roles:['super_admin','tournament_admin','match_official']},
  {path:'/admin/standings',label:'Qrup cədvəlləri',icon:'▤',roles:['super_admin','tournament_admin']},
  {path:'/admin/knockout',label:'Pley-off',icon:'◇',roles:['super_admin','tournament_admin']},
  {path:'/admin/awards',label:'Mükafatlar',icon:'✧',roles:['super_admin','tournament_admin']},
  {path:'/admin/announcements',label:'Xəbərlər və elanlar',icon:'◉',roles:['super_admin','tournament_admin','media_manager']},
  {path:'/admin/documents',label:'Sənədlər',icon:'▧',roles:['super_admin','tournament_admin']},
  {path:'/admin/media',label:'Media Studio',icon:'▣',roles:['super_admin','media_manager']},
  {path:'/admin/media-templates',label:'Media şablonları',icon:'▧',roles:['super_admin','media_manager']},
  {path:'/admin/sponsors',label:'Sponsorlar',icon:'✧',roles:['super_admin','tournament_admin']},
  {path:'/admin/settings',label:'Parametrlər',icon:'⚙',roles:['super_admin']}
];
export function Sidebar(){
 const {user,logout}=useAuth(); const navigate=useNavigate();
 const items=navItems.filter(x=>x.roles.includes('super_admin') && user?.role==='super_admin');
 return <aside className="sidebar"><div className="sidebar-header"><div className="brand"><span className="brand-mark">KL</span><span>KHAZAR <b>LEAGUE</b></span></div><small>TURNİR İDARƏETMƏSİ</small></div>
 <nav className="sidebar-nav"><span className="nav-caption">İDARƏETMƏ</span>{items.map(x=><NavLink key={x.path} to={x.path} className={({isActive})=>`nav-link ${isActive?'active':''}`}><span className="nav-icon">{x.icon}</span><span>{x.label}</span></NavLink>)}</nav>
 <div className="sidebar-footer"><div className="user-info"><div className="user-avatar">{user?.full_name?.slice(0,1)||'A'}</div><div className="user-details"><span className="user-name">{user?.full_name||'Admin'}</span><span className="user-role">{user?.role==='super_admin'?'Super Admin':user?.role}</span></div></div><button className="logout-btn" onClick={()=>{logout();navigate('/login')}}>↪ Çıxış</button><a className="public-link" href="/">İctimai sayta keç ↗</a></div></aside>
}
