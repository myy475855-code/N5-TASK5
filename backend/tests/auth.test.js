import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import {validatePassword,validateEmail,signAccess,verifyAccess} from '../src/auth.js';

test('email validation',()=>{assert.equal(validateEmail('user@example.com'),true);assert.equal(validateEmail('bad'),false)});
test('password policy',()=>{assert.equal(validatePassword('Strong@123'),true);assert.equal(validatePassword('weakpass'),false)});
test('access token expires and is rejected',()=>{const t=jwt.sign({sub:1,role:'student'},'test',{expiresIn:'1ms'});return new Promise(r=>setTimeout(r,10)).then(()=>assert.throws(()=>jwt.verify(t,'test'),/jwt expired/))});
test('access token contains identity claims',()=>{const old=process.env.JWT_ACCESS_SECRET;process.env.JWT_ACCESS_SECRET='unit-secret';const t=signAccess({id:7,role:'company',email:'c@example.com',name:'Company'});const p=verifyAccess(t);assert.equal(p.sub,7);assert.equal(p.role,'company');process.env.JWT_ACCESS_SECRET=old});
