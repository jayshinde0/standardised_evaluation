# Visual Figures Fix - Report Generation

## Problem
The generated reports were showing visual chart data as raw JSON text in the mobile app instead of rendering as actual charts. The JSON was embedded in the `Data_Analysis` text field like this:

```
{ "visuals": [ { "chartType": "bar", "chartTitle": "Core EmoSocio Parameters", ... }]}
```

## Root Cause
The LLM was embedding the chart JSON directly into the `Data_Analysis` text field instead of keeping it as a separate `visuals` field. The extraction logic wasn't properly handling nested JSON structures.

## Solution

### Backend Changes (`backend/app/llm_service.py`)

1. **Created `_extract_visuals_from_text()` helper function**
   - Uses brace-counting algorithm to properly extract nested JSON from text
   - Handles both markdown code blocks (```json...```) and raw JSON objects
   - Returns cleaned text and extracted visuals array

2. **Improved `_clean_data_analysis()` function**
   - Uses brace-counting to remove JSON without breaking on nested structures
   - Removes both markdown JSON blocks and raw JSON objects

3. **Updated `generate_parent_report()` function**
   - Now uses `_extract_visuals_from_text()` to extract and clean visuals
   - Properly separates visuals from Data_Analysis text
   - Falls back to generated chart data if extraction fails

4. **Updated `generate_quiz_report_and_remedies()` function**
   - Same extraction logic as parent reports
   - Generates default visuals if none provided by LLM

### Mobile App Changes

1. **`mobile/src/screens/QuizHistoryDetailScreen.js`**
   - Updated `extractOrGenerateVisuals()` to ALWAYS return charts (never empty array)
   - Added better logging for debugging
   - Ensures fallback charts are always available

2. **`mobile/src/utils/pdfGenerator.js`**
   - Removed conditional check for charts - they're now ALWAYS shown
   - Charts section is always rendered in PDF

3. **`mobile/src/screens/QuizHistoryDetailScreen.js` - `extractImageFromMarkdown()`**
   - Added brace-counting logic to remove embedded JSON from text
   - Handles nested JSON structures properly

## How It Works

### Brace-Counting Algorithm
Instead of using regex with non-greedy matching (which fails on nested structures), we:

1. Find the start pattern: `{ "visuals": [`
2. Count opening `{` and closing `}` braces
3. Track string boundaries to ignore braces inside strings
4. Handle escape sequences properly
5. Stop when brace count reaches 0 (matching closing brace found)

This correctly extracts even deeply nested JSON structures.

### Data Flow

1. **LLM generates report** → May embed visuals JSON in Data_Analysis text
2. **Backend extracts visuals** → Uses `_extract_visuals_from_text()`
3. **Backend cleans text** → Removes JSON from Data_Analysis
4. **Backend stores separately** → `visuals` field + clean `Data_Analysis` text
5. **Mobile app receives** → Clean text + visuals array
6. **Mobile app renders** → Charts from visuals array, text without JSON
7. **PDF generation** → Charts always shown, text is clean

## Testing

To test the fix:

1. Submit a new quiz attempt
2. Check the quiz history detail screen
3. Verify charts are displayed (not JSON text)
4. Download the PDF report
5. Verify charts appear in the PDF

## Fallback Behavior

If visuals extraction fails or no visuals are provided:
- Default charts are generated with sensible EmoSocio parameter data
- Charts are ALWAYS shown (never missing)
- Users always see visual representation of performance

## Files Modified

- `backend/app/llm_service.py` - Core extraction and cleaning logic
- `mobile/src/screens/QuizHistoryDetailScreen.js` - Chart rendering and text cleaning
- `mobile/src/utils/pdfGenerator.js` - PDF chart rendering
