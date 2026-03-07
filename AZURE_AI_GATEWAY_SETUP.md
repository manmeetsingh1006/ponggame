# Azure AI Gateway Setup Guide

This guide explains how to configure and use the Azure AI Gateway as your LLM provider instead of standard OpenAI.

## Quick Start

### 1. Create `.env` file in `/backend` directory

Copy the configuration below and save it as `/backend/.env`:

```env
# Application Configuration
ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/cloudopt
REDIS_URL=redis://localhost:6379/0

# JWT Security
JWT_SECRET=change-me-insecure-default-generate-random-secret-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=60

# Provider Selection - Use Azure AI Gateway
OPENAI_PROVIDER=azure-ai-gateway

# Azure AI Gateway Configuration
MODEL_ENDPOINT=https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0
API_VERSION=2025-01-01-preview
CHAT_MODEL_NAME=gpt-4o-mini_2024-07-18
EMBEDDINGS_DEPLOYMENT_NAME=text-embedding-ada-002_2
PROJECT_ID=2db8b475-ec3e-468b-b253-058bbe8ff77b

# OAuth2 Credentials
CLIENT_ID=0425eb79-4b44-4e04-a65f-bd742a35fe47
CLIENT_SECRET=tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb
```

**⚠️ SECURITY WARNING:**
- **NEVER commit `.env` to version control**
- `.env` is listed in `.gitignore`
- Rotate credentials regularly
- Use Azure Key Vault for production secrets

### 2. Rebuild Backend Container

```bash
cd pca-main
podman-compose -f docker-compose.yml up -d --build pca_backend
```

This installs dependencies and loads the new Azure AI Gateway module.

### 3. Verify OAuth2 Connection

Check backend logs:
```bash
podman logs pca_backend | grep -i "token\|azure\|oauth"
```

Expected output:
```
INFO:app.services.azure_ai_gateway:Acquired new Azure AI Gateway token (expires in 3600s)
```

---

## Architecture

### Authentication Flow

```
Your App
  ↓
get_azure_ai_gateway_client() [in openai_client.py via provider selection]
  ↓
get_azure_ai_gateway_token() [acquire OAuth2 token]
  ↓
POST https://api.uhg.com/oauth2/token
{
  "client_id": "CLIENT_ID",
  "client_secret": "CLIENT_SECRET",
  "grant_type": "client_credentials",
  "scope": "https://api.uhg.com/.default"
}
  ↓
Token Response (JWT with 1-hour expiry)
  ↓
Cache token in memory, refresh 5 min before expiry
  ↓
AsyncAzureOpenAI client ready to use
  ↓
POST https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0/chat/completions
Headers: {
  "Authorization": "Bearer {token}",
  "projectId": "PROJECT_ID",
  "api-version": "2025-01-01-preview"
}
```

### Token Caching Strategy

- **Location**: In-memory dictionary in `azure_ai_gateway.py`
- **TTL**: Tracks token expiry time from OAuth response
- **Refresh**: Automatically refreshes 5 minutes before expiry
- **Cache Miss**: Acquires new token only when needed
- **Cache Clear**: Cleared on app restart or manual `clear_token_cache()` call

**Benefits:**
- Reduces authentication requests to Azure AD
- Faster API calls (tokens already acquired)
- Handles token expiry transparently
- Supports both async and sync code

---

## Configuration Details

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `OPENAI_PROVIDER` | Yes | Provider type | `azure-ai-gateway` |
| `MODEL_ENDPOINT` | Yes | Gateway base URL | `https://api.uhg.com/api/cloud/...` |
| `API_VERSION` | Yes | API version string | `2025-01-01-preview` |
| `CHAT_MODEL_NAME` | Yes | Chat model deployment | `gpt-4o-mini_2024-07-18` |
| `EMBEDDINGS_DEPLOYMENT_NAME` | Yes | Embeddings deployment | `text-embedding-ada-002_2` |
| `PROJECT_ID` | Yes | Project identifier | `2db8b475-ec3e-468b-...` |
| `CLIENT_ID` | Yes | OAuth2 client ID | `0425eb79-4b44-...` |
| `CLIENT_SECRET` | Yes | OAuth2 client secret | `tSO7t0I1mVyT8nBdO5v5...` |

### Provider Selection in Code

The application automatically routes to the correct LLM provider based on `OPENAI_PROVIDER`:

```python
from app.services.openai_client import get_async_openai_client

# Automatically uses Azure AI Gateway if OPENAI_PROVIDER=azure-ai-gateway
client = await get_async_openai_client()

# Make API calls, authentication is automatic
response = await client.chat.completions.create(
    model=get_model_name("chat"),
    messages=[{"role": "user", "content": "Hello!"}]
)
```

---

## Usage Examples

### Chat Completions (Async)

```python
from app.services.openai_client import get_async_openai_client, get_model_name

async def generate_recommendation():
    client = await get_async_openai_client()
    
    response = await client.chat.completions.create(
        model=get_model_name("chat"),
        messages=[
            {"role": "system", "content": "You are a cost optimization expert."},
            {"role": "user", "content": "How can I reduce cloud costs?"}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    return response.choices[0].message.content
```

### Embeddings (Async)

