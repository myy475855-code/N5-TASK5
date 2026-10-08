import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import {db, hashToken} from './db.js';

const ACCESS_TTL=process.env.ACCESS_TOKEN_TTL||'15m';
const REFRESH_DAYS=Number(process.env.REFRESH_TOKEN_TTL_DAYS||7);
const accessSecret=process.env.JWT_ACCESS_SECRET||'dev-access-secret-change-me';
const refreshSecret=process.env.JWT_REFRESH_SECRET||'dev-refresh-secret-change-me';

export function signAccess(user){return jwt.sign({sub:user.id,role:user.role,email:user.email,name:user.name},accessSecret,{expiresIn:ACCESS_TTL});}
export function verifyAccess(token){return jwt.verify(token,accessSecret);}
export function issueRefresh(userId){
 const raw=crypto.randomBytes(48).toString('base64url');
 const expires=new Date(Date.now()+REFRESH_DAYS*86400000).toISOString();
 db.prepare('INSERT INTO refresh_tokens(user_id,token_hash,expires_at) VALUES(?,?,?)').run(userId,hashToken(raw),expires);
 return raw;
}
export function verifyRefresh(raw){
 const row=db.prepare('SELECT * FROM refresh_tokens WHERE token_hash=? AND revoked_at IS NULL').get(hashToken(raw));
 if(!row || new Date(row.expires_at)<=new Date()) return null;
 return row;
}
export function revokeRefresh(raw){db.prepare('UPDATE refresh_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE token_hash=? AND revoked_at IS NULL').run(hashToken(raw));}
export async function hashPassword(password){return bcrypt.hash(password,12);}
export async function verifyPassword(password,hash){return bcrypt.compare(password,hash);}
export function validatePassword(p){return typeof p==='string' && p.length>=8 && /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);}
export function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}
