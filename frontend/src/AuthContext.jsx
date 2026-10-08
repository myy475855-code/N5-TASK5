import {createContext,useContext,useEffect,useState} from 'react';
import {api,tokenStore} from './api';
const AuthContext=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{api.request('/auth/refresh',{method:'POST'}).then(r=>{if(r.ok){tokenStore.set(r.body.data.accessToken);setUser(r.body.data.user)}}).finally(()=>setLoading(false))},[]);
 const login=async(email,password)=>{const r=await api.request('/auth/login',{method:'POST',body:JSON.stringify({email,password})});if(r.ok){tokenStore.set(r.body.data.accessToken);setUser(r.body.data.user)}return r};
 const register=async(data)=>{const r=await api.request('/auth/register',{method:'POST',body:JSON.stringify(data)});if(r.ok){tokenStore.set(r.body.data.accessToken);setUser(r.body.data.user)}return r};
 const logout=async()=>{await api.request('/auth/logout',{method:'POST'},false);tokenStore.clear();setUser(null)};
 return <AuthContext.Provider value={{user,loading,login,register,logout}}>{children}</AuthContext.Provider>}
export const useAuth=()=>useContext(AuthContext);
