# 🔐 My-Vault

A **zero-knowledge password manager** where the server never sees your master key or plaintext secrets. Your vault is encrypted in the browser with AES-256-GCM; the backend only ever stores ciphertext, nonces, and a wrapped data-encryption key (DEK).

- **Master-key only** — no email, no account recovery. Your key *is* your identity.
- **Argon2id KDF** — derives the key-encryption key (KEK) and an auth verifier client-side.
- **AES-256-GCM** — every credential is encrypted with the DEK, bound with authenticated associated data (AAD).
- **Optimistic concurrency** — every credential carries a `recordVersion`; stale writes get a `409`.
- **Session-scoped** — the DEK lives in browser memory only, auto-locks on inactivity.
- **Professional SaaS UI** — a polished, responsive React frontend.

---

## Architecture

```
Browser (React + WebCrypto)                Server (Express 5 + Prisma)
──────────────────────────────            ─────────────────────────────
master key ──Argon2id──► KEK + verifier
KEK ──AES-GCM──► wraps DEK                 stores: salt, wrapped DEK, nonce,
auth verifier ────────────────────────────► verifier hash (argon2)
DEK ──AES-GCM──► ciphertext + nonce ──────► ciphertext rows + recordVersion
```

**The server never receives the master key, the KEK, or the DEK.** Setup sends only the public salt, the wrapped DEK, the wrap nonce, and the auth verifier. Unlock sends only the auth verifier to prove key possession; decryption of the DEK happens locally.

---

## Tech Stack

| Layer     | Technology |
|-----------|-----------|
| Frontend  | React 19, Vite, Tailwind CSS v4, react-router-dom, lucide-react, hash-wasm, WebCrypto |
| Backend   | Node.js 24, Express 5, TypeScript, Zod, Helmet, express-rate-limit |
| Database  | PostgreSQL (Neon-compatible) via Prisma ORM |
| Crypto    | Argon2id (hash-wasm), AES-256-GCM (WebCrypto), argon2 (server verifier hash) |

---

## Project Structure

```
My-Vault/
├── backend/
│   ├── prisma/schema.prisma        # Vault, Credential, Session, AuditLog
│   ├── scripts/
│   │   └── generate-test-verifier.js  # produce a valid authVerifier + envelope
│   └── src/
│       ├── config/                 # env validation, prisma client
│       ├── common/                 # errors, utils, middleware
│       ├── modules/
│       │   ├── session/            # session repo + service
│       │   ├── audit/              # audit logging
│       │   ├── vault/              # setup / unlock / lock / key-envelope
│       │   └── credentials/        # CRUD with optimistic concurrency
│       ├── app.ts                  # express app + middleware chain
│       └── server.ts               # bootstrap
├── frontend/
│   └── src/
│       ├── crypto/                 # encoding, argon2, aes, vaultKey
│       ├── services/               # api, vaultApi, credentialApi
│       ├── contexts/               # VaultContext (DEK in memory)
│       ├── components/ui/          # Button, Input, Card, Dialog, Toast…
│       ├── features/credentials/   # form dialog + row
│       ├── layouts/                # MarketingLayout, AppLayout
│       └── pages/                  # Landing, Setup, Unlock, Dashboard
├── Documentations/
│   └── Application documentation.txt
├── My-Vault.postman_collection.json
└── README.md
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js **≥ 20** (tested on 24)
- A PostgreSQL database (local or [Neon](https://neon.tech) free tier)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit .env (see below)
npx prisma generate
npx prisma db push
npm run dev               # http://localhost:5000
```

Required `.env` values:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/my_vault
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=<64-byte hex>
SESSION_DURATION_MINUTES=30
COOKIE_NAME=my_vault_session
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict
TEST_MODE=true
TEST_API_KEY=test_sk_<random hex>
```

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.examaple .env     # then edit .env
npm run dev               # http://localhost:5173
```

`frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=My-Vault
VITE_GITHUB_URL=https://github.com/
VITE_TEST_API_KEY=test_sk_<same as backend TEST_API_KEY>
```

