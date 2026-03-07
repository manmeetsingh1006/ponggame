# 🤖 AI RECOMMENDATIONS FLOW - COMPLETE GUIDE

**Status:** ✅ AI recommendations are set up and working  
**Endpoint:** `GET /api/metrics/recommendations/{client_id}` (requires auth)

---

## 1. HOW AI RECOMMENDATIONS ARE TRIGGERED

### 📊 STEP-BY-STEP FLOW

```
User Request
  ↓
GET /api/metrics/recommendations/1
  ↓
┌─────────────────────────────────────────┐
│ 1. Fetch Cloud Resources (AWS/Azure/GCP)│
├─────────────────────────────────────────┤
│ EC2, S3, RDS, VMs, Storage, etc.       │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 2. Apply Analysis Rules (Pure Python)   │
├─────────────────────────────────────────┤
│ Check:                                  │
│ - Stopped instances                     │
│ - Unencrypted storage                   │
│ - Missing high availability             │
│ - Open security groups                  │
│ - Untagged resources                    │
└──────────────────┬──────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│ 3. Calculate Savings & Severity         │
├─────────────────────────────────────────┤
│ Returns list of recommendations with:   │
│ - Estimated monthly savings ($)         │
│ - Severity (critical/high/medium/low)   │
│ - Affected resources                    │
└──────────────────┬──────────────────────┘
                   ↓
        ✅ HERE IS WHERE AI KICKS IN
                   ↓
┌─────────────────────────────────────────┐
│ 4. CHECK: Is Recommendation High-Value? │
├─────────────────────────────────────────┤
│ Conditions:                             │
│ - Savings > $50 per month      OR       │
│ - Severity = critical/high              │
└──────────────────┬──────────────────────┘
                   ↓
          ┌────────┴────────┐
          │                 │
        NO                 YES
          │                 │
          ↓                 ↓
      SKIP AI          ┌──────────────────────┐
      Return as-is     │ 5. Check Cache       │
                       ├──────────────────────┤
                       │ Cache Key:           │
                       │ {provider}_hash      │
                       │ TTL: 24 hours        │
                       └──────┬───────────────┘
                              ↓
                       ┌──────────────┐
                       │ Cache Hit?   │
                       └──┬────────┬──┘
                         YES      NO
                          │        │
                          ↓        ↓
                    Return     ┌──────────────────────┐
                    Cached     │ 6. Call Azure AI     │
                    Data       ├──────────────────────┤
                              │ Send:                │
                              │ - Recommendation     │
                              │   titles             │
                              │ - Descriptions       │
                              │ - Savings estimate   │
                              │                      │
                              │ Get:                 │
                              │ - Implementation     │
                              │   steps              │
                              │ - Risks              │
                              │ - Timeline           │
                              │ - Additional        │
                              │   benefits           │
                              │                      │
                              │ Timeout: 8 seconds   │
                              └──────┬───────────────┘
                                     ↓
                            ┌────────────────┐
                            │ Success?       │
                            └──┬─────────┬───┘
                              YES      NO
                               │        │
                               ↓        ↓
                          ┌──────┐  Return as-is
                          │      │  (no AI)
                          ↓      
                    ┌──────────────────────┐
                    │ 7. Add AI Fields     │
                    ├──────────────────────┤
                    │ llm_enhancement:     │
                    │ "✅ AI-enhanced..."  │
                    │                      │
                    │ ai_insights:         │
                    │ "Specific steps..."  │
                    └──────┬───────────────┘
                           ↓
                    ┌──────────────────────┐
                    │ 8. Cache Result      │
                    │ 24-hour TTL          │
                    └──────┬───────────────┘
                           ↓
        ┌──────────────────────────────────┐
        │ Return Full JSON to User         │
        ├──────────────────────────────────┤
        │ {                                │
        │   "client_id": 1,                │
        │   "recommendations": [           │
        │     {                            │
        │       "title": "...",            │
        │       "estimated_savings": 150,  │
        │       "severity": "high",        │
        │       "llm_enhancement": "✅...", │
        │       "ai_insights": "..."       │
        │     }                            │
        │   ]                              │
        │ }                                │
        └──────────────────────────────────┘
```

---

## 2. WHEN AI RECOMMENDATIONS APPEAR

### ✅ AI Enhancement HAPPENS When:

```python
# Condition 1: High Savings ($50+)
if rec.get("estimated_savings", 0) > 50:
    # ✅ AI will enhance this recommendation
    pass

# Condition 2: Critical/High Severity
if rec.get("severity") in ["critical", "high"]:
    # ✅ AI will enhance this recommendation
    pass

# Both conditions must be checked
high_value = (savings > 50) OR (severity in ["critical", "high"])
```

### ❌ AI Enhancement SKIPPED When:

```python
# Low savings + low severity = no AI enhancement
if estimated_savings < 50 AND severity == "low":
    # ❌ NOT enhanced by AI
    # Just returned as-is
    pass
```

---

## 3. EXAMPLE: WHEN YOU'LL SEE AI RECOMMENDATIONS

