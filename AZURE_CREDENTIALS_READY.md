# Azure AI Configuration - Ready to Use ✅

Your Azure OpenAI credentials have been provided and are ready to use.

## Credentials Setup

```bash
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"
```

## Quick Start

### Option 1: Use Provided Script
```bash
bash start_backend_with_azure.sh
```

### Option 2: Manual Setup
```bash
# 1. Export credentials (see above)

# 2. Verify PostgreSQL is running
podman ps | grep pca-db

# 3. Start backend
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Start frontend (in another terminal)
cd frontend/static
python3 -m http.server 3001
```

## Testing Chat

1. **Open Frontend:** http://localhost:3001
2. **Navigate to Chat** 
3. **Send a message** - Should use Azure AI without errors
4. **Expected Response:** Cloud cost optimization advice

## What's Running

- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Frontend:** http://localhost:3001
- **Database:** PostgreSQL on localhost:5432
- **AI Service:** Azure OpenAI via UHG Gateway

## Verify Configuration

```bash
# Check backend is running
curl -s http://localhost:8000/docs | grep -q "FastAPI" && echo "✅ Backend OK"

# Check frontend is running
curl -s http://localhost:3001 | grep -q "html" && echo "✅ Frontend OK"

# Check AI health endpoint
curl -s -H "Authorization: Bearer test" http://localhost:8000/api/v1/ai/health
```

## Notes

- Chat.py has been migrated to Azure AI (no OPENAI_API_KEY needed)
- All credentials are now set and configured
- Ready to test full chat functionality
- Backend will auto-reload on code changes

---

Created: January 23, 2026
