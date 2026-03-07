# System Architecture Diagrams

## 1. Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Your Application                                            │
│ (Cloud Cost Optimizer)                                       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
                    ┌──────────────┐
                    │   AzureAI    │
                    │  Service     │
                    │              │
                    │ Check token? │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │ (if expired)            │ (if valid)
              ↓                         ↓
        ┌──────────────┐          ┌──────────────┐
        │ POST oauth   │          │ Use existing │
        │ token        │          │ token        │
        │ endpoint     │          │              │
        └──────┬───────┘          │              │
               │                  └──────┬───────┘
        ┌──────────────────────────────────────────┐
        │ Get Access Token                         │
        │ (valid for ~1 hour)                      │
        └──────┬───────────────────────────────────┘
               │
               ↓
        ┌──────────────────────────────────────────┐
        │ Use token to call AI Gateway API         │
        │                                          │
        │ Authorization: Bearer {token}            │
        └──────────────────────────────────────────┘
```

## 2. Request Flow - Chat Endpoint

```
User Browser                Backend                UHG Azure              OpenAI
     │                         │                       │                    │
     │  POST /api/v1/ai/chat   │                       │                    │
     ├────────────────────────>│                       │                    │
     │                         │ Check credentials    │                    │
     │                         │ (in config.py)       │                    │
     │                         │ ↓                    │                    │
     │                         │ Get access token    │                    │
     │                         ├───────────────────> │                    │
     │                         │                    │ POST oauth/token   │
     │                         │<───────────────────┤                    │
     │                         │ {token}             │                    │
     │                         │ ↓                   │                    │
     │                         │ Call AI Gateway     │                    │
     │                         ├───────────────────>│                    │
     │                         │ /chat-completions  │ Forward request    │
     │                         │ {messages, token}  ├───────────────────>│
     │                         │                    │                   │
     │                         │                    │ Process with GPT  │
     │                         │                    │ {response}         │
     │                         │<───────────────────┤                    │
     │                         │ {response}         │                    │
     │                         │                    │                    │
     │<────────────────────────┤                    │                    │
     │ {ai_response}           │                    │                    │
     │                         │                    │                    │
```

## 3. Resource Analysis Flow

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend sends resource data                                 │
│                                                              │
│ {                                                            │
│   "resource_data": {                                         │
│     "compute": {vms: 50, utilization: "30%"},               │
│     "storage": {gb: 5000, unused: 2000}                    │
│   }                                                          │
│ }                                                            │
└──────────────┬───────────────────────────────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ Backend validates request       │
    │ - Check resource_data format    │
    │ - Validate numbers              │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ Format for AI prompt            │
    │ Current cost drivers:           │
    │ - 50 VMs at 30% utilization    │
    │ - 2TB unused storage            │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ Send to Azure OpenAI            │
    │ "Analyze these resources..."    │
    └──────────┬──────────────────────┘
               │
               ↓
    ┌─────────────────────────────────┐
    │ Receive AI recommendations      │
    │ - Quick wins: $5000/mo          │
    │ - Medium term: $7000/mo         │
    │ - Long term: $10000/mo          │
    └──────────┬──────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────────┐
│ Return to frontend                                           │
│ {                                                            │
│   "recommendations": "## Recommendations...",               │
│   "analysis_type": "general"                                │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
```

