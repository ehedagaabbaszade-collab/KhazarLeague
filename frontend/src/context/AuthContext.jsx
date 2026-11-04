import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
 const [user,setUser]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{const token=localStorage.getItem('khazar_session');const saved=localStorage.getItem('khazar_user');if(token&&saved){try{setUser(JSON.parse(saved));}catch{localStorage.removeItem('khazar_session');localStorage.removeItem('khazar_user');}}setLoading(false);},[]);
 const login=async(email,password)=>{const r=await authApi.login(email,password);localStorage.setItem('khazar_session',r.data.sessionId);localStorage.setItem('khazar_user',JSON.stringify(r.data.user));setUser(r.data.user);return r.data;};
 const logout=()=>{authApi.logout().catch(()=>{});localStorage.removeItem('khazar_session');localStorage.removeItem('khazar_user');setUser(null);};
 const role=user?.role;
 return <AuthContext.Provider value={{user,login,logout,isAuthenticated:!!user,isAdmin:role==='super_admin',isCaptain:false,isPlayer:false,isReferee:false,isMedia:false,loading}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used within AuthProvider');return value;}