### **SCENARIO 1: Stopped EC2 Instances** ✅ Gets AI Enhancement

```json
{
  "id": "rec_1",
  "category": "cost",
  "severity": "high",                    // ← High severity ✅
  "title": "5 Stopped EC2 Instance(s)",
  "description": "EC2 instances in stopped state still incur EBS costs",
  "estimated_savings": 75.00,            // ← > $50 ✅
  "affected_resources": [...],
  "recommendation": "Create AMI for backup and terminate instances",
  
  // ✅ AI ENHANCEMENT FIELDS (Added by Azure AI):
  "llm_enhancement": "✅ AI-enhanced with implementation details",
  "ai_insights": "Specific implementation steps, risks, timeline, benefits..."
}
```

### **SCENARIO 2: Untagged Resources** ❌ NO AI Enhancement

```json
{
  "id": "rec_5",
  "category": "operational",
  "severity": "low",                     // ← Low severity ❌
  "title": "50 Resource(s) Without Tags",
  "description": "Resources without tags are hard to manage",
  "estimated_savings": 0,                // ← $0 savings ❌
  "affected_resources": [...],
  "recommendation": "Implement tagging strategy",
  
  // ❌ NO AI FIELDS (doesn't meet threshold)
  // Returns as-is - no llm_enhancement or ai_insights
}
```

### **SCENARIO 3: Unencrypted S3** ✅ Gets AI Enhancement

```json
{
  "id": "rec_2",
  "category": "security",
  "severity": "critical",                // ← Critical severity ✅
  "title": "3 Unencrypted S3 Bucket(s)",
  "description": "S3 buckets without encryption expose data",
  "estimated_savings": 0,                // ← $0 but critical ✅
  "affected_resources": [...],
  "recommendation": "Enable AES-256 or KMS encryption",
  
  // ✅ AI ENHANCEMENT FIELDS (Added because severity=critical):
  "llm_enhancement": "✅ AI-enhanced with implementation details",
  "ai_insights": "Step-by-step encryption setup, compliance benefits..."
}
```

---

## 4. HOW TO TEST AI RECOMMENDATIONS

### Test 1: Check Current Recommendations (with AI)

```bash
# Make request to endpoint
curl -s -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  http://localhost:8000/api/metrics/recommendations/1 | jq '.'

# Look for recommendations with:
# - "llm_enhancement": "✅ AI-enhanced..."
# - "ai_insights": "<detailed analysis>"
```

### Test 2: View Without Cache (Force Fresh AI Call)

```bash
# Clear LLM cache (requires backend access)
# Open Python terminal in backend directory:
python3 -c "
import sys
sys.path.insert(0, '/path/to/backend')
from app.api.v1.metrics import llm_cache
llm_cache.clear()
print('Cache cleared')
"

# Then make request again
curl -s http://localhost:8000/api/metrics/recommendations/1
```

### Test 3: Monitor Azure AI Calls

```bash
# Watch backend logs for Azure AI calls
tail -f backend.log | grep -i "azure\|enhancement\|timeout"

# Look for:
# - "Calling Azure AI enhancement..."
# - "Azure AI enhancement timeout" (if timeout)
# - "Azure AI enhancement failed" (if error)
```

---

## 5. CONFIGURATION: HOW TO ADJUST AI TRIGGERS

### Change the $50 Threshold

**File:** [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L2210)

```python
# Current: $50 minimum for AI enhancement
high_value_recs = [
    rec for rec in recommendations
    if rec.get("estimated_savings", 0) > 50  # ← Change this number
    or rec.get("severity") in ["critical", "high"]
]

# Examples:
# > 10     = AI enhances more recommendations (more API calls)
# > 100    = AI enhances fewer (fewer API calls, faster)
# > 500    = AI only enhances high-value recommendations
```

### Change AI Timeout

**File:** [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L2242)

```python
# Current: 8 seconds timeout
enhanced_response = await asyncio.wait_for(
    ai_service.chat_completion(...),
    timeout=8.0  # ← Change this value
)

# Examples:
# timeout=5.0   = Faster, but may timeout more often
# timeout=10.0  = Slower, but more reliable
# timeout=15.0  = Very slow, but guaranteed response
```

### Change Cache TTL (How Long AI Results Stay Cached)

**File:** [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L28)

```python
# Current: 24 hours
LLM_CACHE_TTL = 86400  # ← 24 hours in seconds

# Examples:
LLM_CACHE_TTL = 3600    # 1 hour (more fresh, more API calls)
LLM_CACHE_TTL = 43200   # 12 hours (balanced)
LLM_CACHE_TTL = 604800  # 7 days (fewer API calls, but stale)
LLM_CACHE_TTL = 0       # Disable cache (always call AI)
```

---

## 6. CURRENT STATUS & VERIFICATION

### ✅ What's Working

