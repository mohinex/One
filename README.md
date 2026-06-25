# Eurosia One — Next-Generation AI Operating System REST API Backend

Eurosia One is a high-performance, fully working, and production-ready REST API and real-time state engine backend built for corporate AI workflows.

---

## 🚀 Key Architectural Modules

1. **Authentication & Session Security**:
   - Standard registration + JWT session generation.
   - Speech TOTP Multi-factor validation (MFA) with speakeasy.
   - Rotated bearer refresh tokens, automatic blacklist invalidations, and active user verification checks cached in Redis (with 60-second evictions).
   - OAuth 2.0 Google sign-ins.

2. **User Profiles & Usage Tracking**:
   - JWT authorized route profiles updating.
   - Detailed user usage accounts returning real-time big-integer tracking matrices (conversations count, image files count, S3 bucket footprints) relative to subscribed plan features.

3. **High-Fidelity Chats Engine**:
   - Advanced conversations, pinning, and cascading deletion filters.
   - Dynamic prompt generation linked with OpenAI (GPT-4o, o1) and Anthropic (Claude 3.5 Sonnet) services.
   - Server-Sent Events (SSE) streaming with active feedback.

4. **Media Multipart Uploads**:
   - Content upload limits validating jpeg, webp, and pdf assets.
   - Sharp processing extracting visual dimensions.
   - AWS S3 or Cloudflare R2 integrations with local file storage fallbacks on missing credentials.

5. **Settings, Campaigns & Notifications**:
   - Masked key updates, automatically encrypting keys securely using AES-256 block-size cryptography.
   - Active alerting campaign banners and system-wide push notifications.

6. **SaaS Billing & Stripe webhooks**:
   - Subscriptions checkout mapping automatically linking checking status (`ACTIVE`, `CANCELED`, `PAST_DUE`) with Stripe.

7. **Core Real-time websocket & background task engines (Socket.IO + BullMQ)**:
   - Redis task workers processing newsletters, verifications, and expirations.
   - Namespace-authorized Socket.IO notifications.

---

## 🛠️ Stack Specifications

- **Runtime**: Node.js 20 + TypeScript 5
- **Engine Framework**: Express 4.18
- **ORM & Database**: Prisma 5 + PostgreSQL 16
- **Cache & Task Orchestrator**: Redis 7 (ioredis) + BullMQ 4
- **Real-Time Websockets**: Socket.io 4
- **Security Checkpoints**: JWT (`jsonwebtoken`), Bcrypt, CORS, Helmet, Rate-Limiters
- **APIs Documenter**: Swagger UI Express + OpenAPI 3.0
- **Automated Tests**: Jest + Supertest

---

## 🏃 Setup & Launch Directives

### 1. Environment Configurations
Clone `/.env.example` into a local `/.env` and complete variables credentials:
```bash
cp .env.example .env
```

### 2. Standalone Service Booting (Docker Compose)
Launch all platform elements (PostgreSQL Database, Redis Server, Eurosia REST API) with linked volumes:
```bash
docker-compose up --build -d
```

### 3. Database Migration and Seeding

#### 📱 Development Workflow (SQLite)
By default, Eurosia One is pre-configured with SQLite for instant, zero-config local development (`file:./dev.db`).
To prepare the database and seed initial tiers & the super-admin account (`admin@eurosia.one` / Password: `AdminPassword!234`):
```bash
# Push schema to SQLite
npx prisma db push

# Seed initial tables
npm run seed
```

#### 🌐 Production Workflow (PostgreSQL)
For production deployments, change your `DATABASE_URL` inside `.env` to point to a PostgreSQL instance (e.g., `postgresql://...`).
```bash
# Push schema to production PostgreSQL instance
npx prisma db push

# Seed production parameters and admin accounts
npm run seed
```

### 4. Direct Manual Launching (Development)
Install dependencies and launch tsx hot reload dev servers on port 3000:
```bash
npm install
npm run dev
```

---

## 🧪 Testing and Verifications
Run clean, mocked modular integration tests in under 10 seconds checking authentication scopes, billing Stripe redirection, and conversations managers:
```bash
npm run test
```

---

## 📁 API Mapping Endpoints Index

Exposed at `http://localhost:3000/api/v1` (Browse structured docs at `/api/docs`):

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/register` | Open (Rate Limited) | Registration + emails dispatch |
| **POST** | `/auth/login` | Open (Rate Limited) | Credentials Login + JWT issuances |
| **POST** | `/auth/refresh` | Cookies token | Rotating access keys |
| **POST** | `/auth/2fa/setup` | User Bearer | Setup TOTP Secrets QR Codes |
| **POST** | `/auth/2fa/verify` | User Bearer | Save and active MFA |
| **GET** | `/user/profile` | User Bearer | Read user demographics |
| **GET** | `/user/usage` | User Bearer | Check subscription quotas and metrics |
| **POST**| `/chats` | User Bearer | Create chat panels (limit-checked) |
| **POST**| `/chats/:id/messages` | User Bearer | Send chat and execute AI route response |
| **POST**| `/chats/:id/messages/stream` | User Bearer | SSE real-time chat streaming chunks |
| **POST**| `/media/upload` | User Bearer (Max 50MB)| Sharp dimensional validation S3 storage |
| **POST**| `/billing/checkout` | User Bearer | Dynamic Stripe checkout session mappings |
| **GET** | `/admin/dashboard` | Admin Bearer | Aggregated platform dashboard metrics |
| **GET** | `/admin/users/export` | Admin Bearer | Export users catalog in CSV |
| **POST**| `/admin/broadcast` | Admin Bearer | SSA broadcast dispatch to user alerts |
