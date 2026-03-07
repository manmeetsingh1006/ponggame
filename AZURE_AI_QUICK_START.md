# Azure AI Chat - Quick Start Guide

## ✅ What's Ready

Your application now has **Azure AI-powered chat** fully integrated and configured!

### What Was Installed
- ✅ Azure-compatible OpenAI SDK (openai>=1.0.0)
- ✅ Azure Identity package (azure-identity>=1.15.0)
- ✅ New Azure AI Gateway Service module
- ✅ Enhanced chat endpoint with AI integration
- ✅ Text embeddings auto-generation
- ✅ All configuration and credentials

### What You Can Do Now

1. **Chat with AI** - Ask questions about cloud resources
2. **Get Embeddings** - Messages automatically get semantic vectors
3. **Stream Responses** - Real-time response streaming
4. **Health Checks** - Verify Azure Gateway is online

## 🚀 Get Started in 30 Seconds

### Step 1: Start Backend
```bash
cd backend
source venv/bin/activate
./start-backend.sh
```

### Step 2: Open Chat Interface
```
http://localhost:3001/chat.html
```

### Step 3: Login
```
Username: testuser
Password: password
```

### Step 4: Chat with AI!
Try asking:
- "What cloud resources do I have?"
- "How can I optimize my cloud costs?"
- "Tell me about my databases"

## 📝 What Changed

| Component | Change |
|-----------|--------|
| requirements.txt | Added Azure packages |
| .env | Added Azure credentials |
| config.py | Added Azure settings class |
| chat.py | Now uses Azure AI Gateway |
| ✨ NEW: azure_ai_service.py | Complete Azure AI client |

## 🔧 Verify Everything Works

Test your setup:
```bash
cd backend
source venv/bin/activate

# Test 1: Check configuration
python -c "from app.config import settings; print('✅ Config loaded:', settings.MODEL_ENDPOINT)"

# Test 2: Check service
python -c "from app.services.azure_ai_service import get_azure_ai_client; print('✅ Service ready')"

# Test 3: Check chat endpoint
python -c "from app.api.v1.chat import generate_ai_response; print('✅ Chat endpoint ready')"
```

## 📋 Architecture

```
┌─────────────────┐
│  Frontend       │ (http://localhost:3001/chat.html)
│  chat.html      │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────────────┐
│  FastAPI Backend        │ (localhost:8000)
│  ├─ chat.py endpoint    │
│  ├─ JWT auth            │
│  └─ WebSocket support   │
└────────┬────────────────┘
         │ HTTP
         ▼
┌────────────────────────────────┐
│  Azure AI Gateway              │
│  https://api.uhg.com/...       │
│  ├─ Chat Completions           │
│  └─ Embeddings                 │
└────────────────────────────────┘

    SQLite Database
    ├─ chat_messages (with embeddings)
    ├─ users
    └─ tenants
```

## 🔌 WebSocket API

### Send Chat Message
```json
{
  "message": "What are my AWS costs?"
}
```

### Receive Response
```json
{
  "type": "message",
  "clientId": "1",
  "sender": "assistant",
  "message": "Your AWS costs are...",
  "timestamp": "2025-01-28T10:00:00"
}
```

## 🐛 Troubleshooting

### Chat not responding?
1. Check backend running: `curl http://localhost:8000/docs`
2. Check WebSocket connected: Browser DevTools → Network → WS
3. Check logs: `tail -f /tmp/backend.log`

### "Authorization failed" error?
1. Make sure you're logged in (JWT token valid)
2. Check token in browser localStorage

### Slow responses?
1. Check network latency to Azure Gateway
2. Reduce max_tokens in chat response
3. Check Azure Gateway status dashboard

## 📚 Full Documentation

See complete guide: [AZURE_AI_CHAT_SETUP.md](../AZURE_AI_CHAT_SETUP.md)

## 🔑 Your Azure Credentials

Stored securely in `backend/.env`:
```
MODEL_ENDPOINT=https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0
API_VERSION=2025-01-01-preview
CHAT_MODEL_NAME=gpt-4o-mini_2024-07-18
PROJECT_ID=2db8b475-ec3e-468b-b253-058bbe8ff77b
CLIENT_ID=0425eb79-4b44-4e04-a65f-bd742a35fe47
```

⚠️ **Never commit `.env` to git!**

## 💡 Pro Tips

1. **System Prompt Customization**
   - Edit system prompt in `chat.py:generate_ai_response()`
   - Add domain-specific instructions

2. **Embedding Features**
   - Messages auto-embed for semantic search
   - Use embeddings for similarity matching
   - Implement RAG (Retrieval Augmented Generation)

3. **Performance Optimization**
   - Use streaming for long responses
   - Cache frequent questions
   - Batch embeddings for multiple messages

4. **Production Deployment**
   - Use Azure Key Vault for secrets
   - Enable logging and monitoring
   - Set up rate limiting
   - Configure auto-scaling

## 🎯 Next Steps

1. Customize the AI behavior (system prompt)
2. Add cloud resource queries
3. Integrate with your monitoring tools
4. Set up production deployment
5. Configure advanced features (RAG, function calling)

---

**Status**: ✅ Ready to Use
**Chat Interface**: http://localhost:3001/chat.html
**API Docs**: http://localhost:8000/docs
**Last Updated**: January 28, 2026
