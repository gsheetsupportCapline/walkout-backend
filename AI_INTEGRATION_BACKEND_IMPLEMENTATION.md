# AI Integration - Backend Implementation Guide

## Overview
"Check with AI" button Gemini AI ka use karke provider aur hygienist notes ko analyze karta hai. Current implementation mein API key frontend mein hai, jo security issue hai. Yeh backend implementation guide hai.

---

## 1. Current Frontend Implementation

### File: `src/utils/providerNotesChecker.js`

```javascript
const GEMINI_API_KEY = "AIzaSyBLaxdHZOxzG6nKZznOGq4Go_gWHzMczFw"; // ❌ Remove from frontend
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";
```

### AI Prompt Details

```javascript
const promptForNotes = `
You are a dental notes json data extractor, expert in understanding dental provider and hygienist notes extractor. Strictly follow these rules and output ONLY a single valid JSON object—no additional text, no explanations:

1. For each of the two texts, extract:
   • "tooth_number": the tooth number or Arch or quads present coma separated, or false.
   • "procedure_name": the procedure's name present, or false.
   • "surgical_indicators": a comma‑separated list of matched terms (from the list below) each followed by the exact matched phrase in brackets; if none match, set to false.
   • From the below given Text 1 only ("provider note"): "provider_name": the provider's name present, or false. (This one should be stricly extracted from Text 1 only)
   • From the below given Text 2 only ("hygienist note"): "hygienist_name": the hygienist's name present, or false. (This one should be strictly extracted from Text 2 only)

2. Strictly identify any tooth number, arch, or quadrant mentioned in the text. This includes quadrant names (e.g., UR, LL) or explicit quadrant counts such as "2 quads", "4 quads", etc. These numeric references (e.g., "4 quads") should also be included as-is in the tooth_number field, comma-separated with other location terms if applicable. If found, add them to the appropriate object: provider_note or hygienist_note, based on the source text.  
3. Do NOT invent or repeat any example values.  
4. If a field has no valid data, its value must be the boolean false (not a string).  
5. Surgical indicators to match (exact or variant):
   – Surgical removal of tooth  
   – Bone removal  
   – Tooth sectioning  
   – Flap Raised / flap elevation  
   – Root removal  
   – Removal of bone and tooth structure  
   – Impacted tooth  
   – Pericoronitis  

6. The output MUST look exactly like this example (with your extracted values or false):
{
  "provider_note": {
    "tooth_number": false,
    "provider_name": false,
    "procedure_name": false,
    "surgical_indicators": false
  },
  "hygienist_note": {
    "tooth_number": false,
    "hygienist_name": false,
    "procedure_name": false,
    "surgical_indicators": false
  }
}

Text 1 (provider note):
${providerText}

Text 1 ends here.

// cache‑buster: ${new Date().toISOString()}

Text 2 (hygienist note):
${hygienistText}

Text 2 ends here.
`;
```

### Gemini API Call Configuration

```javascript
const payload = {
  contents: [
    {
      parts: [{ text: promptForNotes }],
    },
  ],
  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 800,
  },
};

const response = await fetch(GEMINI_API_URL + "?key=" + GEMINI_API_KEY, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
```

### Expected Response Format

AI returns JSON jo is format mein hona chahiye:

```json
{
  "provider_note": {
    "tooth_number": "12, 13, 14" | false,
    "provider_name": "Dr. Smith" | false,
    "procedure_name": "Root Canal" | false,
    "surgical_indicators": "Flap Raised [flap elevation], Bone removal [bone removed]" | false
  },
  "hygienist_note": {
    "tooth_number": "UR, 4 quads" | false,
    "hygienist_name": "Sarah Johnson" | false,
    "procedure_name": "Cleaning" | false,
    "surgical_indicators": false
  }
}
```

### Frontend Response Handling

Frontend expects flat array in this specific order:

