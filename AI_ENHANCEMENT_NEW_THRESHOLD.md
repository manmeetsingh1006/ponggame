# AI Enhancement with New Threshold: $50+/month OR Critical/High Severity

**Last Updated**: January 27, 2026
**Status**: ✅ DEPLOYED

---

## 🎯 New AI Trigger Criteria

### When AI Kicks In:
- **Savings > $50/month** OR **Severity = critical/high**
- Only high-value recommendations get AI enhancement
- Other recommendations skip AI to optimize costs

### Why $50 Threshold?
1. **Cost Optimization**: Avoids expensive AI API calls for minor recommendations
2. **ROI Balance**: $50+ savings justifies the AI enhancement cost
3. **Performance**: Fewer API calls = faster response time
4. **Quality**: AI focuses on impactful recommendations

---

## 📊 How It Works

### Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER REQUESTS RECOMMENDATIONS                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: RULE-BASED ANALYSIS                               │
│ Generate 9-15 cost recommendations from all clouds          │
│ Each recommendation gets: title, description, savings, etc. │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: THRESHOLD FILTER (Line 485 in metrics.py)         │
│                                                              │
│ For each recommendation:                                    │
│   Check: Savings > $50/month?  → YES ✅ (add to high_value)│
│   Check: Severity = critical? → YES ✅ (add to high_value) │
│   Check: Severity = high?     → YES ✅ (add to high_value) │
│   Check: Severity = low?      → NO ❌ (skip AI)           │
│                                                              │
│ Result: Only high-value recommendations marked for AI      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: CACHE CHECK (24-hour TTL)                         │
│                                                              │
│ For each high-value recommendation:                         │
│   Is it in cache?                                          │
│   YES → Return cached response (fast) ✅                    │
│   NO → Continue to Stage 4                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ STAGE 4: AI ENHANCEMENT (8-second timeout)                 │
│                                                              │
│ For each high-value recommendation not in cache:           │
│   1. UHG OAuth2 → Get JWT token                           │
│   2. Call Azure OpenAI via UHG gateway (max 8 seconds)    │
│   3. Get: AI insights, steps, risk, ROI                   │
│   4. Cache response for 24 hours                          │
│   5. Return enhanced recommendation                        │
│                                                              │
│ If timeout (>8s):                                         │
│   → Use rule-based fallback (graceful degradation)        │
│                                                              │
│ If error:                                                  │
│   → Use rule-based fallback (graceful degradation)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FINAL: RETURN MIXED RECOMMENDATIONS                        │
│                                                              │
│ ✅ AI-Enhanced (high-value):                               │
│    - With detailed insights & steps                        │
│    - Purple cards in frontend                              │
│                                                              │
│ ⚪ Standard (low-value):                                   │
│    - Basic information only                                │
│    - Gray cards in frontend                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 Caching Strategy

### 24-Hour Cache TTL

```python
Cache Key: MD5(rule_id + provider)
Cache Value: {
    timestamp: datetime now,
    ai_insight: {...},
    implementation_steps: [...],
    roi_breakdown: {...}
}
TTL: 24 hours from timestamp

Behavior:
- First Request: Generate AI response, cache it
- Same Request Within 24h: Return cached (instant)
- Request After 24h: Generate new AI response, update cache
```

### Benefits
- ✅ Instant response for repeated queries
- ✅ 24-hour relevance (recommendation stays valid 1 day)
- ✅ Reduced Azure OpenAI API calls
- ✅ Cost optimization
- ✅ Better user experience (faster responses)

---

## ⏱️ Timeout Handling

### 8-Second Timeout

```python
try:
    ai_enhancement = await asyncio.wait_for(
        call_azure_openai(rec),
        timeout=8.0  # 8 seconds maximum
    )
except asyncio.TimeoutError:
    # Graceful fallback
    use_rule_based_fallback()
```

### Why 8 Seconds?
1. **User Experience**: Won't block page load >8s
2. **Server Health**: Prevents hanging requests
3. **Cost Control**: Limits expensive API calls
4. **Reliability**: Fast failure = happy users

### Timeout Behavior
- If Azure OpenAI responds within 8s → Use AI enhancement ✅
- If Azure OpenAI takes >8s → Use fallback (rule-based) ⚠️
- User still gets recommendation, just without AI insights
- No error, graceful degradation

---

## 📋 Current Recommendations Status

Based on new $50+ threshold:

### High-Value (GET AI ENHANCEMENT) ✅

**AWS**:
- Stop Idle EC2 Instances: $75/month → AI ENHANCED
- Optimize RDS Instance Size: $50/month → AI ENHANCED
- Enable AWS EBS Encryption: $0/critical severity → AI ENHANCED

**Azure**:
- Right-Size VM Instances: $60/month → AI ENHANCED
- Enable Auto-Shutdown: $45/month → NOT AI (below $50)
- Configure Disk Snapshot Policy: $0/high severity → AI ENHANCED

