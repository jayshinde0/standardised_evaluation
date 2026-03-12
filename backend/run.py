#!/usr/bin/env python3
"""
Simple script to run the FastAPI server with better error messages
"""
import sys
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_mongodb():
    """Check if MongoDB is accessible"""
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=3000)
        await client.admin.command('ping')
        print("✓ MongoDB is running and accessible")
        client.close()
        return True
    except Exception as e:
        print(f"✗ Cannot connect to MongoDB: {e}")
        print("\nPlease start MongoDB:")
        print("  Windows: net start MongoDB")
        print("  Mac: brew services start mongodb-community")
        print("  Linux: sudo systemctl start mongod")
        return False

def main():
    print("Starting Student Development API...")
    print("-" * 50)
    
    # Check MongoDB connection
    if not asyncio.run(check_mongodb()):
        sys.exit(1)
    
    print("\nStarting FastAPI server...")
    print("API will be available at: http://localhost:8000")
    print("API docs at: http://localhost:8000/docs")
    print("-" * 50)
    
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

if __name__ == "__main__":
    main()
