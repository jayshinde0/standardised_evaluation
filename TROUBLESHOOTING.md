# Troubleshooting Guide

## Signup Failed Error

If you're getting "Signup Failed" error, follow these steps:

### Step 1: Check if MongoDB is Running

```bash
cd backend
python test_connection.py
```

**Expected output:**
```
✓ MongoDB connection successful!
✓ Available databases: [...]
```

**If it fails:**
- Windows: `net start MongoDB`
- Mac: `brew services start mongodb-community`
- Linux: `sudo systemctl start mongod`

### Step 2: Start the Backend Server

```bash
cd backend
python run.py
```

**Expected output:**
```
✓ MongoDB is running and accessible
Starting FastAPI server...
API will be available at: http://localhost:8000
```

### Step 3: Test the Backend API

Open a new terminal:

```bash
cd backend
python test_signup.py
```

**Expected output:**
```
Testing health endpoint...
Status: 200
✓ Signup successful!
```

### Step 4: Check Mobile App Configuration

1. Open `mobile/src/api/client.js`
2. Update the API URL based on your setup:

```javascript
// For iOS Simulator
const API_BASE_URL = 'http://localhost:8000/api';

// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:8000/api';

// For Physical Device (replace with your computer's IP)
const API_BASE_URL = 'http://192.168.1.XXX:8000/api';
```

To find your computer's IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` or `ip addr`

### Step 5: Test from Mobile

1. Make sure backend is running
2. Start the mobile app: `cd mobile && npm start`
3. Try signing up with:
   - Email: test@example.com
   - Password: test123
   - Full Name: Test User
   - Role: Student
   - APAAR ID: APAAR001

### Common Issues

#### "Network Error" or "Request Failed"

**Problem:** Mobile app can't reach the backend

**Solutions:**
1. Check if backend is running on http://localhost:8000
2. Visit http://localhost:8000/docs in your browser
3. If using physical device, use your computer's IP address
4. Make sure firewall isn't blocking port 8000

#### "Email already registered"

**Problem:** User already exists in database

**Solution:** Use a different email or clear the database:
```bash
# Connect to MongoDB
mongosh
use student_development_db
db.users.deleteMany({})
```

#### "Cannot connect to MongoDB"

**Problem:** MongoDB service not running

**Solution:**
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Debug Mode

To see detailed error messages:

1. Check backend terminal for error logs
2. Check mobile app console (React Native debugger)
3. Visit http://localhost:8000/docs and test signup directly

### Still Having Issues?

1. Restart MongoDB
2. Restart backend server
3. Restart mobile app
4. Check all terminals for error messages
5. Verify .env file exists in backend folder
