# AI Recommendations Debugging Guide

## What We've Added

We've enhanced the recommendation system with better logging and tracking to diagnose why AI recommendations might not be appearing:

### 1. **Enhanced Logging in `enhance_recommendations_with_llm()`**

The function now logs:
- ✅ How many recommendations are being analyzed
- ✅ Whether they meet the threshold ($1+ savings or critical/high severity)
- ✅ Success/failure of Azure AI service calls
- ✅ Whether AI enhancement was applied (via `has_ai_enhancement` flag)

### 2. **Fields Added to Each Recommendation**

After enhancement, each recommendation now includes:
```json
{
  "title": "...",
  "description": "...",
  "has_ai_enhancement": true/false,
  "llm_enhancement": "✅ AI-enhanced with implementation details",  // if enhanced
  "ai_insights": "..."  // excerpt from AI response
}
```

### 3. **How to Check if AI Recommendations Are Working**

#### Step 1: Check the backend logs for these messages:
```
Found X high-value recommendations out of Y total for AWS
✓ Azure AI enhancement successful: X recommendations enhanced
✓ Enhanced recommendations cached: Y total
```

#### Step 2: If you see "No high-value recommendations found":
This means the generated recommendations don't meet the filter criteria:
- `estimated_savings > $1` (changed from $5), OR
- `severity` is "critical" or "high"

#### Step 3: If you see Azure AI errors:
Common issues:
- **Timeout**: Azure AI Gateway took too long (>8 seconds)
- **Auth failure**: AZURE_AI_CLIENT_ID, AZURE_AI_CLIENT_SECRET, or AZURE_AI_PROJECT_ID invalid
- **Service unavailable**: UHG AI Gateway is down

### 4. **Recommendation Filtering Logic**

The AI enhancement now only processes recommendations where:
```python
rec.get("estimated_savings", 0) > 1  # At least $1 savings
OR
rec.get("severity") in ["critical", "high"]  # Critical/high severity
```

### 5. **Why Recommendations Might Not Appear**

**Reason 1: No resources found**
- Cloud provider credentials not working
- No resources in the cloud account
- Resource filters are too restrictive

**Reason 2: All recommendations are low-value**
- Estimated savings < $1 AND
- Severity is "medium" or "low"
- **Solution**: Adjust threshold in metrics.py line 2221

**Reason 3: Azure AI service failing**
- Check credentials: AZURE_AI_CLIENT_ID, AZURE_AI_CLIENT_SECRET, AZURE_AI_PROJECT_ID
- Check network connectivity to api.uhg.com
- Check backend logs for specific error messages

### 6. **How to Test**

```bash
# Get token
TOKEN=$(python3 << 'PYEOF'
import jwt
from datetime import datetime, timedelta
JWT_SECRET = "your-secret"
payload = {"sub": "test", "client_id": 1, "iat": datetime.utcnow(), "exp": datetime.utcnow() + timedelta(hours=24)}
print(jwt.encode(payload, JWT_SECRET, algorithm="HS256"))
PYEOF
)

# Test recommendations endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/chat/recommendations/1
```

### 7. **Recent Changes**

**Commit: 25a781f** - Added AI enhancement logging and tracking
- Line 2224: Log count of high-value recommendations found
- Line 2226: Log when no high-value recommendations found
- Line 2271: Flag recommendations as `has_ai_enhancement=True` if enhanced
- Line 2274-2276: Mark non-enhanced recommendations as `has_ai_enhancement=False`
- Line 2280-2282: Add logging on successful enhancement caching
- Line 2287-2290: Better error logging for timeout/failure cases

### 8. **Next Steps to Diagnose**

1. ✅ Check backend logs for enhancement messages
2. Check if resources are being fetched correctly
3. Verify Azure AI credentials are valid
4. Test with mock recommendations that exceed the $1 threshold
5. Monitor network connectivity to UHG AI Gateway

---

**Status**: ✅ Logging infrastructure added, ready for testing
