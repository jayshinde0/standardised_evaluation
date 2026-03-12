# Backend Setup Guide

## Prerequisites

1. **Python 3.8+** installed
2. **MongoDB** installed and running

## Step-by-Step Setup

### 1. Install MongoDB

**Windows:**
```bash
# Download from: https://www.mongodb.com/try/download/community
# Or use chocolatey:
choco install mongodb

# Start MongoDB service:
net start MongoDB
```

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongod
```

### 2. Verify MongoDB is Running

```bash
# Test connection
python test_connection.py
```

You should see: `✓ MongoDB connection successful!`

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment

The `.env` file is already created with default values. Update if needed:

```bash
# Edit .env file
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=student_development_db
SECRET_KEY=your-secret-key-change-this-in-production-12345
OPENAI_API_KEY=sk-your-openai-key-here
```

### 5. Start the Server

**Option 1: Using the run script (recommended)**
```bash
python run.py
```

**Option 2: Using uvicorn directly**
```bash
uvicorn app.main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 6. Test the API

```bash
# Test signup endpoint
python test_signup.py
```

## Troubleshooting

### MongoDB Connection Error

If you see `Cannot connect to MongoDB`:

1. Check if MongoDB is running:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. Verify MongoDB is listening on port 27017:
   ```bash
   netstat -an | grep 27017
   ```

### Import Errors

If you see module import errors:
```bash
pip install -r requirements.txt --upgrade
```

### Port Already in Use

If port 8000 is already in use:
```bash
# Change port in run.py or use:
uvicorn app.main:app --reload --port 8001
```

## Testing from Mobile App

Make sure to update the API URL in `mobile/src/api/client.js`:

- **iOS Simulator**: `http://localhost:8000/api`
- **Android Emulator**: `http://10.0.2.2:8000/api`
- **Physical Device**: `http://YOUR_COMPUTER_IP:8000/api`

To find your computer's IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```
