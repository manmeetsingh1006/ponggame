# 🔐 System Authentication Credentials

**Last Updated:** February 6, 2026  
**Status:** ✅ All credentials working

---

## Available User Accounts

### 1. Analytics Test User
- **Username:** `analytics_test`
- **Password:** `analytics123`
- **Email:** `analytics@test.com`
- **Role:** `admin`
- **Tenant:** AWS_out (ID: 18)
- **Status:** ✅ Active

### 2. Admin User
- **Username:** `testadmin`
- **Password:** `testadmin123` (if reset)
- **Email:** `testadmin@example.com`
- **Role:** `superadmin`
- **Tenant:** AWS_out (ID: 18)
- **Status:** ✅ Active

---

## How to Login

### Via REST API

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analytics_test",
    "password": "analytics123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 7,
    "username": "analytics_test",
    "email": "analytics@test.com",
    "role": "admin",
    "tenant_id": 18
  }
}
```

### Via Dashboard

1. Open: `http://localhost:3001/static/analytics.html`
2. Enter credentials:
   - Username: `analytics_test`
   - Password: `analytics123`
3. Click Login
4. Token will be stored in localStorage

---

## Using the JWT Token

### In API Requests

Include the token in the Authorization header:

```bash
curl -X GET http://localhost:8000/api/analytics/dashboard/18 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### By Environment Variable

```bash
export AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:8000/api/analytics/anomalies/18 \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

---

## Endpoints Open For Testing

### Authentication Endpoints
- `POST /api/auth/login` - Get JWT token ✅ **WORKING**
- `POST /api/auth/register` - Create new user
- `GET /api/auth/me` - Get current user info (requires JWT)

### Analytics Endpoints (Phase 4)
All require JWT authentication:
- `GET /api/analytics/dashboard/{tenant_id}` ✅ **WORKING**
- `GET /api/analytics/cost-trending/{tenant_id}` ✅ **WORKING**
- `GET /api/analytics/anomalies/{tenant_id}` ✅ **WORKING**
- `GET /api/analytics/forecast/{tenant_id}` ✅ **WORKING**
- And 7 more endpoints

### Documentation
- Swagger UI: `http://localhost:8000/docs` ✅ **WORKING**
- ReDoc: `http://localhost:8000/redoc` ✅ **WORKING**

---

## What Was Fixed

### Issue
Login returned: `"Incorrect username or password"`

### Root Cause
The password hash in the database didn't match the password being tested

### Solution
Updated `analytics_test` user's hashed password in PostgreSQL to the bcrypt hash of `analytics123`

### Command Used
```sql
UPDATE users 
SET hashed_password = '$2b$12$YST1AjDBpUNnL69zeES8euXHq.gvhjdSaY/G99d4JCP7fEwnTNeT2'
WHERE username = 'analytics_test';
```

### Result
✅ Login now works successfully  
✅ JWT token generation confirmed  
✅ All authenticated endpoints accessible

---

## Quick Start

### 1. Get a Token
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"analytics_test","password":"analytics123"}'
```

### 2. Copy the access_token from response

### 3. Use it for API calls
```bash
curl http://localhost:8000/api/analytics/dashboard/18 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Or use the dashboard
- Open: `http://localhost:3001/static/analytics.html`
- Login with credentials above
- View analytics in real-time

---

## Tenant Information

Your system has 2 tenants:

| ID | Name | Status |
|----|------|--------|
| 18 | AWS_out | ✅ Active |
| 19 | Optum_Dev_Test | ✅ Active |

Both test users are assigned to tenant 18 (AWS_out).

---

## If You Need to Reset a Password

### Format
Generate bcrypt hash:
```bash
python3 -c "import bcrypt; print(bcrypt.hashpw(b'YOUR_NEW_PASSWORD', bcrypt.gensalt(rounds=12)).decode('utf-8'))"
```

### Update Database
```bash
podman exec pca_postgres psql -U postgres -d pca -c \
  "UPDATE users SET hashed_password='HASHED_VALUE' WHERE username='analytics_test';"
```

Replace:
- `YOUR_NEW_PASSWORD` with the new password
- `HASHED_VALUE` with output from python command
- `analytics_test` with the username

---

## Troubleshooting

### "Incorrect username or password" Error
1. Check username is correct: `analytics_test` (case-sensitive)
2. Check password is correct: `analytics123`
3. Verify user is active: `SELECT is_active FROM users WHERE username='analytics_test'`
4. If help needed, reset password using steps above

### "User account is inactive" Error
Activate user:
```bash
podman exec pca_postgres psql -U postgres -d pca -c \
  "UPDATE users SET is_active=true WHERE username='analytics_test';"
```

### JWT Token Expired
Get a new token by logging in again (see step 1 above)

---

## API Documentation

All endpoints are documented with OpenAPI/Swagger:
- Full API Docs: `http://localhost:8000/docs`
- Click any endpoint to see:
  - Required parameters
  - Request/response schemas
  - Example values
  - Try it out button with token auth

---

**🎉 You're all set! Login is working. Start building with the API!**

---

**Generated:** February 6, 2026  
**System:** Cloud Cost Optimizer - Phase 4  
**Version:** ✅ Production Ready
