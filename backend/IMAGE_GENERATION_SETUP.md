# Emotional Insight Image Generation Setup

## Overview

The Student Development Tracker automatically generates emotionally attaching images for student semester reports using **Google Gemini Flash 1.5 with Imagen**. These images visually represent the student's emotional and social progress in an empathetic, culturally appropriate, and uplifting way.

## Current Configuration

**Service:** Google Gemini Imagen 3.0
**API Key:** Configured in `backend/.env`
**Status:** ✅ Ready to use

## How It Works

1. When a parent report is generated via `generate_parent_report()`, the system analyzes the emotional content
2. Google Gemini Imagen generates a warm, uplifting illustration based on the analysis
3. The image is returned as a base64 data URL and automatically appended to the report in Markdown format
4. If image generation fails, the report continues without the image (fail-safe design)

## Setup Instructions

### Current Setup: Google Gemini (Active)

The system is already configured to use Google Gemini. The API key is set in `backend/.env`:

```env
GEMINI_API_KEY=AIzaSyCfyTzvwKHV94LX8-C41YT0l8cGnI7bBKA
```

**No additional setup required!** The image generation will work automatically.

### API Details

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`
- **Model:** Imagen 3.0
- **Timeout:** 90 seconds
- **Image Format:** Base64 encoded PNG (embedded directly in report)
- **Aspect Ratio:** 16:9 (optimized for mobile viewing)
- **Safety:** Content filtering enabled

## Image Characteristics

Generated images are designed to be:
- **Warm and uplifting:** Soft watercolor style with pastel colors
- **Culturally appropriate:** Indian school context with diverse students
- **Age-appropriate:** Suitable for students aged 6-18
- **Emotionally resonant:** Reflects themes like empathy, growth, teamwork, resilience
- **Professional:** Suitable for parent-teacher communications
- **Embedded:** Base64 encoded for direct display without external dependencies

## Technical Details

### Function: `_generate_emotional_insight_image()`

**Location:** `backend/app/llm_service.py`

**Input:** Analysis text from the student report (first 300 characters)

**Output:** Base64 data URL (string) or None if generation fails

**Timeout:** 90 seconds

**Error Handling:** Graceful failure with fallback to Unsplash placeholder

**API Call:**
```python
api_url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={GEMINI_API_KEY}"

payload = {
    "instances": [{"prompt": image_prompt}],
    "parameters": {
        "sampleCount": 1,
        "aspectRatio": "16:9",
        "safetyFilterLevel": "block_some",
        "personGeneration": "allow_adult"
    }
}
```

### Integration Point

The image is generated and appended in `generate_parent_report()`:

```python
# Generate emotional insight image and append to Data_Analysis
analysis_text = report.get("Data_Analysis", "")
if analysis_text:
    try:
        image_url = await _generate_emotional_insight_image(analysis_text)
        if image_url:
            # Append image in Markdown format (supports both URLs and data URLs)
            report["Data_Analysis"] = f"{analysis_text}\n\n![Emotional Insight]({image_url})"
            logger.info("Successfully appended emotional insight image to report")
    except Exception as e:
        logger.warning(f"Failed to append image to report: {e}")
```

## Testing

### Test Image Generation

1. Start the backend server:
   ```bash
   cd backend
   python run.py
   ```

2. Generate a parent report through the mobile app or API

3. Check the logs for:
   ```
   INFO: Generating emotional insight image using Google Gemini
   INFO: Successfully generated image with Google Gemini
   INFO: Successfully appended emotional insight image to report
   ```

4. View the report in the mobile app - image should appear at the bottom

### Troubleshooting

**Image not appearing:**
- Check backend logs for errors
- Verify GEMINI_API_KEY is set correctly in `.env`
- Check network connectivity to Google APIs
- Verify API key has Imagen access enabled

**Timeout errors:**
- Gemini timeout is set to 90 seconds
- Check Google Cloud Console for API status
- Verify API quota hasn't been exceeded

**API errors:**
- Verify API key is valid
- Check Google Cloud Console for API enablement
- Review quota limits in Google Cloud Console
- Ensure billing is enabled (if required)

**Fallback to placeholder:**
- System will automatically use Unsplash placeholder if Gemini fails
- Check logs for specific error messages

## Cost Estimation

### Google Gemini Imagen
- **Free tier:** Generous free quota for testing
- **Paid tier:** Very cost-effective compared to alternatives
- **Estimated cost:** Minimal for typical school usage
- **Billing:** Through Google Cloud Platform

Check current pricing at: https://ai.google.dev/pricing

## Security Considerations

1. **API Keys:** API key is stored in `.env` (not committed to git)
2. **Content Filtering:** Gemini has built-in safety filters enabled
3. **Data Privacy:** Analysis text is sent to Google API (review Google's privacy policy)
4. **Base64 Embedding:** Images are embedded directly, no external hosting needed
5. **Rate Limiting:** Implement rate limiting to prevent abuse

## Advantages of Gemini Imagen

✅ **High Quality:** State-of-the-art image generation
✅ **Fast:** Typically generates in 10-30 seconds
✅ **Reliable:** Google's infrastructure ensures high uptime
✅ **Safe:** Built-in content filtering
✅ **Cost-effective:** Competitive pricing with free tier
✅ **Easy Integration:** Simple REST API
✅ **No External Storage:** Base64 embedding eliminates hosting needs

## Future Enhancements

- [ ] Cache generated images to reduce API calls
- [ ] Add image style preferences (illustration, photo, abstract)
- [ ] Support multiple languages for prompts
- [ ] Add admin panel to configure image generation settings
- [ ] Implement image quality/size options
- [ ] Add A/B testing for different prompt styles
- [ ] Store images in database for offline access

## Support

For issues or questions:
1. Check backend logs: `backend/logs/`
2. Review Google Cloud Console for API status
3. Test with placeholder images first
4. Contact development team

## API Documentation

- **Gemini API Docs:** https://ai.google.dev/docs
- **Imagen Documentation:** https://ai.google.dev/docs/imagen_api
- **API Key Management:** https://makersuite.google.com/app/apikey

---

**Last Updated:** March 2026
**Version:** 2.0.0
**Image Service:** Google Gemini Imagen 3.0