```python
from app.services.openai_client import get_async_openai_client, get_model_name

async def create_embeddings(text: str):
    client = await get_async_openai_client()
    
    response = await client.embeddings.create(
        model=get_model_name("embedding"),
        input=text
    )
    
    return response.data[0].embedding
```

### Sync Context (for non-async code)

```python
from app.services.openai_client import get_openai_client, get_model_name

def generate_sync():
    client = get_openai_client()
    
    response = client.chat.completions.create(
        model=get_model_name("chat"),
        messages=[{"role": "user", "content": "Hello!"}]
    )
    
    return response.choices[0].message.content
```

### Token Management

```python
from app.services.azure_ai_gateway import clear_token_cache

# Manual token cache clearing (useful for secret rotation)
clear_token_cache()

# Next client creation will acquire a fresh token
client = await get_async_openai_client()
```

---

## Implementation Files

### New Files Created

1. **`backend/app/services/azure_ai_gateway.py`** (385 lines)
   - OAuth2 token acquisition with client_credentials flow
   - Token caching with TTL-based refresh
   - AsyncAzureOpenAI and AzureOpenAI client factories
   - Error handling with comprehensive logging
   - Support for both async and sync contexts

### Updated Files

1. **`backend/app/services/openai_client.py`**
   - Added provider routing for "azure-ai-gateway"
   - Updated `get_openai_client()` to route to new module
   - Updated `get_async_openai_client()` for async routing
   - Updated `get_model_name()` to use env vars for model names

2. **`backend/app/config.py`**
   - Added configuration fields for Azure AI Gateway
   - Added environment variable definitions
   - Updated documentation

3. **`backend/requirements.txt`**
   - Added `nest_asyncio>=1.5.0` (for sync-to-async bridging)

---

## Troubleshooting

### "Token acquisition failed: Invalid credentials"

**Cause:** Wrong CLIENT_ID or CLIENT_SECRET

**Solution:**
1. Verify credentials in `.env` file
2. Check Azure AD for correct values
3. Ensure credentials haven't expired

**Debug:**
```bash
podman logs pca_backend | grep -i "invalid\|401\|unauthorized"
```

### "Connection refused: MODEL_ENDPOINT"

**Cause:** Network unreachable or wrong endpoint URL

**Solution:**
1. Verify MODEL_ENDPOINT is correct: `https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0`
2. Check network connectivity: `curl -I https://api.uhg.com`
3. Verify no proxy/firewall blocking access

**Debug:**
```bash
podman exec pca_backend curl -v https://api.uhg.com/health
```

### "Invalid model deployment"

**Cause:** CHAT_MODEL_NAME or EMBEDDINGS_DEPLOYMENT_NAME doesn't exist

**Solution:**
1. Verify model names match your Azure AI Gateway configuration
2. Check deployment names: `gpt-4o-mini_2024-07-18`, `text-embedding-ada-002_2`
3. Contact Azure AI Gateway administrator for list of available models

### "ProjectId header missing"

**Cause:** PROJECT_ID environment variable not set

**Solution:**
1. Verify PROJECT_ID is in `.env`
2. Restart backend container: `podman-compose up -d --build pca_backend`
3. Check logs: `podman logs pca_backend | grep -i "project"`

---

## Performance Optimization

### Token Caching Benefits

With 100 API calls per minute:
- **Without caching:** 100 token requests/min to OAuth server (overhead)
- **With caching:** 1 new token every 55 minutes (on expiry)
- **Result:** 99% reduction in auth overhead

### Async Support

All operations are async-first for non-blocking I/O:
```python
# Non-blocking - doesn't block other requests
response = await client.chat.completions.create(...)

# Compared to sync (blocks entire thread)
response = sync_client.chat.completions.create(...)
```

---

## Switching Providers

To switch from one provider to another:

### OpenAI → Azure AI Gateway

1. Add Azure AI Gateway config to `.env`
2. Set `OPENAI_PROVIDER=azure-ai-gateway`
3. Restart: `podman-compose up -d --build pca_backend`

### Azure Standard → Azure AI Gateway

1. Update `.env` with Azure AI Gateway values
2. Change `OPENAI_PROVIDER=azure-ai-gateway`
3. Restart: `podman-compose up -d --build pca_backend`

**No code changes needed!** The provider selection is handled automatically.

---

## Support and Documentation

- **OAuth2 Flow Details:** See `backend/app/services/azure_ai_gateway.py` docstrings
- **Configuration Reference:** See `backend/app/config.py` class definition
- **Provider Selection Logic:** See `backend/app/services/openai_client.py`
- **OpenAI Package Docs:** https://github.com/openai/openai-python
- **Azure OpenAI Docs:** https://learn.microsoft.com/en-us/python/api/overview/azure/openai-readme

---

## Next Steps

1. ✅ **Create `.env` file** with configuration from Quick Start section
2. ✅ **Restart backend** container to apply changes
3. ✅ **Test OAuth2 connection** by checking logs
4. ✅ **Update existing AI endpoints** to use new provider if needed
5. ✅ **Monitor costs** through Azure AI Gateway dashboard

---

**Created:** 2025-01-25  
**Author:** Cloud Optimizer Team  
**Last Updated:** 2025-01-25  
**Status:** Production Ready
