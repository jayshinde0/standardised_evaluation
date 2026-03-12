@echo off
echo ========================================
echo Student Development API - Quick Start
echo ========================================
echo.

echo Step 1: Checking MongoDB...
python test_connection.py
if errorlevel 1 (
    echo.
    echo ERROR: MongoDB is not running!
    echo.
    echo Please start MongoDB first:
    echo   Option 1: Run PowerShell as Admin and type: net start MongoDB
    echo   Option 2: Double-click start_mongodb.bat
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Starting FastAPI server...
echo API will be available at: http://localhost:8000
echo Press Ctrl+C to stop
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
