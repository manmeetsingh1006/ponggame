# AI Recommendations - Quick Reference

## 🤖 What's New

Recommendations are now clearly marked as either:
- **🤖 AI-Enhanced** - Augmented with Azure AI insights
- **Standard** - Regular cloud analysis recommendations

---

## Visual Markers

### In the Title
```
🤖 12 Stopped EC2 Instances          ← AI-Enhanced
2 Unencrypted S3 Buckets             ← Standard
```

### In the Response
```json
{
  "ai_badge": "🤖 AI-Enhanced",      ← AI recommendations
  "ai_enhanced": true,
  "ai_generated": true,
  "enhancement_details": "..."        ← Full AI response
}
```

---

## Recommendation Filtering

**Threshold for AI Enhancement**: 
- Estimated savings > **$1** OR Severity is **critical/high**

**Everything Else**: Standard recommendations (no AI)

---

## Response Fields Reference

| Field | AI-Enhanced | Standard |
|-------|:-----------:|:--------:|
| `ai_enhanced` | true | false |
| `ai_generated` | true | false |
| `ai_badge` | 🤖 AI-Enhanced | Standard |
| `title` (prefix) | 🤖 Added | None |
| `enhancement_details` | Full text | Not present |
| `ai_insights` | Brief excerpt | Not present |
| `has_ai_enhancement` | true | false |

---

## Example Response

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/metrics/recommendations/1 | jq '.'
```

**Result:**
```json
{
  "recommendations": [
    {
      "title": "🤖 5 Stopped EC2 Instances",
      "severity": "high",
      "estimated_savings": 15.00,
      "ai_enhanced": true,
      "ai_badge": "🤖 AI-Enhanced",
      "enhancement_details": "To reduce costs for stopped EC2..."
    },
    {
      "title": "Outdated Security Group Rules",
      "severity": "medium",
      "estimated_savings": 0,
      "ai_enhanced": false,
      "ai_badge": "Standard"
    }
  ]
}
```

---

## How It Works

```
Fetch Cloud Resources
        ↓
Analyze for Issues → Generate Recommendations
        ↓
Filter High-Value (>$1 savings OR critical/high severity)
        ↓
✅ Send to Azure AI for Enhancement
✅ Add 🤖 Badge + AI Details
✅ Return Marked Recommendations
        ↓
Frontend Shows 🤖 Next to AI-Enhanced Ones
```

---

## Key Fields to Display

### For AI-Enhanced Recommendations
1. **Title**: Use as-is (already has 🤖)
2. **ai_badge**: "🤖 AI-Enhanced"
3. **enhancement_details**: Show in an "AI Insights" section
4. **category + severity**: Show normally

### For Standard Recommendations  
1. **Title**: Use as-is (no prefix)
2. **ai_badge**: "Standard"
3. **Everything else**: Show normally

---

## Testing

```bash
# Check if backend is running
curl http://127.0.0.1:8000/docs

# Get recommendations (with auth)
TOKEN="your-jwt-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/metrics/recommendations/1 | jq '.recommendations[] | {title, ai_badge, ai_enhanced}'
```

---

## Current Status

✅ **System Complete:**
- Threshold: $1 minimum savings
- AI Enhancement: Enabled for high-value recommendations
- Marking: 🤖 badge + multiple flags
- Logging: Full debug support

⚠️ **Requirements to See AI Recommendations:**
1. Configure cloud credentials for client
2. Run resource scan
3. Fetch actual cloud resources
4. Then view metrics recommendations

---

## Commit History

| Commit | Change |
|--------|--------|
| 4a34095 | Added 🤖 badge and AI marking |
| 25a781f | Added AI enhancement logging |
| 8656438 | Updated threshold from $5 to $1 |

---

**Ready to use!** Configure your cloud credentials and view the 🤖 AI-Enhanced recommendations.
