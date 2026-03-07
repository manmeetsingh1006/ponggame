# Azure Setup Guide for Cloud Cost Optimizer

## 📋 Overview

Your application integrates with Azure in **two ways**:

1. **Azure Management APIs** - Monitor and analyze Azure resources (VMs, Databases, Storage, etc.)
2. **Azure AI Gateway (UHG)** - OpenAI-based AI model for cost optimization recommendations

This guide covers both setups.

---

## Part 1: Azure Resource Monitoring (Cost Analysis)

### 1️⃣ Prerequisites

- Azure subscription
- Azure CLI (optional, helpful for setup)
- Python packages: `azure-mgmt-*` (already in requirements.txt)

### 2️⃣ Create Azure Service Principal

A Service Principal is like an API user that your app uses to access Azure resources.

#### Step 1: Create Service Principal via Azure CLI
```bash
az ad sp create-for-rbac --name "pca-optimizer" --role "Reader" --scopes /subscriptions/{subscription-id}
```

**Output will show:**
```json
{
  "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "displayName": "pca-optimizer",
  "password": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Save these values:**
- `appId` = Azure Client ID
- `password` = Azure Client Secret (Authentication Key)
- `tenant` = Azure Tenant ID
- Your subscription ID (from Azure Portal)

#### Step 2: Create via Azure Portal (If CLI not available)

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure AD** → **App registrations** → **New registration**
3. Name: `pca-optimizer`
4. Click **Register**
5. Copy **Application (client) ID** and **Directory (tenant) ID**
6. Go to **Certificates & secrets** → **New client secret**
7. Copy the secret value immediately

### 3️⃣ Grant Permissions

The Service Principal needs permission to read Azure resources.

#### Via Azure CLI:
```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Assign Reader role
az role assignment create \
  --assignee "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  --role "Reader" \
  --scope "/subscriptions/$SUBSCRIPTION_ID"
```

#### Via Azure Portal:
1. Go to **Subscriptions**
2. Select your subscription
3. Click **Access Control (IAM)**
4. Click **Add** → **Add role assignment**
5. Role: **Reader**
6. Members: Select your Service Principal
7. Click **Review + assign**

### 4️⃣ Configure Application

#### Set Environment Variables

```bash
export AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export AZURE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export AZURE_SUBSCRIPTION_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Or Create .env File

