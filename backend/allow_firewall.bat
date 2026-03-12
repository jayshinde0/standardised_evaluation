@echo off
echo Adding Windows Firewall rule for FastAPI...
echo This requires Administrator privileges.
echo.

netsh advfirewall firewall add rule name="FastAPI Development Server" dir=in action=allow protocol=TCP localport=8000

if %errorlevel% equ 0 (
    echo.
    echo ✓ Firewall rule added successfully!
    echo   Port 8000 is now accessible from Android emulator.
) else (
    echo.
    echo ✗ Failed to add firewall rule.
    echo   Please run this script as Administrator.
)

pause
