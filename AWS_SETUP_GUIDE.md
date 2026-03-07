# AWS Setup Guide for Cloud Cost Optimizer

## 📋 Overview
Your application already integrates with AWS using `boto3` (AWS SDK for Python). This guide shows how to configure AWS credentials and set up IAM permissions.

## 🔧 Prerequisites
- AWS Account
- boto3 already installed in `requirements.txt`
- AWS CLI (optional, but helpful for testing)

---

## 1️⃣ AWS Credentials Setup

### Option A: Using AWS Access Keys (Recommended for Development)

#### Step 1: Create IAM User
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Go to **IAM** → **Users** → **Create user**
3. User name: `pca-optimizer` (or your preference)
4. Click **Next**

#### Step 2: Attach Permissions
1. Select **Attach policies directly**
2. Search and select these policies:
   - `AmazonEC2ReadOnlyAccess`
   - `AmazonRDSReadOnlyAccess`
   - `AmazonDynamoDBReadOnlyAccess`
   - `AmazonElastiCacheReadOnlyAccess`
   - `AmazonS3ReadOnlyAccess`
   - `AWSLambdaReadOnlyAccess`
   - `AmazonECS_FullAccess` (or ReadOnlyAccess)
   - `AmazonEKS_FullAccess` (or ReadOnlyAccess)
   - `AutoScalingReadOnlyAccess`
   - `CloudWatchReadOnlyAccess`

3. Click **Next** → **Create user**

#### Step 3: Generate Access Keys
1. Click on the newly created user
2. Go to **Security credentials** tab
3. Scroll to **Access keys**
4. Click **Create access key**
5. Select **Application running outside AWS** → **Next**
6. Click **Create access key**
7. **Copy and save:**
   - Access Key ID
   - Secret Access Key

⚠️ **Important:** Save these immediately - you won't see the secret key again!

---

## 2️⃣ Configure Credentials in Application

### Method 1: Environment Variables (Recommended)
```bash
export AWS_ACCESS_KEY_ID="your_access_key_id"
export AWS_SECRET_ACCESS_KEY="your_secret_access_key"
export AWS_DEFAULT_REGION="us-east-1"  # Change to your region
```

### Method 2: .env File
Create `.env` in backend directory:
```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=us-east-1
```

Then load in config:
```python
from dotenv import load_dotenv
import os

load_dotenv()
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
```

### Method 3: AWS Credentials File (Standard AWS Location)
Create `~/.aws/credentials`:
```
[default]
aws_access_key_id = your_access_key_id
aws_secret_access_key = your_secret_access_key

[pca-profile]
aws_access_key_id = your_access_key_id
aws_secret_access_key = your_secret_access_key
```

Create `~/.aws/config`:
```
[default]
region = us-east-1

[profile pca-profile]
region = us-east-1
```

---

## 3️⃣ Database Storage of AWS Credentials

Your application stores AWS credentials in the database (in `tenants` table). Here's the schema:

### Table Structure
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    metadata_json JSONB,  -- Stores credentials
    provider VARCHAR(50) DEFAULT 'aws',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Storing AWS Credentials
The `metadata_json` column stores credentials:
```json
{
  "provider": "aws",
  "access_key": "AKIAIOSFODNN7EXAMPLE",
  "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1"
}
```

### API Endpoint to Add Tenant (Example)
```bash
curl -X POST http://localhost:8000/api/clients \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AWS Account",
    "metadata_json": {
      "provider": "aws",
      "access_key": "AKIAIOSFODNN7EXAMPLE",
      "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      "region": "us-east-1"
    }
  }'
```

---

## 4️⃣ How boto3 is Used in Your Code

### Location: [backend/app/api/v1/metrics.py](backend/app/api/v1/metrics.py#L136-L330)

### Function: `fetch_aws_resources()`
```python
async def fetch_aws_resources(client_id: int, credentials: dict):
    """Fetch comprehensive AWS resource inventory using boto3"""
    import boto3
    
    try:
        access_key = credentials.get("access_key")
        secret_key = credentials.get("secret_key")
        region = credentials.get("region", "us-east-1")
        
        if not access_key or not secret_key:
            return {"error": "Missing AWS credentials"}
        
        # Create AWS session
        session = boto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        
        # Initialize AWS service clients
        ec2 = session.client("ec2", region_name=region)
        rds = session.client("rds", region_name=region)
        s3 = session.client("s3", region_name=region)
        # ... more services
```

### AWS Services Queried
The application fetches data from:
- **EC2:** Virtual machines, security groups, volumes
- **RDS:** Managed databases
- **DynamoDB:** NoSQL databases
- **Lambda:** Serverless functions
- **ECS:** Container services
- **EKS:** Kubernetes
- **AutoScaling:** Auto scaling groups
- **ElastiCache:** Caching services
- **S3:** Object storage

