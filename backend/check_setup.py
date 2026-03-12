#!/usr/bin/env python3
"""
Quick setup checker for the backend
"""
import sys
import subprocess

def check_python():
    """Check Python version"""
    print("Checking Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"✗ Python {version.major}.{version.minor} (need 3.8+)")
        return False

def check_dependencies():
    """Check if required packages are installed"""
    print("\nChecking dependencies...")
    required = ['fastapi', 'uvicorn', 'motor', 'pydantic', 'python-jose', 'passlib']
    missing = []
    
    for package in required:
        try:
            __import__(package.replace('-', '_'))
            print(f"✓ {package}")
        except ImportError:
            print(f"✗ {package} (missing)")
            missing.append(package)
    
    if missing:
        print(f"\nInstall missing packages with:")
        print(f"pip install {' '.join(missing)}")
        return False
    return True

def check_mongodb():
    """Check MongoDB connection"""
    print("\nChecking MongoDB...")
    try:
        import asyncio
        from motor.motor_asyncio import AsyncIOMotorClient
        
        async def test():
            client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
            await client.admin.command('ping')
            client.close()
            return True
        
        asyncio.run(test())
        print("✓ MongoDB is running")
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        print("\nStart MongoDB with:")
        print("  Windows (Admin): net start MongoDB")
        print("  Windows (Manual): mongod.exe --dbpath C:\\data\\db")
        return False

def check_env():
    """Check if .env file exists"""
    print("\nChecking configuration...")
    import os
    if os.path.exists('.env'):
        print("✓ .env file exists")
        return True
    else:
        print("✗ .env file missing")
        print("\nCreate .env file with:")
        print("cp .env.example .env")
        return False

def main():
    print("=" * 50)
    print("Backend Setup Checker")
    print("=" * 50)
    print()
    
    checks = [
        check_python(),
        check_dependencies(),
        check_env(),
        check_mongodb(),
    ]
    
    print("\n" + "=" * 50)
    if all(checks):
        print("✓ All checks passed! Ready to start server.")
        print("\nStart the server with:")
        print("  python run.py")
        print("  OR")
        print("  uvicorn app.main:app --reload")
        return 0
    else:
        print("✗ Some checks failed. Fix the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
