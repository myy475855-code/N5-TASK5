import {Router} from 'express';
import {db} from './db.js';
import {hashPassword,verifyPassword,validatePassword,validateEmail,signAccess,issueRefresh,verifyRefresh,revokeRefresh} from './auth.js';
import {authMiddleware} from './middleware.js';
const router=Router();
const cookieOpts={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/auth'};
const publicUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role,createdAt:u.created_at});
function issue(res,u){const accessToken=signAccess(u);const refresh=issueRefresh(u.id);res.cookie('refreshToken',refresh,{...cookieOpts,maxAge:Number(process.env.REFRESH_TOKEN_TTL_DAYS||7)*86400000});return accessToken;}
router.post('/register',async(req,res,next)=>{try{
 const {name,email,password,role}=req.body||{};
 if(!name?.trim()||!validateEmail(email||'')||!['student','company'].includes(role)||!validatePassword(password)) return res.status(400).json({success:false,error:{code:'VALIDATION_ERROR',message:'Name, valid email, role and a strong password are required. Password must be 8+ characters with uppercase, lowercase, number and special character.'}});
 if(db.prepare('SELECT id FROM users WHERE email=?').get(email.trim().toLowerCase())) return res.status(409).json({success:false,error:{code:'EMAIL_EXISTS',message:'Email is already registered'}});
 const hash=await hashPassword(password);const info=db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name.trim(),email.trim().toLowerCase(),hash,role);const u=db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);const accessToken=issue(res,u);res.status(201).json({success:true,data:{user:publicUser(u),accessToken}});
 }catch(e){next(e)}});
router.post('/login',async(req,res,next)=>{try{const {email,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE email=?').get((email||'').trim().toLowerCase());if(!u||!(await verifyPassword(password||'',u.password_hash)))return res.status(401).json({success:false,error:{code:'INVALID_CREDENTIALS',message:'Invalid email or password'}});const accessToken=issue(res,u);res.json({success:true,data:{user:publicUser(u),accessToken}})}catch(e){next(e)}});
router.post('/refresh',(req,res)=>{const raw=req.cookies.refreshToken;const row=raw&&verifyRefresh(raw);if(!row)return res.status(401).json({success:false,error:{code:'REFRESH_INVALID',message:'Refresh token is invalid or expired'}});revokeRefresh(raw);const u=db.prepare('SELECT * FROM users WHERE id=?').get(row.user_id);const accessToken=issue(res,u);res.json({success:true,data:{user:publicUser(u),accessToken}})});
router.post('/logout',(req,res)=>{const raw=req.cookies.refreshToken;if(raw)revokeRefresh(raw);res.clearCookie('refreshToken',{...cookieOpts,maxAge:undefined});res.json({success:true,data:{message:'Logged out successfully'}})});
router.get('/me',authMiddleware,(req,res)=>{const u=db.prepare('SELECT * FROM users WHERE id=?').get(req.user.sub);if(!u)return res.status(401).json({success:false,error:{code:'USER_NOT_FOUND',message:'User no longer exists'}});res.json({success:true,data:{user:publicUser(u)}})});
router.get('/protected',authMiddleware,(req,res)=>res.json({success:true,data:{message:'Protected route reached',user:req.user}}));
export default router;