Create `backend/.env`:
```env
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### Or Store in Credentials File

Create `~/.azure/credentials.json`:
```json
{
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

### 5️⃣ Azure Resource Monitoring in Code

Location: [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py)

The application queries these Azure services:
- **Virtual Machines** - Compute costs
- **App Services** - Web app hosting
- **SQL Databases** - Managed databases
- **Cosmos DB** - NoSQL databases
- **Storage Accounts** - Blob, file, queue storage
- **Network Interfaces** - Networking
- **Key Vaults** - Secrets management
- **Container Registry** - Docker images

#### Example Function Call:
```python
async def fetch_azure_resources(client_id: int, credentials: dict):
    """Fetch Azure resources using azure-mgmt libraries"""
    from azure.identity import ClientSecretCredential
    from azure.mgmt.compute import ComputeManagementClient
    
    client_id = credentials.get("client_id")
    client_secret = credentials.get("client_secret")
    tenant_id = credentials.get("tenant_id")
    subscription_id = credentials.get("subscription_id")
    
    credential = ClientSecretCredential(
        client_id=client_id,
        client_secret=client_secret,
        tenant_id=tenant_id
    )
    
    compute_client = ComputeManagementClient(credential, subscription_id)
    vms = compute_client.virtual_machines.list_all()
```

### 6️⃣ Store Azure Credentials in Database

The `tenants` table stores Azure credentials:

```json
{
  "provider": "azure",
  "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "subscription_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Add Tenant via API:**
```bash
curl -X POST http://localhost:8000/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Azure Account",
    "metadata_json": {
      "provider": "azure",
      "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "client_secret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "subscription_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    }
  }'
```

---

## Part 2: Azure AI Gateway (UHG) for AI Recommendations

This is **already configured** in your application. Here's what you need to know:

### 1️⃣ What It Does

- Provides OpenAI GPT-4 models through UHG's managed AI Gateway
- Generates AI-enhanced cost optimization recommendations
- Uses OAuth2 Client Credentials for authentication
- Timeout: 8-15 seconds with fallback to template recommendations

### 2️⃣ Current Configuration

Your app uses UHG's AI Gateway (internal endpoint):
- **Endpoint:** `https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0`
- **Authentication:** OAuth2 Client Credentials
- **Token URL:** `https://api.uhg.com/oauth2/token`
- **Model:** `gpt-4o-mini` (cost-optimized, fast)

### 3️⃣ Required Credentials

You already have these set in environment:

```bash
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"
```

### 4️⃣ How It Works (Flow Diagram)

```
User Request
    ↓
Get Cost Data (AWS/Azure/GCP)
    ↓
Generate Rule-Based Recommendations
    ↓
Is savings > $50 OR severity = HIGH/CRITICAL?
    ↓ YES
Enhance with Azure AI (with 8-sec timeout)
    ↓
Return Enhanced Recommendations (🤖 badge)
    ↓ TIMEOUT
Return Template Recommendations
    ↓ NO
Return Rule-Based Only
```

### 5️⃣ Integration in Code

Location: [backend/app/services/azure_ai_service.py](backend/app/services/azure_ai_service.py)

```python
class AzureAIService:
    """Handle Azure OpenAI interactions"""
    
    async def authenticate(self) -> str:
        """Get OAuth2 token"""
        body = {
            "grant_type": "client_credentials",
            "scope": "https://api.uhg.com/.default",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        response = await client.post(self.AUTH_URL, data=body)
        return response.json()["access_token"]
    
    async def get_recommendations(self, analysis: dict) -> str:
        """Generate AI recommendations with 8-sec timeout"""
        try:
            response = await asyncio.wait_for(
                self.oai_client.chat.completions.create(...),
                timeout=8.0
            )
            return response.choices[0].message.content
        except asyncio.TimeoutError:
            return "Timeout - using template recommendations"
```

### 6️⃣ Store AI Credentials in Database (Optional)

If you want to support multiple AI endpoints:

```json
{
  "provider": "azure_ai",
  "ai_client_id": "0425eb79-4b44-4e04-a65f-bd742a35fe47",
  "ai_client_secret": "tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb",
  "ai_project_id": "2db8b475-ec3e-468b-b253-058bbe8ff77b",
  "endpoint": "https://api.uhg.com/api/cloud/api-management/ai-gateway/1.0"
}
```

---

## Part 3: Complete Startup Command

### Full Backend Startup with All Azure Credentials

```bash
#!/bin/bash

# Generate JWT_SECRET
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# ═══════════════════════════════════════════════════════════════
# Azure Resource Monitoring (Cost Analysis)
# ═══════════════════════════════════════════════════════════════
export AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export AZURE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export AZURE_SUBSCRIPTION_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# ═══════════════════════════════════════════════════════════════
# Azure AI Gateway (UHG) for Recommendations
# ═══════════════════════════════════════════════════════════════
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"

# ═══════════════════════════════════════════════════════════════
# AWS Credentials (if using AWS)
# ═══════════════════════════════════════════════════════════════
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"

# ═══════════════════════════════════════════════════════════════
# Database & Security
# ═══════════════════════════════════════════════════════════════
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"
export JWT_SECRET="$JWT_SECRET"

# ═══════════════════════════════════════════════════════════════
# Start Backend
# ═══════════════════════════════════════════════════════════════
export PYTHONPATH=/Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Part 4: Testing Azure Connections

### Test 1: Verify Environment Variables
```bash
echo $AZURE_CLIENT_ID
echo $AZURE_CLIENT_SECRET
echo $AZURE_TENANT_ID
echo $AZURE_SUBSCRIPTION_ID
echo $AZURE_AI_CLIENT_ID
```

### Test 2: Test Azure CLI (if installed)
```bash
# Login to Azure
az login

# List subscriptions
az account list

# List VMs
az vm list --subscription {subscription-id}
```

### Test 3: Test Python Connection
```python
from azure.identity import ClientSecretCredential
from azure.mgmt.compute import ComputeManagementClient

credential = ClientSecretCredential(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    tenant_id="YOUR_TENANT_ID"
)

client = ComputeManagementClient(credential, "YOUR_SUBSCRIPTION_ID")
vms = client.virtual_machines.list_all()
print(f"VMs found: {len(list(vms))}")
```

### Test 4: Test AI Service Connection
```python
from app.services.azure_ai_service import AzureAIService

service = AzureAIService(
    client_id="0425eb79-4b44-4e04-a65f-bd742a35fe47",
    client_secret="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb",
    project_id="2db8b475-ec3e-468b-b253-058bbe8ff77b"
)

# Test authentication
token = await service.authenticate()
print(f"Token obtained: {len(token)} chars")

# Test client initialization
client = await service.initialize_client()
print("✓ Azure AI client initialized")
```

### Test 5: Call Application Endpoint
```bash
# Get recommendations with Azure resources
curl -X GET http://localhost:8000/api/metrics/recommendations/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Part 5: Troubleshooting

### Issue: "Authentication failed: invalid_client"
**Cause:** Wrong Client ID or Client Secret  
**Solution:** 
- Verify credentials in Azure Portal
- Check copy-paste (no extra spaces)
- Regenerate secret if needed

### Issue: "Insufficient permissions"
**Cause:** Service Principal lacks Reader role  
**Solution:**
```bash
az role assignment create \
  --assignee "CLIENT_ID" \
  --role "Reader" \
  --scope "/subscriptions/SUBSCRIPTION_ID"
```

### Issue: "Tenant not found"
**Cause:** Wrong Tenant ID  
**Solution:**
```bash
az account list --query "[].{Name:name, TenantId:tenantId}"
```

### Issue: "Subscription not found"
**Cause:** Wrong Subscription ID or not accessible  
**Solution:**
```bash
az account show --query id -o tsv
```

### Issue: "Unable to analyze resources..."
**Cause:** API error or network issue  
**Solution:** Check application logs for detailed error

### Issue: "OAuth2 token expired"
**Cause:** Token lifetime exceeded (usually 1 hour)  
**Solution:** Token is automatically refreshed on next request

---

## Part 6: Security Best Practices

### ✅ DO:
- ✅ Rotate secrets every 90 days
- ✅ Use least-privilege roles (Reader only)
- ✅ Store secrets in Azure Key Vault in production
- ✅ Use managed identities for Azure VMs
- ✅ Enable audit logging for all SP activities
- ✅ Use separate SPs for different environments
- ✅ Encrypt database fields storing credentials

### ❌ DON'T:
- ❌ Never commit secrets to git
- ❌ Never share via Slack/Email
- ❌ Never use Owner/Contributor roles
- ❌ Never hardcode secrets in code
- ❌ Never use personal Microsoft accounts
- ❌ Never store in plain text files

---

## Part 7: Production Deployment

### Option 1: Azure Key Vault (Recommended)
```python
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://YOUR-VAULT.vault.azure.net/", credential=credential)

# Retrieve secrets
client_id = client.get_secret("AZURE_CLIENT_ID").value
client_secret = client.get_secret("AZURE_CLIENT_SECRET").value
```

### Option 2: Managed Identity (For Azure VMs)
When deployed on Azure VM/Container:
```python
from azure.identity import ManagedIdentityCredential

credential = ManagedIdentityCredential()
# No secrets needed - uses VM's identity
```

### Option 3: Workload Identity (For AKS)
When deployed on Kubernetes:
```python
from azure.identity import WorkloadIdentityCredential

credential = WorkloadIdentityCredential()
# No secrets needed - uses pod's identity
```

---

## 📚 References

- [Azure Identity SDK](https://learn.microsoft.com/en-us/python/api/azure-identity/)
- [Azure Management Libraries](https://learn.microsoft.com/en-us/python/api/overview/azure/)
- [Azure Service Principal](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
- [Azure OpenAI API](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [Azure Security Best Practices](https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)

---

**Last Updated:** January 23, 2026  
**Application:** Python Cloud Cost Optimizer  
**Status:** ✅ Azure Integration Complete (Resource Monitoring + AI Gateway)
