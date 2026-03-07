# Azure AI Gateway Integration - Setup Guide

## Overview

This integration enables your Cloud Cost Optimizer to use Azure's OpenAI services through UHG's AI Gateway for:
- **Chat with AI** - Real-time conversations with GPT-4o-mini
- **Cost Analysis** - AI-powered resource analysis and recommendations
- **Optimization Suggestions** - Intelligent cloud optimization recommendations

---

## 📋 How It Works

### Authentication Flow (OAuth2 Client Credentials)

```
Your App
   ↓
[Request Token] → UHG OAuth2 Endpoint (https://api.uhg.com/oauth2/token)
   ↓
[Get Access Token using client_id + client_secret]
   ↓
[Initialize Azure OpenAI Client]
   ↓
[Use token for API calls] → UHG AI Gateway (https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0)
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `AzureAIService` | Handles authentication and API calls |
| `ai.py` (Router) | Exposes `/api/v1/ai/chat` and `/api/v1/ai/analyze-resources` endpoints |
| `config.py` | Stores credentials (AZURE_AI_CLIENT_ID, AZURE_AI_CLIENT_SECRET, AZURE_AI_PROJECT_ID) |

---

## 🔧 Setup Instructions

### Step 1: Update Your `.env` File

Add these credentials to your `.env` file:

```bash
# Azure AI Gateway Credentials (from UHG)
AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
AZURE_AI_CLIENT_SECRET="<your-client-secret>"
AZURE_AI_PROJECT_ID="a82c5b9d-be3d-487a-858a-96b616963921"
```

**⚠️ Security Note:**
- Never commit `.env` file to git
- Store secrets in secure vaults (Key Vault, AWS Secrets Manager)
- Use separate credentials for dev/prod

### Step 2: Install Required Packages

```bash
pip install openai httpx python-dotenv
```

Or add to `requirements.txt`:
```
openai>=1.0.0
httpx>=0.25.0
python-dotenv>=1.0.0
```

### Step 3: Start Backend with Environment Variables

```bash
cd backend

export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="your-secret"
export AZURE_AI_PROJECT_ID="a82c5b9d-be3d-487a-858a-96b616963921"

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🚀 API Usage Examples

### 1. Chat Endpoint

**Endpoint:** `POST /api/v1/ai/chat`

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What are the best practices for reducing cloud storage costs?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Response:**
```json
{
  "response": "Here are the best practices for reducing cloud storage costs:\n\n1. **Lifecycle Policies**...",
  "message_count": 1
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is a prime number?"}
    ]
  }'
```

---

### 2. Resource Analysis Endpoint

**Endpoint:** `POST /api/v1/ai/analyze-resources`

**Request:**
```json
{
  "resource_data": {
    "compute": {
      "vms": 45,
      "avg_utilization": "35%",
      "monthly_cost": "$12,500",
      "idle_instances": 12
    },
    "storage": {
      "total_gb": 5000,
      "unused_gb": 2000,
      "monthly_cost": "$5,000"
    },
    "networking": {
      "data_transfer_gb": 500,
      "monthly_cost": "$2,000"
    }
  },
  "analysis_type": "compute"
}
```

**Response:**
```json
{
  "recommendations": "## Cost Optimization Recommendations\n\n### Current Cost Drivers\n- 12 idle compute instances contributing $2,100/month\n- 2TB of unused storage: $400/month\n\n### Quick Wins (0-30 days)\n1. **Remove Idle Instances**: Potential savings $2,100/month\n2. **Clean Up Unused Storage**: Potential savings $400/month\n\n### Medium-term (1-3 months)\n1. Consolidate workloads to fewer, larger instances\n2. Implement auto-scaling policies\n\n### Estimated Total Savings\n**$3,200-5,500 per month** (~25-35% reduction)",
  "analysis_type": "compute"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/v1/ai/analyze-resources \
  -H "Content-Type: application/json" \
  -d '{
    "resource_data": {
      "compute": {"vms": 45, "avg_utilization": "35%"}
    }
  }'
```

