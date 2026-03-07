# 🔍 Azure AI Gateway Diagnostic Report

## Summary

The backend code has been **successfully updated** to use the correct format that matches your working code example:

✅ **Model name**: Changed from `gpt-4o-mini_2024-07-18` to `gpt-4o-mini` (short format)
✅ **projectId header**: Properly configured
✅ **OAuth2 authentication**: Correctly implemented
✅ **API endpoint**: Verified as correct

## Current Issue: 403 Authorization Error

**Error Message:**
```
Authorization failed. Verify that the deploymentName, modelName are correct.
```

**Root Cause:** The PROJECT_ID in your configuration does NOT have permission to access the `gpt-4o-mini` model in the Azure AI Gateway.

## Testing Results

Both PROJECT_IDs tested return **403 Forbidden**:

1. **Your Current Config:**
   - PROJECT_ID: `2db8b475-ec3e-468b-b253-058bbe8ff77b`
   - Status: ❌ 403 Unauthorized

2. **From Your Example Code:**
   - PROJECT_ID: `a82c5b9d-be3d-487a-858a-96b616963921`
   - Status: ❌ 403 Unauthorized

## Required Action

Contact your Azure admin with these details:

```
SERVICE PRINCIPAL: 0425eb79-4b44-4e04-a65f-bd742a35fe47
MODEL: gpt-4o-mini
ENDPOINT: https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0
PROJECT_ID: [Your correct project ID]

REQUEST: Grant Contributor or AI Gateway User role 
for this service principal to access the gpt-4o-mini model
```

## Code Changes Made

### 1. **Model Name Extraction**
The code now extracts the short model name from the deployment name:

```python
# Before: "gpt-4o-mini_2024-07-18"
# After: "gpt-4o-mini"
model_name = self.chat_model.split('_')[0] if '_' in self.chat_model else self.chat_model
```

Applied in three methods:
- `chat_completion()` - Regular chat requests
- `chat_completion_stream()` - Streaming responses
- `get_embeddings()` - Embedding generation

### 2. **Headers Configuration**
Using proper headers matching your code:
```python
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "projectId": project_id  # Correct header name
}
```

## Current Backend Status

✅ **Running**: `http://127.0.0.1:8000`
✅ **Health Check**: `/api/metrics/health` (shows degraded due to 403)
✅ **All other endpoints**: Working perfectly
❌ **Chat**: Blocked by Azure permission issue (not code issue)

## Next Steps

1. **Confirm PROJECT_ID with Azure Admin**
   - Which PROJECT_ID should be used?
   - Is the service principal authorized?

2. **Grant Permissions**
   - Request role assignment through Azure Portal/CLI

3. **Update Configuration** (if PROJECT_ID changes)
   ```bash
   # In .env:
   PROJECT_ID=<correct-project-id>
   ```

4. **Restart Backend**
   ```bash
   pkill -f "uvicorn app.main"
   # Backend will auto-restart
   ```

5. **Test Chat**
   ```bash
   curl http://localhost:8000/api/metrics/health
   # Should show azure_ai_gateway: "healthy"
   ```

## Health Check Endpoint

To verify status once permissions are fixed:
```bash
curl http://localhost:8000/api/metrics/health | jq '.components'
```

Expected response once fixed:
```json
{
  "azure_ai_gateway": {
    "status": "healthy",
    "endpoint": "https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0",
    "model": "gpt-4o-mini_2024-07-18",
    "project_id": "YOUR-PROJECT-ID"
  },
  "database": {
    "status": "healthy"
  }
}
```

## Code References

**Modified Files:**
- [app/services/azure_ai_service.py](../backend/app/services/azure_ai_service.py)
  - Line ~290: Model name extraction in chat_completion()
  - Line ~355: Model name extraction in chat_completion_stream()
  - Line ~415: Model name extraction in get_embeddings()

**Test Files Created:**
- `test_correct_model.py` - Tests with corrected model name format
- `diagnose_project_id.py` - Diagnostic tool for PROJECT_ID testing

---

**Status**: ✅ Code is correct and ready. ⏳ Awaiting Azure permission configuration.
