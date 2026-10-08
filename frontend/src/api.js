const API=import.meta.env.VITE_API_URL||'http://localhost:5000/api';
let accessToken=null;
export const tokenStore={get:()=>accessToken,set:t=>{accessToken=t},clear:()=>{accessToken=null}};
async function request(path,options={},retry=true){
 const headers={'Content-Type':'application/json',...(options.headers||{})};if(accessToken)headers.Authorization=`Bearer ${accessToken}`;
 const res=await fetch(`${API}${path}`,{...options,headers,credentials:'include'});let body={};try{body=await res.json()}catch{}
 if(res.status===401&&retry&&path!=='/auth/refresh'&&path!=='/auth/login'&&path!=='/auth/register'){const refreshed=await request('/auth/refresh',{method:'POST'},false);if(refreshed.ok){accessToken=refreshed.body.data.accessToken;return request(path,options,false)}}
 return {ok:res.ok,status:res.status,body};
}
export const api={request};
