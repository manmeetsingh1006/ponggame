# AI-Enhanced Recommendations Response Format

## Overview
When you request metrics recommendations from `/api/metrics/recommendations/{client_id}`, recommendations will now be clearly marked as either **AI-Enhanced** or **Standard**.

---

## Response Structure

### AI-Enhanced Recommendation (🤖 Generated)
```json
{
  "id": "rec_1",
  "category": "cost",
  "severity": "high",
  "title": "🤖 5 Stopped EC2 Instance(s)",
  "description": "EC2 instances in stopped state still incur EBS storage costs",
  "impact": "Potential savings: $15.00/month",
  "affected_resources": [
    {
      "id": "i-0123456789abcdef0",
      "name": "dev-server-1",
      "type": "t3.medium"
    }
  ],
  "recommendation": "Create AMI for backup and terminate instances, or start if still needed",
  "estimated_savings": 15.00,
  
  "ai_enhanced": true,
  "ai_generated": true,
  "ai_badge": "🤖 AI-Enhanced",
  "enhancement_details": "To optimize costs for stopped EC2 instances, consider the following implementation steps...",
  "llm_enhancement": "✅ AI-enhanced with implementation details",
  "ai_insights": "This recommendation can save significant costs. Stopped instances continue to..."
}
```

### Standard Recommendation (No AI Enhancement)
```json
{
  "id": "rec_3",
  "category": "security",
  "severity": "high",
  "title": "2 Unencrypted S3 Bucket(s)",
  "description": "S3 buckets without server-side encryption are vulnerable to data breaches",
  "impact": "Data security risk",
  "affected_resources": [
    {
      "bucket": "my-data-bucket",
      "region": "us-east-1"
    }
  ],
  "recommendation": "Enable AES-256 or AWS KMS encryption on all buckets",
  "estimated_savings": 0,
  
  "ai_enhanced": false,
  "ai_generated": false,
  "ai_badge": "Standard",
  "has_ai_enhancement": false
}
```

---

## New Fields for AI-Enhanced Recommendations

| Field | Type | Description |
|-------|------|-------------|
| `ai_enhanced` | boolean | `true` if Azure AI enhanced this recommendation |
| `ai_generated` | boolean | `true` if this recommendation was AI-enhanced (same as `ai_enhanced`) |
| `ai_badge` | string | Visual badge: `🤖 AI-Enhanced` or `Standard` |
| `enhancement_details` | string | Full AI response with implementation details (500 chars) |
| `llm_enhancement` | string | Brief marker: `✅ AI-enhanced with implementation details` |
| `ai_insights` | string | Brief excerpt of AI response (200 chars) |
| `title` | string | **Updated** with 🤖 emoji prefix if AI-enhanced |
| `original_title` | string | Original title (if AI-enhanced) |
| `has_ai_enhancement` | boolean | Legacy flag (same as `ai_enhanced`) |

---

## Visual Indicators

### Title Format
- **AI-Enhanced**: `🤖 5 Stopped EC2 Instance(s)`
- **Standard**: `2 Unencrypted S3 Bucket(s)`

### Badge
- **AI-Enhanced**: `"ai_badge": "🤖 AI-Enhanced"`
- **Standard**: `"ai_badge": "Standard"`

---

## When Recommendations Get AI Enhancement

AI enhancement is applied to recommendations that meet these criteria:

✅ **Enhanced When:**
- Estimated savings > $1 **OR**
- Severity is "critical" or "high"

❌ **Not Enhanced When:**
- Estimated savings ≤ $1 **AND**
- Severity is "medium" or "low"

---

## Example: Complete Response

