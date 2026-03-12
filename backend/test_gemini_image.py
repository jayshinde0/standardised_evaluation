"""
Test script for Google Gemini image generation
Run this to verify the Gemini API integration is working correctly
"""
import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCfyTzvwKHV94LX8-C41YT0l8cGnI7bBKA")


async def test_gemini_image_generation():
    """Test the Gemini image generation API"""
    
    print("🧪 Testing Google Gemini Image Generation...")
    print(f"📝 API Key: {GEMINI_API_KEY[:20]}...")
    
    # Simple test prompt
    test_prompt = """Create a warm, uplifting illustration of children learning together in an Indian school.
Style: Soft watercolor with pastel colors
Elements: Books, smiling children, growth symbols like flowers
Mood: Encouraging and positive"""
    
    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={GEMINI_API_KEY}"
    
    payload = {
        "instances": [
            {
                "prompt": test_prompt
            }
        ],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "safetyFilterLevel": "block_some",
            "personGeneration": "allow_adult"
        }
    }
    
    try:
        print("\n🚀 Sending request to Gemini API...")
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                api_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"📊 Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Success! Image generated")
                
                if "predictions" in data and len(data["predictions"]) > 0:
                    image_data = data["predictions"][0].get("bytesBase64Encoded")
                    if image_data:
                        print(f"🖼️  Image data received (length: {len(image_data)} characters)")
                        print(f"📦 Data URL format: data:image/png;base64,{image_data[:50]}...")
                        print("\n✨ Image generation is working correctly!")
                        return True
                    else:
                        print("⚠️  No image data in response")
                else:
                    print("⚠️  No predictions in response")
                    print(f"Response: {data}")
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                
    except httpx.TimeoutException:
        print("⏱️  Request timed out (this can happen, try again)")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return False


async def main():
    print("=" * 60)
    print("Google Gemini Image Generation Test")
    print("=" * 60)
    
    success = await test_gemini_image_generation()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TEST PASSED - Gemini integration is working!")
        print("\nYou can now generate emotional insight images in reports.")
    else:
        print("⚠️  TEST FAILED - Check the error messages above")
        print("\nPossible issues:")
        print("1. API key might be invalid or expired")
        print("2. Imagen API might not be enabled in Google Cloud")
        print("3. Network connectivity issues")
        print("4. API quota might be exceeded")
        print("\nThe system will fall back to placeholder images.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
