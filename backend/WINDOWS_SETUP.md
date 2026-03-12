# Windows Setup Guide

## MongoDB Setup on Windows

### Option 1: Start MongoDB Service (Requires Admin)

1. **Open PowerShell as Administrator:**
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)"
   - Click "Yes" on UAC prompt

2. **Start MongoDB:**
```powershell
net start MongoDB
```

3. **Verify it's running:**
```powershell
cd backend
python test_connection.py
```

### Option 2: Run MongoDB Manually (No Admin Required)

1. **Create data directory:**
```powershell
mkdir C:\data\db
```

2. **Start MongoDB manually:**
```powershell
cd "C:\Program Files\MongoDB\Server\7.0\bin"
.\mongod.exe --dbpath "C:\data\db"
```

Keep this terminal window open while developing.

### Option 3: Use the Batch File

Double-click `backend/start_mongodb.bat` to start MongoDB.

### Option 4: Install MongoDB as Current User

If you don't have admin rights, download MongoDB ZIP version:

1. Download from: https://www.mongodb.com/try/download/community
2. Extract to: `C:\mongodb`
3. Create data folder: `C:\mongodb\data`
4. Run:
```powershell
C:\mongodb\bin\mongod.exe --dbpath C:\mongodb\data
```

## Starting the Backend

Once MongoDB is running:

```powershell
cd backend
pip install -r requirements.txt
python run.py
```

## Starting the Mobile App

```powershell
cd mobile
npm install
npm start
```

## Troubleshooting

### "Access is denied" Error

You need administrator privileges. Use Option 2 or 3 above.

### MongoDB Not Found

If MongoDB isn't installed:

1. Download: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Or use Docker: `docker run -d -p 27017:27017 mongo`

### Port 27017 Already in Use

Check if MongoDB is already running:
```powershell
netstat -ano | findstr :27017
```

If it shows a process, MongoDB is already running!

### Backend Can't Connect

Make sure MongoDB is running before starting the backend:
```powershell
# Test MongoDB connection
cd backend
python test_connection.py
```

Should show: `✓ MongoDB connection successful!`
