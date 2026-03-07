# Azure OpenAI Setup for AI Recommendations

## Current Status

✅ **Stage 1: Rule-Based Recommendations** - WORKING
- All cloud providers generating deterministic recommendations
- Cost calculations accurate and verified
- Severity classifications working (critical, high, medium, low)
- Implementation efforts estimated

🔮 **Stage 2: AI Enhancement** - FRAMEWORK READY, NEEDS CREDENTIALS
- Code implemented and ready to activate
- Waiting for Azure OpenAI API credentials
- Will enhance high-value recommendations with:
  - Detailed implementation steps
  - Risk analysis
  - Timeline estimation
  - ROI breakdown with implementation costs

---

## How to Get Azure OpenAI Credentials

### Step 1: Create Azure OpenAI Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "OpenAI"
4. Click "Azure OpenAI"
5. Fill in:
   - **Resource Group**: Create new or use existing
   - **Region**: East US, West Europe, UK South, or France Central recommended
   - **Name**: Something like `cloud-cost-optimizer-openai`
   - **Pricing Tier**: Standard S0

6. Click "Create"
7. Wait for deployment to complete

### Step 2: Deploy a Model

1. Go to your new OpenAI resource
2. Click "Go to Azure OpenAI Studio"
3. Click "Deployments"
4. Click "Create new deployment"
5. Fill in:
   - **Model name**: `gpt-4o-mini` (recommended for cost optimization)
   - **Model version**: Latest
   - **Deployment name**: `gpt-4o-mini`
   - **Tokens per minute (TPM)**: Start with 10K

6. Click "Create"

### Step 3: Get Your Credentials

In Azure OpenAI Studio or Azure Portal:

1. Click "Keys and Endpoint"
2. Copy:
   - **API Key 1** (either key works)
   - **Endpoint** (format: `https://yourresourcename.openai.azure.com/`)

---

## Configure the Application

### Option A: Environment Variables (Recommended)

Set these in your shell before starting the backend:

```bash
export AZURE_OPENAI_API_KEY="your-api-key-here"
export AZURE_OPENAI_ENDPOINT="https://yourresourcename.openai.azure.com/"
export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"
```

Then start the backend:

```bash
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

DATABASE_URL="postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/pca" \
JWT_SECRET="devsecret" \
AZURE_OPENAI_API_KEY="your-api-key-here" \
AZURE_OPENAI_ENDPOINT="https://yourresourcename.openai.azure.com/" \
AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini" \
python3 main.py
```

### Option B: .env File (For Local Development)

