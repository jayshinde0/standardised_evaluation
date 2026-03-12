# Quick Start Guide

## For Windows Users

### Step 1: Start MongoDB

**Choose ONE option:**

**A) With Admin Rights:**
```powershell
# Open PowerShell as Administrator (Windows + X, then select "Admin")
net start MongoDB
```

**B) Without Admin Rights:**
```powershell
# Create data directory
mkdir C:\data\db

# Start MongoDB manually (keep this window open)
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --dbpath "C:\data\db"
```

**C) Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo
```

### Step 2: Verify MongoDB is Running

Open a NEW terminal:
```powershell
cd backend
python test_connection.py
```

You should see: `✓ MongoDB connection successful!`

### Step 3: Start Backend

```powershell
cd backend
pip install -r requirements.txt
python run.py
```

You should see:
```
✓ MongoDB is running and accessible
Starting FastAPI server...
API will be available at: http://localhost:8000
```

### Step 4: Test Backend

Open browser: http://localhost:8000/docs

Or test with:
```powershell
cd backend
python test_signup.py
```

### Step 5: Start Mobile App

Open a NEW terminal:
```powershell
cd mobile
npm install
npm start
```

Then:
- Press `a` for Android
- Press `i` for iOS
- Or scan QR code with Expo Go app

### Step 6: Test Signup

In the mobile app:
- Email: test@example.com
- Password: test123
- Full Name: Test Student
- Role: Student
- APAAR ID: APAAR001

Click "Sign Up"

## Common Issues

### "Access is denied" when starting MongoDB
→ Use Option B (manual start) or run PowerShell as Administrator

### "Cannot connect to MongoDB"
→ Make sure MongoDB is running (Step 1)

### "Network Error" in mobile app
→ Make sure backend is running (Step 3)

### Backend won't start
→ Check if MongoDB is running first (Step 2)

## Need Help?

See detailed guides:
- Windows: `backend/WINDOWS_SETUP.md`
- General: `TROUBLESHOOTING.md`