## 4. Code Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ UI Components                                        │  │
│  │ - Chat widget (ai-chat-widget.html)                │  │
│  │ - Analysis buttons                                  │  │
│  │ - Results display                                   │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │ HTTP REST calls                     │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FastAPI Routes (app/main.py)                        │  │
│  │ app.include_router(ai_routes.router)                │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │ AI API Endpoints (app/api/v1/ai.py)                 │  │
│  │ - POST /api/v1/ai/chat                              │  │
│  │ - POST /api/v1/ai/analyze-resources                 │  │
│  │ - GET  /api/v1/ai/health                            │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │ Azure AI Service (app/services/azure_ai_service.py) │  │
│  │                                                       │  │
│  │ Methods:                                              │  │
│  │ - authenticate()          → OAuth2 token             │  │
│  │ - initialize_client()     → Setup OpenAI client      │  │
│  │ - chat_completion()       → Call OpenAI API          │  │
│  │ - analyze_resources()     → Cost analysis            │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                         │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │ Configuration (app/config.py)                        │  │
│  │                                                       │  │
│  │ Credentials from .env:                                │  │
│  │ - AZURE_AI_CLIENT_ID                                 │  │
│  │ - AZURE_AI_CLIENT_SECRET                             │  │
│  │ - AZURE_AI_PROJECT_ID                                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓ HTTPS with OAuth token
┌─────────────────────────────────────────────────────────────┐
│         UHG Azure OpenAI Gateway                            │
│  https://api.uhg.com/api/cloud/api-management/ai-gateway   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              OpenAI GPT-4o-mini Model                       │
│  Processes requests and generates responses                │
└─────────────────────────────────────────────────────────────┘
```

## 5. Data Flow - Chat Message

```
Step 1: User Input
┌────────────────────────┐
│ "How to reduce costs?" │
└────────────────┬───────┘
                 │
Step 2: Validate
                 ↓
         ┌──────────────┐
         │ Check length │
         │ Check format │
         └──────┬───────┘
                │
Step 3: Add to History
                ↓
    ┌───────────────────────┐
    │ messages = [          │
    │   {role: "user",      │
    │    content: "How..."}  │
    │ ]                     │
    └───────┬───────────────┘
            │
Step 4: Get Token
            ↓
    ┌──────────────────┐
    │ Check if token   │
    │ is still valid   │
    └─────────┬────────┘
              │
Step 5: Call API
              ↓
    ┌──────────────────────────┐
    │ POST azure-openai        │
    │ /chat/completions        │
    │ {messages, temperature}  │
    └──────────┬───────────────┘
               │
Step 6: Get Response
               ↓
    ┌──────────────────────┐
    │ "Here are ways to    │
    │  reduce cloud costs: │
    │  1. Right-size..."   │
    └──────────┬───────────┘
               │
Step 7: Return to Frontend
               ↓
        ┌─────────────┐
        │ Display in  │
        │ chat widget │
        └─────────────┘
```

## 6. Authentication Token Lifecycle

```
Time:   0 min          30 min         60 min         90 min
        │              │              │              │
        ├──────────────┼──────────────┼──────────────┤
        │              │              │              │
        │    VALID     │    VALID     │    EXPIRED   │
        │    TOKEN     │    TOKEN     │   → GET NEW  │
        │    IN USE    │    IN USE    │              │
        │              │              │   NEW TOKEN  │
        │              │              │   IN USE     │
        │              │              │              │
        ├──────────────┼──────────────┼──────────────┤
        
     Request 1      Request 2      Request 3      Request 4
     ✓ Use cached   ✓ Use cached   ✗ Token        ✓ Use new
       token         token          expired        token
       
     Call API      Call API       Auto-request   Call API
     ✓ Success     ✓ Success      new token      ✓ Success
                                  ✓ Success
```

## 7. Error Handling Flow

```
Request comes in
│
├─► Validate credentials
│   ├─► Missing? → Error 500
│   └─► Present? ↓
│
├─► Get OAuth token
│   ├─► Auth fails? → Error 401
│   ├─► Network error? → Error 503
│   └─► Success? ↓
│
├─► Validate user input
│   ├─► Invalid format? → Error 400
│   ├─► Too long? → Error 413
│   └─► Valid? ↓
│
├─► Call OpenAI API
│   ├─► Rate limited? → Error 429 (retry after)
│   ├─► Server error? → Error 500
│   ├─► Invalid token? → Error 401 (refresh token)
│   └─► Success? ↓
│
└─► Return response
    ├─► Log success
    └─► Send to frontend
```

---

## Key Files Reference

| File | Lines | Purpose |
|------|-------|---------|
| `azure_ai_service.py` | 208 | Core authentication & API |
| `ai.py` | 130 | API endpoints |
| `config.py` | +3 | Configuration |
| `main.py` | +2 | Router registration |
| `test_ai_integration.py` | 200 | Testing |
| `ai-chat-widget.html` | 300 | Frontend UI |

Total: ~843 lines of code
