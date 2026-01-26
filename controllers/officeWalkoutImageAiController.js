const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getPresignedUrl } = require("../utils/s3Upload");
const fetch = require("node-fetch");

/**
 * @desc    Extract data from office walkout image using Gemini AI
 * @param   {string} imageKey - S3 key of the image
 * @returns {Promise<Object>} Extracted data as JSON object
 */
exports.extractOfficeWalkoutData = async (imageKey) => {
  try {
    console.log("🤖 Starting AI extraction for office walkout image...");
    console.log(`📸 Image Key: ${imageKey}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Get presigned URL for image (1 hour expiry)
    const imageUrl = await getPresignedUrl(imageKey);
    console.log(`🔗 Generated presigned URL for AI processing`);

    // Download image as buffer
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    console.log(`✅ Image downloaded and converted to base64`);

    // Exact prompt as provided by user
    const prompt = `
You are a document AI model. Extract all table data from this image. 
Even if the table is rotated, faint, or partially obscured, do your best.
Return the result strictly in minified JSON format (no markdown or code blocks).
Do not include any explanation. Just output JSON.

And You are provided with an image showing walkout details from a dental office. Although the image contains multiple columns, your task is to extract data only from the table columns specified below:
- Patient
- Service
- Provider
- Description
- Tooth
- Surface

Follow these rules precisely:
1. **Target Table Only:**  
   - Process only the data from the table that contains the columns listed above. Ignore any other sections or additional columns in the image.

2. **Row Inclusion Criteria:**  
   - Only extract rows where the "Service" column has a valid service code (e.g., D0150, D0220, D0230, etc.). 
   - Service codes are not limited to the examples mentioned above; there are additional dental service codes that should also be considered.
   - If a row has an empty or missing value in the "Service" column, completely ignore that row.

3. **Field Requirements:**  
   - **Patient:** Extract the patient's name as shown in the table.
   - **Service:** Extract the service code (only if the code is present; otherwise, the row should be skipped).
   - **Provider:** Extract the provider's name as shown in the table.
   - **Description:** Extract the service description.
   - **Tooth:** Extract the tooth value. Allowed values include numbers (1–32), letters (A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T), quadrant values (UR, UL, LL, LR), or arch values (UA, LA). If there is no valid tooth data, return an empty string.
   - **Surface:** Extract the surface value. Valid entries are one or combinations of these letters: O, M, I, F, D, L, B (e.g., "O", "MO", "MDB"). If there is no valid surface data, return an empty string.

4. **Output Format:**  
   - The extracted data must be output exactly in the following JSON format:
     
     {
       "data": [
         {
           "Patient": "<patient name>",
           "Service": "<service code>",
           "Provider": "<provider name>",
           "Description": "<service description>",
           "Tooth": "<tooth number/letter/quadrant/arch or empty>",
           "Surface": "<surface combination or empty>"
         },
         ... (additional rows)
       ]
     }
     

   - Ensure the field names and the order are exactly as specified.
   - Do not include any extra fields, commentary, or text outside the JSON structure.

5. **Extraction Accuracy:**  
   - Only include rows from the table that have a valid "Service" value.
   - Extract the data exactly as displayed in the image based on the provided columns and ignore any extra columns.

Services that fall under the 'D' category contain only the letter 'D' followed by four digits (e.g., D4999). They do not include any additional letters, symbols, or special characters such as '-', '', or '/'. In dental services, there are service codes that begin with 'D' as well as those that do not like PREP, SEAT, IMPS, PO, OS, WISDOM etc. It is important to carefully review all codes and categorize them accordingly. 

Save all the Services, Tooth and Surface carefully.

In the table, the last row is always a blank row that should be ignored, as it does not contain any service-related information. 
Return only the JSON object as defined above and nothing else.

If any of the following keywords appear anywhere within the Service area : PREP, SEAT, IMPS, PO, OS, CONSU, WISDOM, BIOPR, OV, ADJ, RETEM,TRYIN,WAX, DELCR, NG, etc. they must be considered a service_code. Pay special attention to single-row images, as they're more likely to contain this data.

Output only the final JSON array without any additional text or explanations as instructed before.
`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg", // Adjust based on actual image type
          data: base64Image,
        },
      },
    ]);

    const response = result.response;
    const extractedText = response.text().trim();

    console.log("🤖 Raw AI Response:", extractedText);

    // Extract JSON from response
    const jsonMatch = extractedText.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    console.log(
      `✅ Successfully extracted ${extractedData.data?.length || 0} rows from image`,
    );

    return extractedData;
  } catch (error) {
    console.error("❌ Error extracting data from office walkout image:", error);
    throw new Error(`Failed to extract data from image: ${error.message}`);
  }
};
