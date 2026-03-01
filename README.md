# DocumentGem — Document Intelligence Platform

An AI-powered platform that helps businesses manage, categorize, and extract actionable insights from unstructured documents. Upload contracts, invoices, and receipts — DocumentGem automatically organizes them and surfaces key information like financial totals, upcoming deadlines, and action items.

---

## Features

### Document Management
- **Upload & Organize** — PDF, JPG, PNG, WebP, DOCX with drag-and-drop
- **Auto-Categorization** — AI classifies documents as Invoice, Contract, Receipt, Policy, etc. with confidence scoring
- **Smart Extraction** — Automatically extracts dates, amounts, entities, line items, and action items
- **Duplicate Detection** — SHA-256 content hashing to flag re-uploaded files
- **Soft Delete & Trash** — Recoverable deletion with permanent delete option

### AI Intelligence
- **Insights Dashboard** — Visualize monthly spend, category distribution, and deadline alerts
- **Chat with Documents** — RAG-powered Q&A across your entire document library
- **Multi-Document Chat** — Ask questions that span multiple documents with auto-session management
- **Cross-Document Analysis** — Compare invoices against POs, detect discrepancies
- **Smart Alerts** — Expiring contracts, high-value invoices, missing signatures, auto-renewal clauses

### Integrations
- **Gmail Sync** — Automatically fetch invoice and receipt attachments
- **Google Drive Sync** — Scheduled sync from watched Drive folders
- **Source Tracking** — Every document shows its origin (Upload, Gmail, Drive)

### Production Hardening
- **Security** — CORS, security headers, rate limiting, upload validation, error sanitization
- **Structured Logging** — JSON-formatted logs across all services (zero `print()` statements)
- **OpenAI Cost Tracking** — Token usage logged per API call for cost visibility
- **User Quotas** — Configurable per-user limits on documents, storage, and daily chat messages
- **AI Confidence Gating** — Low-confidence classifications (< 0.7) flagged as "Needs Review"
- **Docker** — Containerized backend with health checks

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Recharts](https://recharts.org/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) (Python), [Uvicorn](https://www.uvicorn.org/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| **AI / LLM** | [OpenAI](https://openai.com/) (GPT-4o, text-embedding-3-small) |
| **Integrations** | Gmail API, Google Drive API via [google-api-python-client](https://github.com/googleapis/google-api-python-client) |
| **Scheduling** | [APScheduler](https://apscheduler.readthedocs.io/) |
| **Containerization** | Docker + docker-compose |

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js   │◄────►│   FastAPI    │◄────►│   Supabase   │
│  Frontend   │      │   Backend    │      │  (DB/Auth/   │
│  (Vercel)   │      │  (Uvicorn)   │      │   Storage)   │
└─────────────┘      └──────┬───────┘      └──────────────┘
                            │
                     ┌──────┴───────┐
                     │   OpenAI     │
                     │  (GPT-4o +   │
                     │  Embeddings) │
                     └──────────────┘
```

**Document Processing Pipeline:**
Upload → Validate → Store → Classify (AI) → Extract Metadata → Generate Embeddings → Index → Chat-Ready

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- [Supabase](https://supabase.com/) account
- [OpenAI](https://platform.openai.com/) API key
- Google Cloud Console project (for Gmail/Drive integrations)

### 1. Clone

```bash
git clone https://github.com/neetishtewari/documentgem.git
cd documentgem
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=development
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Visit **http://localhost:3000**

### 4. Docker (Alternative)

```bash
docker compose up --build
```

This starts the backend on port 8000 with health checks. The frontend is typically deployed to Vercel separately.

---

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | — |
| `SUPABASE_KEY` | Supabase anon/public key | — |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect | `http://localhost:8000/api/auth/google/callback` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `MAX_UPLOAD_SIZE_MB` | Max file upload size | `20` |
| `RATE_LIMIT_PER_MINUTE` | Global rate limit | `60/minute` |
| `RATE_LIMIT_CHAT_PER_MINUTE` | Chat endpoint rate limit | `20/minute` |
| `MAX_DOCUMENTS_PER_USER` | Document quota per user | `500` |
| `MAX_STORAGE_PER_USER_MB` | Storage quota per user | `500` |
| `MAX_CHAT_MESSAGES_PER_DAY` | Daily chat message limit | `100` |

---

## Project Structure

```
documentgem/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, logging, rate limiting, quotas
│   │   ├── dependencies/   # Auth middleware
│   │   ├── routers/        # API endpoints (auth, documents, chat, integrations, etc.)
│   │   ├── services/       # Business logic (AI, Gmail, Drive, alerts, scheduler)
│   │   └── main.py         # FastAPI app entry point
│   ├── migrations/         # SQL migrations
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                # Next.js App Router pages
│   ├── components/         # React components (UI, chat, dashboard)
│   ├── lib/                # Supabase client, utilities
│   └── public/             # Static assets
├── docker-compose.yml
└── prd.md                  # Product Requirements Document
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/documents/upload` | Upload document |
| `GET` | `/api/documents/` | List documents (paginated, filterable) |
| `GET` | `/api/documents/stats` | Category counts & totals |
| `PATCH` | `/api/documents/:id` | Update document metadata |
| `DELETE` | `/api/documents/:id` | Soft delete (trash) |
| `POST` | `/api/documents/:id/restore` | Restore from trash |
| `DELETE` | `/api/documents/:id/permanent` | Permanent delete |
| `POST` | `/api/chat/sessions` | Create chat session |
| `POST` | `/api/chat/sessions/:id/messages` | Send message (RAG) |
| `POST` | `/api/chat/:documentId` | Single-document chat |
| `GET` | `/api/analytics/insights` | AI-generated insights |
| `GET` | `/api/search` | Semantic document search |
| `GET` | `/api/integrations/status` | Integration connection status |
| `GET` | `/health` | Health check |

---

## Roadmap

- [x] **Phase 1** — Core platform (upload, classify, extract, chat, integrations)
- [x] **Phase 2A** — Security, logging, rate limiting, CI/CD, cost tracking
- [x] **Phase 2B** — Docker, user quotas, AI confidence threshold
- [ ] **Phase 2C** — RBAC, PII detection, OAuth token encryption
- [ ] **Phase 3** — Bulk analytics, custom alert rules, multi-tenant workspaces

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

Private — All rights reserved.
