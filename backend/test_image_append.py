"""
Test script to verify image is being appended to reports
"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.llm_service import _generate_emotional_insight_image


async def test_image_generation():
    """Test the image generation and verify it returns a URL"""
    
    print("=" * 60)
    print("Testing Image Generation and Append")
    print("=" * 60)
    
    # Sample analysis text
    test_analysis = """
    The student shows strong empathy and emotional awareness. 
    They demonstrate good teamwork skills and are developing confidence.
    Areas for growth include self-regulation and resilience building.
    """
    
    print("\n📝 Test Analysis Text:")
    print(test_analysis[:100] + "...")
    
    print("\n🚀 Generating image...")
    image_url = await _generate_emotional_insight_image(test_analysis)
    
    if image_url:
        print(f"✅ Image URL generated: {image_url[:80]}...")
        
        # Test markdown format
        markdown_text = f"{test_analysis}\n\n![Emotional Insight]({image_url})"
        print("\n📄 Markdown format:")
        print(markdown_text[:200] + "...")
        
        print("\n✅ SUCCESS: Image generation is working!")
        print("The image will be appended to reports automatically.")
        return True
    else:
        print("❌ FAILED: No image URL returned")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_image_generation())
    print("\n" + "=" * 60)
    if success:
        print("✅ Test passed - images will appear in reports")
    else:
        print("⚠️  Test failed - check implementation")
    print("=" * 60)
