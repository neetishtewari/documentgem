# DocumentGem - Document Intelligence Platform

DocumentGem is a powerful AI-driven platform designed to help businesses and individuals manage, analyze, and extract insights from unstructured documents. It acts as a central hub for your contracts, invoices, and receipts, automatically organizing them and surfacing key information like financial totals, upcoming deadlines, and action items.

## 🚀 Features

### 📄 Document Management
- **Upload & Organize**: Support for PDF, JPG, PNG.
- **Auto-Categorization**: AI automatically classifies documents (Invoice, Contract, Receipt, etc.).
- **Smart Extraction**: Extracts key metadata (Dates, Amounts, Entities) automatically.

### 🧠 AI Intelligence
- **Insights Dashboard**: Visualize your monthly spend, document categories, and upcoming deadlines in one place.
- **Chat with Documents**: Ask questions about your documents ("What is the payment term?", "Show me the termination clause") and get instant answers with citations.
- **RAG Pipeline**: Built on a robust Retrieval-Augmented Generation pipeline using OpenAI.

### 🔌 Integrations
- **Gmail Sync**: Automatically fetch invoices and receipts from your inbox.
- **Google Drive Sync**: Keep your document library up-to-date with files from your Drive.
- **Source Tracking**: Clearly see where each document came from (Upload, Gmail, Drive).

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI/LLM**: [OpenAI API](https://openai.com/) (GPT-4o, Embeddings)
- **Task Scheduling**: [APScheduler](https://apscheduler.readthedocs.io/)
- **Google APIs**: Gmail API, Google Drive API

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase Account
- OpenAI API Key
- Google Cloud Console Project (for Integrations)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/documentgem.git
cd documentgem
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app!

## 📸 Screenshots
*(Add screenshots of Dashboard, Document Details, and Insights here)*

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
