# START HERE - Complete Setup Guide

## Current Issue: Backend Not Running

Your mobile app shows "timeout" error because the backend server is not running or not accessible.

## Quick Fix (3 Steps):

### Step 1: Start MongoDB

**Open PowerShell as Administrator** (Windows + X → "Admin"):

```powershell
net start MongoDB
```

If you get "Access denied", see alternative below.

### Step 2: Start Backend Server

**Open a NEW regular PowerShell terminal:**

```powershell
cd C:\Users\acer\OneDrive\Desktop\TY\Project\garudzhep-2.0\backend

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**IMPORTANT:** Keep this terminal open! You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 3: Test Backend is Running

**Open your browser and visit:**
- http://localhost:8000/health

You should see:
```json
{"status":"healthy","database":"connected","message":"API is running"}
```

If you see this, the backend is working! Now try the mobile app again.

---

## If Android Emulator Still Can't Connect:

### Option A: Allow Through Firewall (Recommended)

**Run as Administrator:**
```powershell
cd backend
.\allow_firewall.bat
```

### Option B: Use Your Computer's IP Address

1. Find your IP address:
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `mobile/src/api/client.js`:
```javascript
// Change this line:
return 'http://10.0.2.2:8000/api';

// To (use YOUR IP):
return 'http://192.168.1.100:8000/api';
```

3. Restart the mobile app (press 'r' in Expo terminal)

---

## Alternative: If You Can't Start MongoDB as Service

**Terminal 1 - Start MongoDB manually:**
```powershell
mkdir C:\data\db
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --dbpath C:\data\db
```
Keep this open.

**Terminal 2 - Start Backend:**
```powershell
cd C:\Users\acer\OneDrive\Desktop\TY\Project\garudzhep-2.0\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Keep this open.

**Terminal 3 - Mobile App:**
```powershell
cd C:\Users\acer\OneDrive\Desktop\TY\Project\garudzhep-2.0\mobile
npm start
```

---

## Verification Checklist:

- [ ] MongoDB is running (test with: `python backend/test_connection.py`)
- [ ] Backend is running (visit: http://localhost:8000/health)
- [ ] Backend shows "Application startup complete" in terminal
- [ ] Mobile app is running (Expo terminal shows "Logs for your project...")
- [ ] Try signup again in mobile app

---

## Still Not Working?

### Check Backend Terminal

Look for errors in the terminal where you ran `uvicorn`. Common issues:
- "Cannot connect to MongoDB" → Start MongoDB first
- "Address already in use" → Port 8000 is busy, use `--port 8001`
- Import errors → Run `pip install -r requirements.txt`

### Check Mobile App Console

The error message will tell you:
- "timeout" → Backend not running or firewall blocking
- "Network Error" → Wrong IP address
- "404" → Backend running but wrong endpoint

### Test Backend Directly

```powershell
cd backend
python test_signup.py
```

This will test if signup works directly.

---

## Need More Help?

1. Share the output from backend terminal
2. Share the error from mobile app
3. Confirm MongoDB is running: `python backend/test_connection.py`
