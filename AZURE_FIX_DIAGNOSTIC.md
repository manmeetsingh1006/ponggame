# Azure OpenAI Authentication - Fix Diagnostic Report

## Current Issue

**Error Message from Backend Logs:**
```
LLM API error: Error code: 403 - {'detail': {'code': 403, 'message': 'Authorization failed. Verify that the deploymentName, modelName are correct.'}}
```

## Analysis

The Azure OAuth token is being obtained **successfully** (no 401/authentication errors), but the **model deployment or endpoint configuration is incorrect**.

### Current Configuration

**File:** `podman-compose.yml` (lines 21-33)

```yaml
OPENAI_PROVIDER: "azure"
AZURE_MODEL_ENDPOINT: "https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0"
AZURE_API_VERSION: "2025-01-01-preview"
AZURE_CHAT_MODEL_NAME: "gpt-4o-mini_2024-07-18"
AZURE_EMBEDDINGS_DEPLOYMENT_NAME: "text-embedding-ada-002_2"
AZURE_EMBEDDINGS_MODEL_NAME: "text-embedding-ada-002_2"
AZURE_PROJECT_ID: "2db8b475-ec3e-468b-b253-058bbe8ff77b"
AZURE_CLIENT_ID: "0425eb79-4b44-4e04-a65f-bd742a35fe47"
AZURE_CLIENT_SECRET: "tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
```

## What Needs to be Verified

### 1. ✅ OAuth Credentials Status
- **CLIENT_ID**: `0425eb79-4b44-4e04-a65f-bd742a35fe47`
- **CLIENT_SECRET**: `tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb`
- **Status**: ✅ **WORKING** - Token is obtained successfully
- **Note**: Credentials authenticate with `https://api.uhg.com/oauth2/token`

### 2. ❌ Model Deployment Name - NEEDS VERIFICATION
- **Current Setting**: `AZURE_CHAT_MODEL_NAME: "gpt-4o-mini_2024-07-18"`
- **Problem**: Azure API returns 403 saying this deployment name is incorrect
- **Action Required**: Contact UHG IT to confirm:
  - [ ] What is the correct deployment name in Azure for chat models?
  - [ ] Is `gpt-4o-mini_2024-07-18` actually deployed?
  - [ ] List available chat model deployments in the UHG Azure gateway

### 3. ❌ API Endpoint - NEEDS VERIFICATION
- **Current Setting**: `https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0`
- **Possible Issues**:
  - [ ] Endpoint URL might be incorrect
  - [ ] API version `2025-01-01-preview` might not be supported
  - [ ] Endpoint might require additional headers beyond `projectId`
- **Action Required**: Confirm with UHG IT:
  - [ ] What is the correct Azure OpenAI gateway endpoint?
  - [ ] What API version should be used?
  - [ ] Are there any additional required headers?

### 4. ❌ Project ID - NEEDS VERIFICATION
- **Current Setting**: `AZURE_PROJECT_ID: "2db8b475-ec3e-468b-b253-058bbe8ff77b"`
- **Possible Issues**: May be outdated or incorrect
- **Action Required**: Confirm with UHG IT:
  - [ ] Is this project ID valid?
  - [ ] Is it active and authorized?

## How the System is Currently Trying to Call Azure

**File:** `backend/app/services/openai_client.py` (lines 100-115)

```python
return AsyncAzureOpenAI(
    azure_endpoint=settings.AZURE_MODEL_ENDPOINT,
    api_version=settings.AZURE_API_VERSION,
    api_key=token,  # OAuth token from https://api.uhg.com/oauth2/token
    http_client=http_client,  # Includes projectId header
)
```

**The system is making this request:**
- **Endpoint**: `https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0`
- **API Version**: `2025-01-01-preview`
- **Model/Deployment**: `gpt-4o-mini_2024-07-18`
- **Auth**: Bearer token from OAuth
- **Extra Headers**: `projectId: 2db8b475-ec3e-468b-b253-058bbe8ff77b`

## Action Items to Fix

**Contact UHG IT Support with these questions:**

1. **Model Deployment Question**
   ```
   What is the correct deployment name for chat models in the Azure OpenAI gateway?
   Current setting: gpt-4o-mini_2024-07-18
   Is this correct? If not, what should it be?
   ```

2. **Endpoint Configuration Question**
   ```
   What is the correct Azure OpenAI gateway endpoint and API version?
   Current endpoint: https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0
   Current API version: 2025-01-01-preview
   Are these correct?
   ```

3. **Credentials Verification Question**
   ```
   CLIENT_ID: 0425eb79-4b44-4e04-a65f-bd742a35fe47
   CLIENT_SECRET: tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb
   PROJECT_ID: 2db8b475-ec3e-468b-b253-058bbe8ff77b
   Are all these credentials valid and active?
   ```

4. **Available Models Question**
   ```
   What chat models are currently available in the gateway?
   Please provide the list of available deployment names.
   ```

5. **Additional Requirements Question**
   ```
   Are there any additional required headers, scopes, or configurations
   beyond what we're currently sending?
   ```

## How to Test Once You Have New Credentials

Once you get the correct values from UHG IT:

1. **Update the configuration** in `podman-compose.yml`:
   ```yaml
   AZURE_CHAT_MODEL_NAME: "[CORRECT_DEPLOYMENT_NAME]"
   AZURE_MODEL_ENDPOINT: "[CORRECT_ENDPOINT]"
   AZURE_API_VERSION: "[CORRECT_API_VERSION]"
   AZURE_PROJECT_ID: "[CORRECT_PROJECT_ID]"
   ```

2. **Restart the backend**:
   ```bash
   podman restart pca_backend
   ```

3. **Test the chat endpoint**:
   - Open the app at `http://localhost:3001`
   - Go to the Chat page
   - Send a message
   - It should now work without the 403 error

## Current Workarounds (if needed)

If you need chat to work immediately while contacting UHG IT:

**Option A: Switch to Standard OpenAI (Temporary)**
- Get an OpenAI API key from https://platform.openai.com
- Change `OPENAI_PROVIDER` to `openai` in `podman-compose.yml`
- Add `OPENAI_API_KEY: sk-your-key-here`
- Restart backend
- Chat will work with standard OpenAI API

**Option B: Add Fallback Logic**
- Keep Azure as primary
- Fall back to OpenAI if Azure fails
- Requires both Azure setup AND OpenAI API key

## Files Affected

If you need to make configuration changes:
- `podman-compose.yml` - Environment variables (lines 21-33)
- No code changes needed - just config updates

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| OAuth Token Endpoint | ✅ Working | Successfully getting tokens from `https://api.uhg.com/oauth2/token` |
| Client Credentials | ✅ Valid | Authentication succeeds with configured CLIENT_ID/SECRET |
| Model Deployment Name | ❌ Wrong | `gpt-4o-mini_2024-07-18` is rejected by Azure |
| API Endpoint | ❓ Unclear | May be correct or incorrect |
| API Version | ❓ Unclear | `2025-01-01-preview` - need verification |
| Project ID | ❓ Unclear | Valid but may not be authorized |

**Next Step**: Contact UHG IT with answers to the 5 questions above.
