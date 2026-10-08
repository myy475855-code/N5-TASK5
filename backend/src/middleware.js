import {verifyAccess} from './auth.js';
export function authMiddleware(req,res,next){
 const header=req.get('Authorization')||'';
 const token=header.startsWith('Bearer ')?header.slice(7):null;
 if(!token) return res.status(401).json({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required'}});
 try{req.user=verifyAccess(token);next();}
 catch(err){
  const code=err.name==='TokenExpiredError'?'TOKEN_EXPIRED':'TOKEN_INVALID';
  return res.status(401).json({success:false,error:{code,message:'Access token is invalid or expired'}});
 }
}
export function requireRole(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({success:false,error:{code:'FORBIDDEN',message:'You do not have permission'}});}
