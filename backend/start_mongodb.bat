@echo off
echo Starting MongoDB...
echo.

REM Create data directory if it doesn't exist
if not exist "C:\data\db" mkdir "C:\data\db"

REM Start MongoDB (adjust path if your MongoDB is installed elsewhere)
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"

pause
