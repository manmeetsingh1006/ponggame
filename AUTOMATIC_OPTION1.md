# OPTION 1: AUTOMATIC BUILD - STEP BY STEP

## STEP 1: Close All Terminals
Close every terminal window in VS Code.

## STEP 2: Open NEW Terminal
Click: Terminal → New Terminal

## STEP 3: Copy & Paste This Exact Command

```
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main && bash build_from_scratch.sh
```

That's it! Paste it and press ENTER.

## STEP 4: Wait

Script will run automatically. You'll see:
- ✓ Cleanup
- ✓ PostgreSQL starting
- ✓ Migrations running
- ✓ Test user creating
- ✓ Frontend starting
- ✓ Verification

Takes about 5 minutes.

## STEP 5: When Script Finishes

You'll see:
```
╔════════════════════════════════════════════════════════════╗
║              ✓ SETUP COMPLETE!                            ║
╚════════════════════════════════════════════════════════════╝
```

## STEP 6: Open NEW Terminal Again

Click: Terminal → New Terminal (this is for backend)

## STEP 7: Copy & Paste Backend Command

```
cd /Users/manmeet.singh@optum.com/Library/CloudStorage/OneDrive-UHG/Documents/py_cloud_cost_optimizer/pca-main/backend && export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/pca" && export REDIS_URL="redis://localhost:6379/0" && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Press ENTER and wait for:
```
Uvicorn running on http://0.0.0.0:8000
```

## STEP 8: Open Browser

Go to: **http://localhost:3001/login.html**

## STEP 9: Login

```
Username: testuser
Password: password
```

Click "Sign In"

## STEP 10: SUCCESS! 🎉

You should see the dashboard!

---

## TROUBLESHOOTING

### Script fails?
Share the error output and I'll fix it.

### Backend won't start?
Make sure you:
1. Used a NEW terminal
2. Are in the `backend` directory
3. Set the DATABASE_URL environment variable

### Can't login?
1. Make sure backend is running (check terminal output)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try incognito mode

### Forgot something?
Just run the build script again - it's idempotent (safe to run multiple times)

---

## THAT'S IT!

Three simple steps:
1. Run: `bash build_from_scratch.sh`
2. Run: `python3 -m uvicorn app.main:app ...`
3. Open: http://localhost:3001/login.html

Then login with: testuser / password

Done! 🚀