```
✅ Recommendations are being generated
✅ High-value recommendations filtered correctly
✅ Azure AI is being called for eligible recommendations
✅ Cache is working (24-hour TTL)
✅ Timeout protection in place (8 seconds)
✅ Graceful fallback if Azure AI fails
✅ Results properly formatted with AI fields
```

### 🔍 How to Verify It's Working

```bash
# 1. Check backend is running
curl -s http://localhost:8000/health

# 2. Get recommendations with AI
curl -s -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/metrics/recommendations/1 | \
  jq '.recommendations[] | select(.llm_enhancement != null) | {title, severity, llm_enhancement, ai_insights}'

# 3. Count how many recommendations got AI enhancement
curl -s http://localhost:8000/api/metrics/recommendations/1 | \
  jq '[.recommendations[] | select(.llm_enhancement != null)] | length'
```

---

## 7. TROUBLESHOOTING: Why You Don't See AI Recommendations

### Issue 1: All Recommendations Have Low Severity

**Problem:** Savings < $50 AND severity not critical/high  
**Solution:** Check if resources need attention first

```bash
# List all recommendations to see severity
curl -s http://localhost:8000/api/metrics/recommendations/1 | \
  jq '.recommendations[] | {title, severity, estimated_savings}'
```

### Issue 2: Azure AI Timeout

**Problem:** Azure AI taking too long (>8 seconds)  
**Solution:** Recommendations still returned without AI enhancement

```bash
# Check logs for timeout
grep "enhancement timeout" backend.log

# Solution: Increase timeout in metrics.py (line 2242)
timeout=15.0  # Instead of 8.0
```

### Issue 3: No Eligible Recommendations

**Problem:** All recommendations are low value  
**Solution:** Generate more resources or check provider integration

```bash
# Verify resources are being fetched
curl -s http://localhost:8000/api/metrics/resources/1 | jq '.summary'

# If empty, check cloud credentials
curl -s http://localhost:8000/api/metrics/recommendations/1 | \
  jq '.recommendations[] | select(.category=="error")'
```

### Issue 4: LLM Cache Is Too Old

**Problem:** Using cached results from 24 hours ago  
**Solution:** Clear cache and force fresh AI call

```bash
# Backend Python REPL
python3 << 'EOF'
from app.api.v1.metrics import llm_cache
llm_cache.clear()
print("Cache cleared - fresh AI calls will be made")
EOF
```

---

## 8. EXAMPLE: FULL RESPONSE WITH AI RECOMMENDATIONS

```json
{
  "client_id": 1,
  "client_name": "Production AWS",
  "provider": "aws",
  "recommendations": [
    {
      "id": "rec_1",
      "category": "cost",
      "severity": "high",
      "title": "2 Stopped EC2 Instance(s)",
      "description": "EC2 instances in stopped state still incur EBS storage costs",
      "impact": "Potential savings: $6.00/month",
      "affected_resources": [
        {"id": "i-12345678", "name": "old-server", "type": "t3.medium"}
      ],
      "recommendation": "Create AMI for backup and terminate instances",
      "estimated_savings": 6.00,
      
      // ✅ AI ENHANCEMENT (Added by Azure AI):
      "llm_enhancement": "✅ AI-enhanced with implementation details",
      "ai_insights": "1. Create AMI snapshot (5 min)\n2. Terminate instance (1 min)\n3. Verify no dependencies..."
    },
    {
      "id": "rec_2",
      "category": "security",
      "severity": "critical",
      "title": "1 Unencrypted S3 Bucket(s)",
      "description": "S3 buckets without encryption are vulnerable",
      "impact": "Data security risk",
      "affected_resources": [...],
      "recommendation": "Enable AES-256 or AWS KMS encryption",
      "estimated_savings": 0,
      
      // ✅ AI ENHANCEMENT (Added by Azure AI):
      "llm_enhancement": "✅ AI-enhanced with implementation details",
      "ai_insights": "Compliance: HIPAA requires encryption. Timeline: 30 min..."
    },
    {
      "id": "rec_5",
      "category": "operational",
      "severity": "low",
      "title": "20 Resource(s) Without Tags",
      "recommendation": "Implement tagging strategy",
      "estimated_savings": 0,
      
      // ❌ NO AI ENHANCEMENT (Doesn't meet threshold)
    }
  ],
  "summary": {
    "total_recommendations": 3,
    "by_category": {"cost": 1, "security": 1, "operational": 1},
    "by_severity": {"critical": 1, "high": 1, "low": 1},
    "total_potential_savings_monthly": 6.00
  }
}
```

---

## ✅ SUMMARY

**AI Recommendations are:**
- ✅ Enabled and working
- ✅ Applied to recommendations with `savings > $50` OR `severity in [critical, high]`
- ✅ Cached for 24 hours
- ✅ Protected with 8-second timeout
- ✅ Fallback to original if Azure AI fails
- ✅ Added as `llm_enhancement` and `ai_insights` fields

**Next Steps:**
1. Test with your cloud resources
2. Check logs for "enhancement" messages
3. Verify `llm_enhancement` field appears in responses
4. Adjust $50 threshold if needed