> ⚠️ The frontend must run on the port listed in the backend's `CLIENT_ORIGIN` (default `5173`) or CORS will block requests.

### 4. First use

Open **http://localhost:5173**. With no vault present you'll be redirected to `/setup`. Choose a strong master key — **it cannot be recovered**. After setup you land on the dashboard where you can add, reveal, copy, edit and delete credentials.

---

## API Reference

Base URL: `/api/v1`

| Method | Path                     | Auth     | Description |
|--------|--------------------------|----------|-------------|
| GET    | `/health`                | —        | Liveness probe |
| GET    | `/vault/metadata`        | —        | Public KDF + wrapped-key envelope (404 if no vault) |
| POST   | `/vault/setup`           | —        | Create the vault (409 if exists) |
| POST   | `/vault/unlock`          | verifier | Prove key possession, start session |
| POST   | `/vault/lock`            | session  | Destroy the session |
| PUT    | `/vault/key-envelope`    | session  | Rotate the wrapped DEK |
| GET    | `/csrf`                  | session  | Fetch a CSRF token |
| GET    | `/credentials`           | session  | List credentials (ciphertext) |
| POST   | `/credentials`           | session  | Create a credential |
| GET    | `/credentials/:id`       | session  | Fetch one credential |
| PUT    | `/credentials/:id`       | session  | Update (requires `expectedRecordVersion`) |
| DELETE | `/credentials/:id`       | session  | Delete a credential |

### Optimistic concurrency

`PUT /credentials/:id` requires `expectedRecordVersion`. If it doesn't match the stored `recordVersion`, the server responds `409 STALE_RECORD` and the client must refetch before retrying.

---

## Testing with Postman

A ready-to-run collection ships at the repo root: **`My-Vault.postman_collection.json`**.

### Out-of-the-box
A vault has already been provisioned on the dev database using the values baked into the collection variables, so you can run requests in order immediately:

1. Import `My-Vault.postman_collection.json`.
2. Confirm `testApiKey` matches `backend/.env`.
3. Run **00 Health → 01 Metadata → 03 Unlock → 05 Create → 06 List → 07 Get → 08 Update → 09 Delete → 10 Lock**.

> With `TEST_MODE=true`, the `X-Test-API-Key` header bypasses CSRF and relaxes rate limits. Request `02 Setup` returns `409` because a vault already exists — this is expected.

### From a fresh database
1. Clear the vault (drop the row) or point `DATABASE_URL` at a new database.
2. In `backend/`, run:
   ```bash
   node scripts/generate-test-verifier.js
   ```
3. Copy the printed `authVerifier`, `salt`, `wrappedVaultKey` and `keyNonce` into the collection variables.
4. Run **02 Setup** (expect `201` + `csrfToken`), then the remaining requests.

---

## Production Deployment

1. Set `NODE_ENV=production`, `COOKIE_SECURE=true`, `TEST_MODE=false`, and remove `TEST_API_KEY`.
2. Build both apps:
   ```bash
   cd backend  && npm run build && npm start
   cd frontend && npm run build            # outputs dist/
   ```
3. Serve `frontend/dist` from any static host / CDN and set `CLIENT_ORIGIN` to its public URL.
4. Run `npx prisma migrate deploy` against the production database.
5. Terminate TLS in front of the API — the master key protects data at rest, but TLS protects the session in transit.

---

## Security Notes

- The master key, KEK and DEK **never leave the browser** except as a wrapped (encrypted) DEK.
- The wrapped DEK is bound to the public salt via AES-GCM AAD, so an envelope cannot be swapped between vaults.
- Each credential is encrypted with AAD binding `vaultId + credentialId + version` — ciphertext is not portable.
- Sessions store only a hash of the token; the raw token lives in an HttpOnly, SameSite=Strict cookie.
- The DEK is held in memory only and dropped on lock or inactivity auto-lock.
- **There is no password reset.** Lose the master key, lose the vault — by design.

---

## License

MIT