```json
{
  "client_id": 1,
  "client_name": "Production AWS Account",
  "provider": "aws",
  "summary": {
    "total_recommendations": 8,
    "by_category": {
      "cost": 3,
      "security": 2,
      "reliability": 2,
      "operational": 1
    },
    "by_severity": {
      "critical": 1,
      "high": 4,
      "medium": 2,
      "low": 1
    },
    "total_potential_savings_monthly": 324.50
  },
  "recommendations": [
    {
      "id": "rec_1",
      "category": "cost",
      "severity": "high",
      "title": "🤖 12 Stopped EC2 Instance(s)",
      "description": "EC2 instances in stopped state still incur EBS storage costs",
      "impact": "Potential savings: $36.00/month",
      "affected_resources": [...],
      "recommendation": "Create AMI for backup and terminate instances, or start if still needed",
      "estimated_savings": 36.00,
      "ai_enhanced": true,
      "ai_generated": true,
      "ai_badge": "🤖 AI-Enhanced",
      "enhancement_details": "To optimize costs for stopped EC2 instances...",
      "llm_enhancement": "✅ AI-enhanced with implementation details",
      "ai_insights": "This recommendation can save significant costs...",
      "has_ai_enhancement": true
    },
    {
      "id": "rec_2",
      "category": "cost",
      "severity": "high",
      "title": "🤖 Underutilized RDS Instance",
      "description": "RDS instance running with low CPU and memory utilization",
      "impact": "Potential savings: $288.50/month",
      "affected_resources": [...],
      "recommendation": "Downsize to smaller instance type or consolidate databases",
      "estimated_savings": 288.50,
      "ai_enhanced": true,
      "ai_generated": true,
      "ai_badge": "🤖 AI-Enhanced",
      "enhancement_details": "For RDS optimization: Consider Reserved Instances...",
      "llm_enhancement": "✅ AI-enhanced with implementation details",
      "ai_insights": "Downsizing RDS instances is often the quickest win...",
      "has_ai_enhancement": true
    },
    {
      "id": "rec_3",
      "category": "security",
      "severity": "critical",
      "title": "🤖 Security Groups with Open Access",
      "description": "Security groups allowing 0.0.0.0/0 on non-standard ports",
      "impact": "Critical security vulnerability",
      "affected_resources": [...],
      "recommendation": "Restrict ingress rules to specific IP ranges",
      "estimated_savings": 0,
      "ai_enhanced": true,
      "ai_generated": true,
      "ai_badge": "🤖 AI-Enhanced",
      "enhancement_details": "Security group best practices: Implement least privilege...",
      "llm_enhancement": "✅ AI-enhanced with implementation details",
      "ai_insights": "Open security groups expose your infrastructure...",
      "has_ai_enhancement": true
    },
    {
      "id": "rec_4",
      "category": "reliability",
      "severity": "medium",
      "title": "2 RDS Instances Without Backup",
      "description": "RDS instances not configured with automated backups",
      "impact": "Data loss risk",
      "affected_resources": [...],
      "recommendation": "Enable automated backups with minimum 7-day retention",
      "estimated_savings": 0,
      "ai_enhanced": false,
      "ai_generated": false,
      "ai_badge": "Standard",
      "has_ai_enhancement": false
    }
  ]
}
```

---

## Filtering Recommendations by AI Enhancement

### Get Only AI-Enhanced Recommendations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/metrics/recommendations/1 | \
  jq '.recommendations[] | select(.ai_enhanced == true)'
```

### Get Only Standard Recommendations
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/metrics/recommendations/1 | \
  jq '.recommendations[] | select(.ai_enhanced == false)'
```

### Get by Badge
```bash
# AI-Enhanced only
jq '.recommendations[] | select(.ai_badge == "🤖 AI-Enhanced")'

# Standard only
jq '.recommendations[] | select(.ai_badge == "Standard")'
```

---

## Frontend Display Suggestions

### Option 1: Use ai_badge
```html
<span class="badge" ng-class="{'badge-ai': rec.ai_enhanced, 'badge-std': !rec.ai_enhanced}">
  {{ rec.ai_badge }}
</span>
```

### Option 2: Use ai_enhanced flag
```html
<div ng-if="rec.ai_enhanced" class="ai-enhancement-banner">
  <strong>🤖 AI-Enhanced Recommendation</strong>
  <p>{{ rec.enhancement_details }}</p>
</div>
```

### Option 3: Visual Card
```html
<div class="recommendation-card" ng-class="{'ai-enhanced': rec.ai_enhanced}">
  <h3>{{ rec.title }}</h3>
  <p class="category" ng-if="rec.ai_enhanced">
    <span class="ai-badge">🤖 AI-Generated</span>
  </p>
  <p>{{ rec.description }}</p>
  <div ng-if="rec.ai_enhanced" class="ai-details">
    <strong>AI Enhancement:</strong>
    <p>{{ rec.enhancement_details | limitTo:200 }}...</p>
  </div>
</div>
```

---

## Key Takeaways

1. ✅ **AI-Enhanced** recommendations have `ai_enhanced: true` and appear with 🤖 badge
2. ✅ **Standard** recommendations have `ai_enhanced: false` and plain title
3. ✅ Every recommendation is marked (either AI or Standard)
4. ✅ Enhancement details are in `enhancement_details` field
5. ✅ Title prefix (🤖) makes them visually distinct
6. ✅ Use `ai_badge` field for UI display

---

**Last Updated**: Commit 4a34095 - Add clear AI-enhanced recommendation marking
