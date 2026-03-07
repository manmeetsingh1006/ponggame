# 🚀 BACKEND STARTUP GUIDE

## Quick Start - Copy & Paste Commands

### Step 1: Navigate to Project Directory
```bash
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main
```

### Step 2: Generate JWT_SECRET (one-time)
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```
**Copy the output and save it somewhere safe**

### Step 3: Start Backend with All Credentials

```bash
export JWT_SECRET="PASTE_YOUR_GENERATED_SECRET_HERE"
export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"
export PYTHONPATH=/Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

cd backend

python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Expected Output
```
✅ Security configuration validated - JWT_SECRET configured
INFO:     Will watch for changes in these directories: ['/path/to/backend']
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## If Backend Fails to Start

### Error: JWT_SECRET not set
**Solution:** Copy & paste the JWT_SECRET from Step 2 into the command above

### Error: Port 8000 already in use
```bash
# Kill existing process
pkill -f "uvicorn app.main"
sleep 2

# Then restart with commands above
```

### Error: Database connection refused
**Solution:** Start PostgreSQL first (if using local DB)
```bash
# Check if PostgreSQL is running
psql --version
```

---

## Step-by-Step Instructions

1. **Go to project root:**
   ```
   cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main
   ```

2. **Generate a secure JWT secret:**
   ```
   python3 -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
   Example output: `YourGeneratedSecretHere_64Characters...`

3. **Replace `PASTE_YOUR_GENERATED_SECRET_HERE` in the command below with your generated secret**

4. **Copy entire command block and paste into terminal:**
   ```bash
   export JWT_SECRET="YourGeneratedSecretHere_64Characters..."
   export AZURE_AI_CLIENT_ID="0425eb79-4b44-4e04-a65f-bd742a35fe47"
   export AZURE_AI_CLIENT_SECRET="tSO7t0I1mVyT8nBdO5v5GfvFMBYQmw4U0Yb"
   export AZURE_AI_PROJECT_ID="2db8b475-ec3e-468b-b253-058bbe8ff77b"
   export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca"
   export PYTHONPATH=/Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend
   cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend
   python3 -m uvicorn app.main:app --reload
   ```

5. **Wait for:**
   ```
   ✅ Security configuration validated - JWT_SECRET configured
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

6. **Test it's working:**
   ```bash
   # In a new terminal
   curl http://localhost:8000/docs
   ```

---

## Save JWT_SECRET for Future Use

To avoid regenerating every time, save to `.env` file:

```bash
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend

# Create .env file with your JWT_SECRET
echo 'JWT_SECRET=YOUR_GENERATED_SECRET' > .env

# Then you can just do:
python3 -m uvicorn app.main:app --reload
```

---

## Verification

Backend is working when:
- ✅ No "CRITICAL SECURITY ERROR" messages
- ✅ See "Security configuration validated"
- ✅ See "Uvicorn running on http://0.0.0.0:8000"
- ✅ Can access http://localhost:8000/docs in browser
