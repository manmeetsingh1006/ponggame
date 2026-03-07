#!/usr/bin/env python3
"""
ALL-IN-ONE LOGIN FIX
This script will:
1. Check database connection
2. Create/fix the testuser
3. Verify everything works
4. Tell you exactly what to do next
"""

import subprocess
import sys
import os

print("\n" + "="*70)
print("PCA LOGIN - COMPLETE AUTOMATIC FIX")
print("="*70 + "\n")

# Step 1: Check if PostgreSQL is running
print("STEP 1: Checking PostgreSQL...")
try:
    result = subprocess.run(
        ["psql", "-h", "localhost", "-U", "postgres", "-d", "pca", "-c", "SELECT 1"],
        env={**os.environ, "PGPASSWORD": "postgres"},
        capture_output=True,
        timeout=5
    )
    if result.returncode == 0:
        print("✓ PostgreSQL is running and accessible\n")
    else:
        print("✗ PostgreSQL not responding")
        print("  Error:", result.stderr.decode()[:200])
        print("\nFix: Start the database container")
        print("  podman run -d --name pca-db --restart=always \\")
        print("    -e POSTGRES_USER=postgres \\")
        print("    -e POSTGRES_PASSWORD=postgres \\")
        print("    -e POSTGRES_DB=pca \\")
        print("    -p 5432:5432 \\")
        print("    -v pca_db_data:/var/lib/postgresql/data \\")
        print("    pgvector/pgvector:pg15")
        sys.exit(1)
except Exception as e:
    print(f"✗ PostgreSQL check failed: {e}")
    print("\nMake sure PostgreSQL container is running:")
    print("  podman start pca-db")
    sys.exit(1)

# Step 2: Check if tables exist
print("STEP 2: Checking database tables...")
try:
    result = subprocess.run(
        ["psql", "-h", "localhost", "-U", "postgres", "-d", "pca", "-c", 
         "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"],
        env={**os.environ, "PGPASSWORD": "postgres"},
        capture_output=True,
        timeout=5
    )
    table_count = result.stdout.decode().strip().split('\n')[-2]
    if int(table_count) > 0:
        print(f"✓ Database has {table_count} tables\n")
    else:
        print("✗ No tables found - need to run migrations")
        print("\nFix: From backend directory, run:")
        print("  cd backend")
        print("  alembic upgrade head")
        sys.exit(1)
except Exception as e:
    print(f"✗ Table check failed: {e}")
    sys.exit(1)

# Step 3: Create/Fix testuser
print("STEP 3: Setting up testuser...")

sql_commands = """
-- Create default tenant
INSERT INTO tenants (name) VALUES ('default') 
ON CONFLICT (name) DO NOTHING;

-- Create/update testuser
INSERT INTO users (username, email, hashed_password, role, is_active, tenant_id)
SELECT 
    'testuser',
    'testuser@example.com',
    '$2b$12$RsUIFB4jY6ScA7dXZQXt.u1dFLW1E0rTcCfQPDxpfPKJbxj8kXwqm',
    'super_admin',
    true,
    id
FROM tenants WHERE name = 'default'
ON CONFLICT (username) DO UPDATE SET
    hashed_password = '$2b$12$RsUIFB4jY6ScA7dXZQXt.u1dFLW1E0rTcCfQPDxpfPKJbxj8kXwqm',
    role = 'super_admin',
    is_active = true,
    email = 'testuser@example.com';
"""

try:
    result = subprocess.run(
        ["psql", "-h", "localhost", "-U", "postgres", "-d", "pca"],
        input=sql_commands,
        env={**os.environ, "PGPASSWORD": "postgres"},
        capture_output=True,
        timeout=10,
        text=True
    )
    if result.returncode == 0:
        print("✓ User 'testuser' created/updated\n")
    else:
        print("✗ Failed to create user")
        print("  Error:", result.stderr[:200])
        sys.exit(1)
except Exception as e:
    print(f"✗ Failed to set up user: {e}")
    sys.exit(1)

# Step 4: Verify user
print("STEP 4: Verifying user...")
try:
    result = subprocess.run(
        ["psql", "-h", "localhost", "-U", "postgres", "-d", "pca", "-t", "-c",
         "SELECT username, email, role, is_active FROM users WHERE username='testuser'"],
        env={**os.environ, "PGPASSWORD": "postgres"},
        capture_output=True,
        timeout=5,
        text=True
    )
    
    if "testuser" in result.stdout:
        lines = result.stdout.strip().split('\n')
        user_line = [l for l in lines if 'testuser' in l][0]
        print("✓ User verified:")
        print(f"  {user_line}")
        print()
    else:
        print("✗ User not found in database")
        sys.exit(1)
except Exception as e:
    print(f"✗ Verification failed: {e}")
    sys.exit(1)

# Step 5: Test password
print("STEP 5: Testing password verification...")
try:
    test_code = """
import bcrypt
import sys

stored_hash = '$2b$12$RsUIFB4jY6ScA7dXZQXt.u1dFLW1E0rTcCfQPDxpfPKJbxj8kXwqm'
password = 'password'

try:
    result = bcrypt.checkpw(password.encode(), stored_hash.encode())
    print('PASS' if result else 'FAIL')
except Exception as e:
    print(f'ERROR: {e}')
"""
    result = subprocess.run(
        ["python3", "-c", test_code],
        capture_output=True,
        timeout=5,
        text=True
    )
    
    if "PASS" in result.stdout:
        print("✓ Password verification works correctly\n")
    elif "FAIL" in result.stdout:
        print("✗ Password hash is incorrect")
        sys.exit(1)
    else:
        print("? Could not verify password")
        print(f"  Output: {result.stdout}")
        sys.exit(1)
except Exception as e:
    print(f"✗ Password test failed: {e}")
    sys.exit(1)

# Success!
print("="*70)
print("✓ ALL CHECKS PASSED!")
print("="*70 + "\n")

print("LOGIN CREDENTIALS:")
print("  Username: testuser")
print("  Password: password")
print("  Role:     super_admin\n")

print("WHAT TO DO NEXT:\n")

print("1. Make sure backend is running:")
print("   cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend")
print("   export DATABASE_URL='postgresql+asyncpg://postgres:postgres@localhost:5432/pca'")
print("   export REDIS_URL='redis://localhost:6379/0'")
print("   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000\n")

print("2. Open browser to:")
print("   http://localhost:3001/login.html\n")

print("3. Login with:")
print("   Username: testuser")
print("   Password: password\n")

print("4. If still not working:")
print("   - Clear browser cache (Ctrl+Shift+Delete)")
print("   - Try in incognito mode")
print("   - Restart backend server")
print("   - Check http://localhost:8000/docs for API status\n")

print("="*70 + "\n")
