const { GoogleGenerativeAI } = require("@google/generative-ai");
const { toCSTDateString } = require("../utils/timezone");

/**
 * @desc    Analyze provider and hygienist notes using Gemini AI
 * @route   POST /api/ai/check-notes
 * @access  Protected (All authenticated users)
 */
exports.checkNotesWithAI = async (req, res) => {
  try {
    const { providerText, hygienistText } = req.body;

    // Validation
    if (!providerText && !hygienistText) {
      return res.status(400).json({
        success: false,
        message: "Provider or hygienist notes required",
      });
    }

    console.log("🤖 AI Analysis Request:");
    console.log("Provider Text:", providerText || "N/A");
    console.log("Hygienist Text:", hygienistText || "N/A");

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
    });

    // Build the prompt (exact same as frontend implementation)
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
${providerText || ""}

Text 1 ends here.

// cache‑buster: ${toCSTDateString()}

Text 2 (hygienist note):
${hygienistText || ""}

Text 2 ends here.
`;

    // Generate content with exact same configuration as frontend
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    });

    const response = result.response;
    const replyText = response.text().trim();

    console.log("🤖 Raw AI Response:", replyText);

    // Extract JSON from response
    const jsonMatch = replyText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    // Return flat array format that frontend expects (exact same order)
    const flatResult = [
      parsedResult.provider_note.tooth_number || false, // [0]
      parsedResult.provider_note.provider_name || false, // [1]
      parsedResult.provider_note.procedure_name || false, // [2]
      parsedResult.provider_note.surgical_indicators || false, // [3]
      parsedResult.hygienist_note.tooth_number || false, // [4]
      parsedResult.hygienist_note.hygienist_name || false, // [5]
      parsedResult.hygienist_note.procedure_name || false, // [6]
      parsedResult.hygienist_note.surgical_indicators || false, // [7]
    ];

    console.log("✅ AI Analysis Result:", flatResult);

    res.status(200).json({
      success: true,
      data: flatResult,
    });
  } catch (error) {
    console.error("❌ AI Check Notes Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze notes with AI",
      error: error.message,
    });
  }
};