Create `.env` file in backend directory:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/pca
JWT_SECRET=devsecret
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://yourresourcename.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
```

---

## Verify Configuration

Once credentials are set, test the AI integration:

```bash
curl -s http://127.0.0.1:8000/api/metrics/recommendations/2 | python3 -m json.tool | grep -A 5 "ai_enhanced"
```

Expected output when AI is working:

```json
{
  "ai_enhanced": true,
  "ai_insight": {
    "insight": "...",
    "action": "...",
    "risks": "..."
  },
  "implementation_steps": [...],
  "roi_breakdown": {...}
}
```

---

## What Gets Enhanced with AI

Only high-value recommendations are sent to AI:

1. **Recommendations with savings > $0.10/month** (almost all)
2. **Recommendations with severity = critical**
3. **Recommendations with severity = high**

### Example Enhancements

**Without AI (Rule-Based Only):**
```json
{
  "rule_id": "aws-compute-001",
  "title": "Stop or remove 1 stopped EC2 instances",
  "estimated_savings": 75.00,
  "severity": "high",
  "implementation_steps": [
    "Review current configuration",
    "Create implementation plan",
    "Test in non-production environment",
    "Schedule maintenance window",
    "Execute changes",
    "Monitor and validate"
  ]
}
```

**With AI Enhancement:**
```json
{
  "rule_id": "aws-compute-001",
  "title": "Stop or remove 1 stopped EC2 instances",
  "estimated_savings": 75.00,
  "severity": "high",
  "ai_enhanced": true,
  "ai_insight": {
    "insight": "Stopped instances still incur compute costs and can accumulate to significant monthly expenses.",
    "action": "Terminate instances if no longer needed, or start and properly configure them for production use.",
    "risks": "Ensure no dependent resources or scheduled tasks depend on these instances before termination."
  },
  "implementation_steps": [
    "List all stopped instances in the AWS console or CLI",
    "Cross-reference with your infrastructure documentation",
    "Check CloudTrail for last activity date",
    "Verify with team members before deletion",
    "Create an AMI backup if needed for archival",
    "Delete the instance and associated EBS volumes"
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

## Troubleshooting

### "AI analysis recommendations are not available"

**Cause**: Azure OpenAI credentials not configured

**Solution**: 
1. Check environment variables are set: `echo $AZURE_OPENAI_API_KEY`
2. Restart backend after setting credentials
3. Verify API key and endpoint are correct

### Timeout Errors (8-second limit)

**Cause**: Azure OpenAI API is slow or overloaded

**Solution**:
- AI enhancement has 8-second timeout
- Falls back to rule-based recommendations automatically
- No impact to user experience
- Check Azure OpenAI resource utilization in portal

### Invalid JSON from AI

**Cause**: AI response doesn't match expected format

**Solution**:
- Automatically falls back to rule-based format
- Check logs: `tail -f /tmp/backend.log`
- Monitor Azure OpenAI token usage

---

## Cost Estimation

### Azure OpenAI Pricing (gpt-4o-mini)

- **Input tokens**: ~$0.15 per 1M tokens
- **Output tokens**: ~$0.60 per 1M tokens

### Per-Recommendation Cost

Each recommendation typically uses:
- **Input**: ~400 tokens ($0.00006)
- **Output**: ~200 tokens ($0.00012)
- **Total per recommendation**: ~$0.00018

### For Cost Optimizer:

- **Per analysis** (3 clouds × 3 recommendations = 9 high-value recs): ~$0.0016
- **Monthly** (assuming 10 analyses/day): ~$0.48
- **Annually**: ~$5.76

---

## Implementation Timeline

### Phase 1: Setup ✅
- [x] Create Azure OpenAI resource
- [x] Deploy gpt-4o-mini model
- [x] Get API credentials

### Phase 2: Configuration (This Step)
- [ ] Set environment variables
- [ ] Restart backend
- [ ] Verify AI is working

### Phase 3: Monitoring
- [ ] Monitor AI recommendation quality
- [ ] Track cost optimizer usage
- [ ] Gather user feedback
- [ ] Adjust prompts if needed

---

## Next Steps

1. **Get Your Credentials**:
   - Go to Azure Portal
   - Create OpenAI resource
   - Deploy gpt-4o-mini
   - Copy API key and endpoint

2. **Configure the Backend**:
   ```bash
   export AZURE_OPENAI_API_KEY="your-key"
   export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
   export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o-mini"
   ```

3. **Restart Backend**:
   ```bash
   kill $(lsof -t -i:8000)
   cd /path/to/backend && python3 main.py
   ```

4. **Test It**:
   ```bash
   curl http://127.0.0.1:8000/api/metrics/recommendations/2 | python3 -m json.tool
   ```

5. **Check Metrics Page**:
   - Open http://localhost:3001/metrics.html
   - Login with testuser/password
   - Select a cloud provider
   - See AI-enhanced recommendations

---

## Support

If you encounter issues:

1. Check backend logs: Watch for `[AI Enhancement]` messages
2. Verify credentials in Azure Portal
3. Ensure model deployment name is exactly: `gpt-4o-mini`
4. Check Azure OpenAI resource is in supported region
5. Monitor rate limits and token usage

---

**Status**: Ready to activate once credentials provided ✅