---

## 5️⃣ Complete Startup Command with AWS Credentials

```bash
#!/bin/bash

# Generate or use existing JWT_SECRET
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

# Set AWS credentials
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export AWS_DEFAULT_REGION="us-east-1"

# Set Azure credentials (if using)
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"

# Database
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"

# JWT
export JWT_SECRET="$JWT_SECRET"

# Python path
export PYTHONPATH=/Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

# Start backend
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 6️⃣ Security Best Practices

### ✅ DO:
- ✅ Use IAM roles for EC2 instances (when deployed on AWS)
- ✅ Rotate access keys regularly (every 90 days recommended)
- ✅ Use separate AWS accounts for different environments (dev/staging/prod)
- ✅ Store credentials in AWS Secrets Manager or encrypted vaults
- ✅ Use least-privilege IAM policies (read-only for monitoring)
- ✅ Enable CloudTrail for audit logging
- ✅ Encrypt credentials in database (use database encryption)

### ❌ DON'T:
- ❌ Never commit access keys to git
- ❌ Never use root account credentials
- ❌ Never share credentials via Slack/Email
- ❌ Never hardcode credentials in code
- ❌ Never use overly permissive IAM policies

---

## 7️⃣ Testing AWS Connection

### Test 1: Verify Environment Variables
```bash
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_DEFAULT_REGION
```

### Test 2: Test with AWS CLI (if installed)
```bash
aws sts get-caller-identity
# Output should show your AWS account
```

### Test 3: Test with Python
```python
import boto3

# Create session with credentials
session = boto3.Session(
    aws_access_key_id="YOUR_ACCESS_KEY",
    aws_secret_access_key="YOUR_SECRET_KEY",
    region_name="us-east-1"
)

# Test EC2 connection
ec2 = session.client("ec2")
response = ec2.describe_instances()
print(f"EC2 Instances: {len(response['Reservations'])}")
```

### Test 4: Call Application Endpoint
```bash
# Get recommendations with AWS resources
curl -X GET http://localhost:8000/api/metrics/recommendations/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 8️⃣ Troubleshooting

### Issue: "InvalidClientTokenId" Error
**Cause:** Wrong AWS access key or secret  
**Solution:** Verify credentials in AWS console and regenerate if needed

### Issue: "UnauthorizedOperation" Error
**Cause:** IAM user lacks required permissions  
**Solution:** Check that all required policies are attached to the IAM user

### Issue: Connection Timeout
**Cause:** Network connectivity or security groups blocking access  
**Solution:** 
- Check your internet connection
- Verify AWS account region is correct
- Check VPC security groups if using VPC

### Issue: "NoCredentialsError"
**Cause:** AWS credentials not found  
**Solution:** Ensure environment variables are set before starting the app

### Issue: "Unable to analyze resources..." Message
**Cause:** API error or missing permissions  
**Solution:** Check application logs for detailed error messages

---

## 9️⃣ Multiple AWS Accounts

To support multiple AWS accounts, store separate credentials per tenant:

```json
{
  "tenant_1": {
    "provider": "aws",
    "account_id": "111111111111",
    "access_key": "AKIA...",
    "secret_key": "...",
    "region": "us-east-1"
  },
  "tenant_2": {
    "provider": "aws",
    "account_id": "222222222222",
    "access_key": "AKIA...",
    "secret_key": "...",
    "region": "eu-west-1"
  }
}
```

The application automatically routes requests to the correct AWS account based on tenant metadata.

---

## 🔟 Production Deployment

### Recommended: Using AWS IAM Roles (for EC2 instances)
If deploying on EC2, instead of access keys:

1. Create an IAM role with required policies
2. Attach role to EC2 instance
3. boto3 automatically uses the instance role credentials
4. No need to manage access keys

### Recommended: Using AWS Secrets Manager
```python
import boto3
import json

secrets_client = boto3.client('secretsmanager')
secret = secrets_client.get_secret_value(SecretId='pca/aws-credentials')
credentials = json.loads(secret['SecretString'])

# Use credentials
session = boto3.Session(
    aws_access_key_id=credentials['access_key'],
    aws_secret_access_key=credentials['secret_key']
)
```

---

## 📚 References

- [AWS boto3 Documentation](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS EC2 Pricing](https://aws.amazon.com/ec2/pricing/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)

---

**Last Updated:** January 23, 2026  
**Application:** Python Cloud Cost Optimizer  
**Status:** ✅ AWS Integration Ready