**GCP**:
- Commit to GCP Discounted Rates: $50/month → Not quite ($50 needs >50) → Could be borderline
- Enable VPC Flow Logs Optimization: $0/critical severity → AI ENHANCED
- Optimize GKE Cluster Costs: $0/high severity → AI ENHANCED

**With New Threshold**:
- Estimated: 7-8 out of 9 recommendations get AI enhancement
- Cost savings on AI API calls: ~15-20%
- Performance improvement: Fewer API calls

### Low-Value (SKIP AI) ❌

Example (hypothetical):
- Add resource tags: $0.05/month + low severity → NO AI

---

## 🔧 Configuration

### Backend Code Location
**File**: `backend/app/api/v1/metrics.py`
**Line**: 485

### Current Settings
```python
# Threshold: $50/month OR critical/high severity
high_value = [
    r for r in recommendations
    if (r.get("estimated_savings", 0) > 50.0 or r.get("severity") in ["critical", "high"])
]

# Cache: 24-hour TTL
cache_ttl = timedelta(hours=24)

# Timeout: 8 seconds
timeout=8.0
```

### To Modify Threshold

**Increase to $100** (very strict):
```python
if (r.get("estimated_savings", 0) > 100.0 or ...)
```

**Decrease to $10** (more permissive):
```python
if (r.get("estimated_savings", 0) > 10.0 or ...)
```

**Change Cache TTL to 12 hours**:
```python
cache_ttl = timedelta(hours=12)
```

**Increase Timeout to 15 seconds**:
```python
timeout=15.0
```

---

## 📊 Performance Metrics

| Metric | Value | Impact |
|--------|-------|--------|
| AI Threshold | $50/month | Cost-optimized |
| High-Value Recommendations | ~7-8 of 9 | Reduced API calls |
| Cache TTL | 24 hours | Fast responses |
| API Timeout | 8 seconds | Reliable performance |
| Fallback Strategy | Rule-based | Graceful degradation |
| Estimated API Calls | 7-8 per request | ~20% reduction |
| Cost Savings (AI) | ~15-20% | Lower Azure OpenAI costs |

---

## ✅ Why You Might NOT See AI Enhancement

### 1. **All Recommendations Below Threshold**
```
Scenario: All recommendations have <$50 savings AND low severity
Result: 0 recommendations get AI enhancement
Display: All gray cards (standard format)
```

### 2. **Azure AI Timeout (>8 seconds)**
```
Scenario: Azure OpenAI API is slow
Result: Request times out after 8s
Display: Recommendation shown with rule-based fallback
Status: No error, graceful degradation
```

### 3. **Cache Being Used (24-hour window)**
```
Scenario: Same recommendation requested multiple times within 24h
Result: Uses cached AI response instead of new API call
Display: Same AI enhancement from cache
Benefit: Instant response, zero API cost
```

### 4. **Azure AI Unavailable**
```
Scenario: Azure OpenAI service down or unreachable
Result: Exception caught, fallback to rule-based
Display: Recommendation with standard format
Status: No user-facing error
```

---

## 📈 Expected Outcomes

### Before ($0.10 Threshold)
- All 9 recommendations get AI enhancement
- High API call volume (9 calls per request)
- Higher Azure OpenAI costs
- More detailed insights for low-value recommendations

### After ($50 Threshold)
- ~7-8 recommendations get AI enhancement
- Lower API call volume (7-8 calls per request)
- Reduced Azure OpenAI costs (~20%)
- Focused AI insights on high-impact items
- Standard format for low-value recommendations
- Better performance (fewer API calls)

---

## 🚀 Deployment Checklist

- [x] Updated threshold to $50/month
- [x] Added 24-hour cache with TTL
- [x] Added 8-second timeout handling
- [x] Added graceful fallback (rule-based)
- [x] Added detailed logging
- [x] Tested with multiple recommendations
- [x] Verified Azure OpenAI integration
- [x] Tested timeout scenario
- [x] Verified cache functionality
- [x] Updated documentation

---

## 📞 Support

### Debug Logging

Check backend logs for:
```
[AI Threshold] High-value recommendations: X/9
  ✓ rule_id_1: savings $75
  ✓ rule_id_2: severity critical
[Cache HIT] rule_id_1 - using 24h cached response
[Cache STORE] rule_id_2 - cached for 24h
[AI Enhancement] Processing rule_id_3 with 8s timeout...
[AI Timeout] rule_id_4 exceeded 8-second limit, using fallback
```

### Performance Tips

1. **First request**: Slower (all AI calls) - up to 8s total
2. **Same recommendation within 24h**: Instant (uses cache)
3. **Different recommendations**: Standard API calls
4. **High load**: Timeouts may occur, uses fallback

### Contact

For issues with AI enhancement:
1. Check backend logs for timeout/error messages
2. Verify Azure OpenAI service is accessible
3. Check cache status (should grow over time)
4. Verify UHG OAuth2 credentials