---

## 📝 Integration Examples

### Python Example - Using the Service Directly

```python
from app.services.azure_ai_service import get_azure_ai_service
import asyncio

async def main():
    # Get the service
    ai_service = await get_azure_ai_service()
    
    # Chat example
    messages = [
        {"role": "user", "content": "Explain cloud cost optimization"}
    ]
    response = await ai_service.chat_completion(messages)
    print(response)
    
    # Resource analysis example
    resource_data = {
        "compute": {
            "vms": 50,
            "avg_utilization": "30%",
            "monthly_cost": "$15,000"
        }
    }
    recommendations = await ai_service.analyze_resources_for_cost_optimization(resource_data)
    print(recommendations)

asyncio.run(main())
```

### Frontend JavaScript Example

```javascript
const API_BASE = 'http://localhost:8000/api';

// Chat with AI
async function chatWithAI(userMessage) {
  const response = await fetch(`${API_BASE}/v1/ai/chat`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      messages: [
        {"role": "user", "content": userMessage}
      ]
    })
  });
  return await response.json();
}

// Analyze resources
async function analyzeResources(resourceData) {
  const response = await fetch(`${API_BASE}/v1/ai/analyze-resources`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      resource_data: resourceData,
      analysis_type: 'general'
    })
  });
  return await response.json();
}

// Usage
const result = await chatWithAI("What is cloud cost optimization?");
console.log(result.response);
```

---

## 🔐 Security Best Practices

### 1. **Credential Management**
```python
# ❌ DON'T - Store in code
CLIENT_SECRET = "abc123xyz"

# ✅ DO - Store in environment variables
CLIENT_SECRET = os.getenv("AZURE_AI_CLIENT_SECRET")
```

### 2. **Token Management**
- Tokens are cached and reused within the service instance
- Tokens auto-refresh when they expire
- Never expose tokens in logs or error messages

### 3. **Rate Limiting**
- Azure OpenAI has rate limits per subscription
- Implement request queuing for high volume
- Monitor API usage in Azure Portal

### 4. **Input Validation**
```python
# Always validate user input
if len(user_message) > 5000:
    raise ValueError("Message too long")

if not all(isinstance(msg, dict) for msg in messages):
    raise ValueError("Invalid message format")
```

---

## 🐛 Troubleshooting

### Issue: "OAuth2 authentication failed"
```
Error: OAuth2 authentication failed: 401 Unauthorized
```
**Solution:**
- Verify `AZURE_AI_CLIENT_ID` and `AZURE_AI_CLIENT_SECRET` are correct
- Check if credentials have expired
- Ensure credentials have necessary permissions

### Issue: "Missing Azure AI credentials"
```
Error: Missing Azure AI credentials in environment
```
**Solution:**
- Add all three variables to `.env`:
  - `AZURE_AI_CLIENT_ID`
  - `AZURE_AI_CLIENT_SECRET`
  - `AZURE_AI_PROJECT_ID`
- Restart the backend

### Issue: "Rate limit exceeded"
```
Error: 429 Too Many Requests
```
**Solution:**
- Implement exponential backoff retry logic
- Reduce request frequency
- Contact UHG to increase rate limits

---

## 📊 Monitoring & Logging

Check logs for AI service activity:

```bash
# View backend logs with AI service messages
docker logs pca-backend | grep -i "azure\|authentication\|chat"

# Or from running process
tail -f logs/backend.log | grep "AI\|azure"
```

---

## 🎯 Next Steps

1. **Add Streaming** - For real-time chat responses
2. **Implement Caching** - Cache analysis results
3. **Add Webhooks** - Notify on major recommendations
4. **Multi-user Chat** - Store conversation history
5. **Custom Models** - Fine-tune for your industry

---

## 📚 References

- [OpenAI Python Client](https://github.com/openai/openai-python)
- [Azure OpenAI Service](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [OAuth 2.0 Client Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.4)
