# AI Recommendations - Quick Setup Card

## Current Status
```
✅ Stage 1: Rule-Based Analysis    - WORKING on all clouds
🔮 Stage 2: AI Enhancement        - FRAMEWORK READY, needs credentials
❌ Azure OpenAI Integration       - BLOCKED, waiting for API credentials
```

---

## What You Get When AI is Enabled

| Feature | Before AI | After AI |
|---------|-----------|----------|
| **Recommendations** | 9 total | 9 total |
| **Monthly Savings** | $280 | $280 |
| **Details** | Basic | Enhanced |
| **Implementation Steps** | 6 generic steps | Custom steps per recommendation |
| **Risk Analysis** | Generic warning | Specific risks identified |
| **ROI Breakdown** | Simple | Detailed with implementation cost |
| **Time to Create** | <100ms | <8000ms (8 second timeout) |

---

## 5-Minute Setup

### Prerequisites
- Azure account with billing enabled
- 5 minutes of free time

### 1. Create OpenAI Resource (2 min)
```
Azure Portal → Create Resource → "Azure OpenAI"
→ Fill in details → Create
```

### 2. Deploy Model (2 min)
```
Azure OpenAI Studio → Deployments → "Create new deployment"
→ Model: gpt-4o-mini
→ Name: gpt-4o-mini
→ Create
```

### 3. Get Credentials (1 min)
```
Azure Portal → "Keys and Endpoint"
→ Copy API Key and Endpoint URL
```

### 4. Configure Backend
```bash
kill $(lsof -t -i:8000)

# Replace with YOUR credentials:
export AZURE_OPENAI_API_KEY="your-key-here"
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"

cd backend && python3 -m app.main
```

### 5. Verify
```bash
python3 /tmp/test_ai_recommendations.py
# Look for: "AI Enhanced: True" ✓
```

---

## Sample API Response

### Current (Rule-Based):
```json
{
  "ai_enhanced": false,
  "ai_insight": "Rule-based analysis identified this as a HIGH priority opportunity.",
  "implementation_steps": ["Review configuration", "Create plan", ...],
  "roi_breakdown": {"monthly_savings": "$75.00", "annual_savings": "$900.00", ...}
}
```

### With AI Enabled:
```json
{
  "ai_enhanced": true,
  "ai_insight": "Stopped instances still incur full compute charges and waste $75-100 monthly.",
  "implementation_steps": [
    "List stopped instances with AWS CLI",
    "Check CloudTrail for last activity",
    "Create AMI backup for archival",
    "Terminate instances",
    "Verify billing change within 24 hours"
  ],
  "roi_breakdown": {
    "monthly_savings": "$75.00",
    "annual_savings": "$900.00",
    "implementation_cost": "$0.00",
    "payback_period": "Immediate"
  }
}
```

---

## Cost of AI

- **Per Recommendation**: ~$0.0002
- **Per Analysis**: ~$0.002 (9 recommendations)
- **Monthly** (10 analyses/day): ~$0.60
- **Annual**: ~$7.20

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "AI not available" | Set environment variables with API key |
| "Invalid endpoint" | Check URL format: `https://resource.openai.azure.com/` |
| "Timeout error" | System falls back to rule-based (8s timeout) |
| "Auth failed" | Verify API key in Azure Portal |

---

## Key Files

- **Backend Code**: `backend/app/api/v1/metrics.py`
- **Setup Guide**: `AI_SETUP_AZURE_OPENAI.md`
- **Current Status**: `AI_RECOMMENDATIONS_STATUS.md`
- **Test Script**: `/tmp/test_ai_recommendations.py`

---

## Architecture

```
Rules Engine
    ↓
[Rule 1: Stopped resources → $$$]
[Rule 2: Unencrypted storage → Security]
[Rule 3: Unoptimized config → $$$]
    ↓
Filter High-Value Recommendations
    ↓
(IF Azure OpenAI configured)
    ↓
Send to AI for Enhancement
    ↓
Return Enriched Recommendations
    ↓
Display to User
```

---

## All Clouds Working ✅

- **AWS**: 3 rules, $125/month, Critical/High/Medium severity
- **Azure**: 3 rules, $105/month, Critical/High/Medium severity  
- **GCP**: 3 rules, $50/month, Critical/High severity

**Total Opportunity**: $280/month across all clouds

---

## After Completing Setup

1. ✅ Backend restarted with credentials
2. ✅ Metrics page loads all recommendations
3. ✅ AI details show rich implementation steps
4. ✅ Users see detailed guidance for each recommendation
5. ✅ ROI breakdown includes implementation costs
6. ✅ Risk analysis is specific to each recommendation

---

**Ready to activate AI? Provide your Azure OpenAI credentials and I'll set it up for you!**

See `AI_SETUP_AZURE_OPENAI.md` for step-by-step Azure Portal instructions.