```javascript
return [
  result.provider_note.tooth_number || false,         // [0]
  result.provider_note.provider_name || false,        // [1]
  result.provider_note.procedure_name || false,       // [2]
  result.provider_note.surgical_indicators || false,  // [3]
  result.hygienist_note.tooth_number || false,        // [4]
  result.hygienist_note.hygienist_name || false,      // [5]
  result.hygienist_note.procedure_name || false,      // [6]
  result.hygienist_note.surgical_indicators || false, // [7]
];
```

---

## 2. Backend Implementation

### Step 1: Create Backend Route

**File: `routes/ai.js` (new file)**

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth'); // Your auth middleware

// POST /api/ai/check-notes
router.post('/check-notes', authenticateToken, async (req, res) => {
  try {
    const { providerText, hygienistText } = req.body;

    // Validation
    if (!providerText && !hygienistText) {
      return res.status(400).json({
        success: false,
        message: 'Provider or hygienist notes required'
      });
    }

    // Call Gemini API
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // From .env
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
You are a dental notes json data extractor, expert in understanding dental provider and hygienist notes extractor. Strictly follow these rules and output ONLY a single valid JSON object—no additional text, no explanations:

1. For each of the two texts, extract:
   • "tooth_number": the tooth number or Arch or quads present coma separated, or false.
   • "procedure_name": the procedure's name present, or false.
   • "surgical_indicators": a comma‑separated list of matched terms (from the list below) each followed by the exact matched phrase in brackets; if none match, set to false.
   • From the below given Text 1 only ("provider note"): "provider_name": the provider's name present, or false. (This one should be stricly extracted from Text 1 only)
   • From the below given Text 2 only ("hygienist note"): "hygienist_name": the hygienist's name present, or false. (This one should be strictly extracted from Text 2 only)

2. Strictly identify any tooth number, arch, or quadrant mentioned in the text. This includes quadrant names (e.g., UR, LL) or explicit quadrant counts such as "2 quads", "4 quads", etc. These numeric references (e.g., "4 quads") should also be included as-is in the tooth_number field, comma-separated with other location terms if applicable. If found, add them to the appropriate object: provider_note or hygienist_note, based on the source text.  
3. Do NOT invent or repeat any example values.  
4. If a field has no valid data, its value must be the boolean false (not a string).  
5. Surgical indicators to match (exact or variant):
   – Surgical removal of tooth  
   – Bone removal  
   – Tooth sectioning  
   – Flap Raised / flap elevation  
   – Root removal  
   – Removal of bone and tooth structure  
   – Impacted tooth  
   – Pericoronitis  

6. The output MUST look exactly like this example (with your extracted values or false):
{
  "provider_note": {
    "tooth_number": false,
    "provider_name": false,
    "procedure_name": false,
    "surgical_indicators": false
  },
  "hygienist_note": {
    "tooth_number": false,
    "hygienist_name": false,
    "procedure_name": false,
    "surgical_indicators": false
  }
}

Text 1 (provider note):
${providerText || ''}

Text 1 ends here.

// cache‑buster: ${new Date().toISOString()}

Text 2 (hygienist note):
${hygienistText || ''}

Text 2 ends here.
`;

    const payload = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    };

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content) {
      throw new Error('Invalid response from Gemini API');
    }

    const replyText = data.candidates[0].content.parts
      .map(p => p.text)
      .join('')
      .trim();

    // Extract JSON from response
    const jsonMatch = replyText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Return flat array format that frontend expects
    const flatResult = [
      result.provider_note.tooth_number || false,
      result.provider_note.provider_name || false,
      result.provider_note.procedure_name || false,
      result.provider_note.surgical_indicators || false,
      result.hygienist_note.tooth_number || false,
      result.hygienist_note.hygienist_name || false,
      result.hygienist_note.procedure_name || false,
      result.hygienist_note.surgical_indicators || false,
    ];

    res.json({
      success: true,
      data: flatResult
    });

  } catch (error) {
    console.error('AI Check Notes Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze notes with AI',
      error: error.message
    });
  }
});

module.exports = router;
```

### Step 2: Add to Main App

**File: `server.js` or `app.js`**

```javascript
const aiRoutes = require('./routes/ai');

// Add route
app.use('/api/ai', aiRoutes);
```

### Step 3: Add Environment Variable

**File: `.env`**

```env
GEMINI_API_KEY=AIzaSyBLaxdHZOxzG6nKZznOGq4Go_gWHzMczFw
```

---

## 3. Frontend Changes

### Update `src/utils/providerNotesChecker.js`

```javascript
/**
 * Provider Notes Checker - Backend AI Integration
 * Calls backend API instead of directly calling Gemini
 */

/**
 * Get AI response to analyze provider and hygienist notes
 * @param {string} providerText - Provider notes text
 * @param {string} hygienistText - Hygienist notes text
 * @returns {Promise<Array>} Array of extracted data in order:
 *   [provider_tooth_number, provider_name, provider_procedure_name, provider_surgical_indicators,
 *    hygienist_tooth_number, hygienist_name, hygienist_procedure_name, hygienist_surgical_indicators]
 */
export async function getGeminiResponse(providerText, hygienistText) {
  console.log("Sending to backend AI service...");
  console.log("Provider Text:", providerText);
  console.log("Hygienist Text:", hygienistText);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  try {
    const response = await fetch(`${API_URL}/ai/check-notes`, {
      method: "POST",
      credentials: 'include', // Include cookies
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem('token')}`, // Auth token
      },
      body: JSON.stringify({
        providerText: providerText || "",
        hygienistText: hygienistText || "",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze notes');
    }

    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.message || 'AI analysis failed');
    }

    console.log("AI Response from backend:", responseData.data);
    
    // Return the flat array from backend
    return responseData.data;

  } catch (error) {
    console.error("Error in getGeminiResponse:", error);
    // Return default false values on error
    return [false, false, false, false, false, false, false, false];
  }
}
```

---

## 4. Testing

### Test Request (Postman/Thunder Client)

**Endpoint:** `POST http://localhost:5000/api/ai/check-notes`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body:**
```json
{
  "providerText": "Dr. Smith performed root canal on tooth #12 and #13. Flap raised, bone removal required.",
  "hygienistText": "Sarah cleaned UR quadrant, 4 quads total. Routine cleaning performed."
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    "12, 13",                                      // provider_tooth_number
    "Dr. Smith",                                   // provider_name
    "root canal",                                  // provider_procedure_name
    "Flap Raised [flap raised], Bone removal [bone removal required]", // provider_surgical_indicators
    "UR, 4 quads",                                 // hygienist_tooth_number
    "Sarah",                                       // hygienist_name
    "cleaning",                                    // hygienist_procedure_name
    false                                          // hygienist_surgical_indicators
  ]
}
```

---

## 5. Security Benefits

✅ **API Key Hidden:** Gemini API key backend mein secure hai  
✅ **Authentication Required:** Sirf authorized users hi AI service use kar sakte hain  
✅ **Rate Limiting:** Backend pe rate limiting add kar sakte ho  
✅ **Logging:** Backend pe AI requests ko log kar sakte ho  
✅ **Cost Control:** AI usage ko monitor aur control kar sakte ho

---

## 6. Migration Checklist

- [ ] Backend route create karo (`routes/ai.js`)
- [ ] Environment variable add karo (`.env`)
- [ ] Route ko main app mein register karo
- [ ] Frontend `providerNotesChecker.js` update karo
- [ ] Testing karo (with valid token)
- [ ] Frontend se purani API key remove karo
- [ ] Production environment variable setup karo

---

## Notes

- **Response Format:** Backend exact same flat array format return karta hai jo frontend expect karta hai
- **Error Handling:** Backend aur frontend dono mein proper error handling hai
- **Authentication:** Backend route JWT token verify karta hai
- **CORS:** Ensure karo ki backend mein CORS properly configured hai with `credentials: true`

