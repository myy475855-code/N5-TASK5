# TalentBridge — Authentication Task

A complete reference implementation for TalentBridge authentication using Express, SQLite, bcrypt, JWT, httpOnly cookies and React Context.

## Features
- Student and company registration/login
- bcrypt password hashing (cost factor 12)
- Short-lived JWT access token (default 15 minutes)
- Cryptographically random refresh token stored only as a SHA-256 hash in SQLite
- Refresh token in an `httpOnly`, `secure` production, `SameSite=Strict` cookie
- Server-side refresh-token revocation on logout
- Access-token middleware and role information in `req.user`
- Centralized 401 error codes: `AUTH_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID`, `REFRESH_INVALID`
- React `AuthContext`, silent refresh, `ProtectedRoute`, redirect-back behavior
- Client and server password/email validation
- No password or password hash is returned to clients
- Automated tests for password policy, email validation, JWT claims and expiry

## Run

Requirements: Node.js 20+.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000/api/health

For production, replace both JWT secrets with long random values and run behind HTTPS. `Secure` is automatically enabled for the refresh cookie when `NODE_ENV=production`.

## API

- `POST /api/auth/register` — `{name,email,password,role}`
- `POST /api/auth/login` — `{email,password}`
- `POST /api/auth/refresh` — refresh cookie required
- `POST /api/auth/logout` — revokes refresh token server-side and clears cookie
- `GET /api/auth/me` — Bearer access token required
- `GET /api/auth/protected` — demonstration protected route

All responses use `{success:true,data:...}` or `{success:false,error:{code,message}}`.

## Authentication vs Authorization
Authentication answers “Who are you?” The login flow verifies credentials and establishes an authenticated identity. Authorization answers “What are you allowed to do?” TalentBridge stores a `student` or `company` role and can use that role to protect role-specific routes.

## Access token vs refresh token
The access token is short-lived and is sent in the `Authorization: Bearer` header to protected API routes. The refresh token lives longer and is used only to obtain a new access token. Keeping access tokens short-lived limits the damage if one leaks.

## Token flow (10+ lines)
1. A student or company submits registration details.
2. The server validates the email, role and password policy.
3. The password is hashed with bcrypt before it is written to the database.
4. On login, bcrypt compares the supplied password with the stored hash.
5. The server signs a short-lived JWT containing the user's identity and role.
6. The server generates a cryptographically random refresh token.
7. Only a SHA-256 hash of the refresh token is stored in the database.
8. The raw refresh token is placed in an httpOnly SameSite cookie.
9. The frontend keeps the access token in memory rather than localStorage.
10. Protected API calls send the access token in an Authorization header.
11. Middleware verifies the signature and expiration and attaches the decoded identity to `req.user`.
12. If the access token expires, the frontend calls `/auth/refresh`.
13. The server checks that the refresh token exists, is not revoked and has not expired.
14. The old refresh token is revoked and a new refresh token/access token pair is issued.
15. Logout revokes the refresh token server-side and clears the browser cookie.

## Sequence diagram

```text
Browser -> POST /auth/login -> API -> bcrypt -> Database
Browser <- access JWT + httpOnly refresh cookie <- API
Browser -> protected request + Bearer JWT -> Auth Middleware
Auth Middleware -> verify signature/expiry -> Protected Route
Browser -> POST /auth/refresh + cookie -> API -> refresh_tokens
Browser <- new access JWT + rotated refresh cookie <- API
Browser -> POST /auth/logout + cookie -> API -> revoke token
Browser <- cleared cookie <- API
```

## Why httpOnly cookies for refresh tokens?
A refresh token is a high-value long-lived credential. An httpOnly cookie prevents normal JavaScript from reading it, reducing direct token theft through many XSS scenarios. `Secure` keeps it on HTTPS in production and `SameSite=Strict` reduces cross-site request risks. The trade-off is that cookies are automatically attached by the browser, so CSRF protections and correct SameSite/Origin configuration matter. This project keeps the cookie scoped to `/api/auth` and uses SameSite Strict.

## Stateless vs stateful sessions
The access JWT is stateless: the API can validate its signature and expiry without looking up a session record. Refresh authentication is intentionally stateful: the server stores a hash of each refresh token so logout and revocation work server-side. This hybrid approach keeps normal API requests fast while retaining refresh-token control.

## OWASP Authentication Cheat Sheet — 3 applied rules
1. **Never store plaintext passwords:** passwords are hashed with bcrypt before database storage.
2. **Use secure session/token handling:** refresh credentials use an httpOnly, Secure production cookie rather than localStorage.
3. **Enforce authentication failures safely:** invalid credentials return a generic message, while expired/invalid access tokens receive machine-readable 401 error codes.

## Security notes
- Passwords are never logged, returned, or stored in plaintext.
- Password policy: minimum 8 characters, at least one uppercase, lowercase, number and special character.
- Refresh tokens are opaque random values, not JWTs, and are hashed at rest.
- Logout revokes the stored refresh token rather than only deleting browser state.
- Access tokens expire and are tested for rejection after expiry.

## Tests
```bash
npm --prefix backend test
```
