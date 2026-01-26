const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getPresignedUrl } = require("../utils/s3Upload");
const fetch = require("node-fetch");

/**
 * @desc    Extract data from LC3 walkout image using Gemini AI
 * @param   {string} imageKey - S3 key of the image
 * @returns {Promise<Object>} Extracted data as JSON object
 */
exports.extractLc3WalkoutData = async (imageKey) => {
  try {
    console.log("🤖 Starting AI extraction for LC3 walkout image...");
    console.log(`📸 Image Key: ${imageKey}`);

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    // Get presigned URL for image (1 hour expiry)
    const imageUrl = await getPresignedUrl(imageKey);
    console.log(`🔗 Generated presigned URL for AI processing`);

    // Download image as buffer
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    console.log(`✅ Image downloaded and converted to base64`);

    // LC3 specific prompt
    const prompt = `You are a document AI model. Extract all table data from this image. 
Even if the table is rotated, faint, or partially obscured, do your best.
Return the result strictly in minified JSON format (no markdown or code blocks).
Do not include any explanation. Just output JSON.

 And You are an intelligent data extraction assistant. I will provide you with an image containing a screenshot from a dental office software. The image includes a table located towards the bottom with the following columns and their respective purposes:

1. **Date** (the date is mentioned in this column)
2. **Patient** (the patient's name is in this column)
3. **Provider** (the name of the provider/doctor/hygienist is written here)
4. **Type** (the type is mentioned here)
5. **Description** (this column contains the service code, procedure name, and other details)
6. **Tooth** (the tooth on which the particular service/procedure was performed is listed here)
7. **Surface** (the surface of the tooth where the service/procedure was performed is written here)

Output only the final JSON array without any additional text or explanations.

Example Output:
{
  "data":[
    {
      "Date": "2025-01-20",
      "Patient": "John Doe",
      "Provider": "Dr. Smith",
      "Type": "Cleaning",
      "Description": {"service_code":"D4999","procedure_name":"Teeth Cleaning","others":"Routine check"},
      "Tooth": "12",
      "Surface": "M"
    },
    {
      "Date": "2025-01-20",
      "Patient": "Jane Smith",
      "Provider": "Dr. Adams",
      "Type": "Filling",
      "Description": {"service_code":"D0150", "procedure_name":"Cavity Filling", "others":"Composite"},
      "Tooth": "18",
      "Surface": "O",
    }
  ]
}

In dental services, there are service codes that begin with 'D' as well as those that do not like PREP, SEAT, IMPS, POST, OS (Oral Surgery Referral), CONSU (CONSULT), WISDOM, BIOPR, OV, ADJ, RETEM, TRYIN, WAX, etc. It is important to carefully review all codes from dental services and categorize them accordingly. Services that fall under the 'D' category contain only the letter 'D' followed by four digits (e.g., D4999). They do not include any additional letters, symbols, or special characters such as '-', '', or '/'. Save all the services carefully.

Additionally, I am listing all the possible surfaces and teeth options below. When extracting data from images, please ensure that only the surfaces mentioned below are placed in the 'surface' column. Everything else, including the extra details, should be placed in the 'tooth' column. Also, pay close attention to which item belongs to which column based on the image.

For surfaces, the following alphabets should appear in the 'surface' column:
Surface: O, M, I, F, D, L, B
surface can be single or in pair like O or MO or MDB

For teeth, the following options should appear in the 'tooth' column:
Tooth: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, as well as the extra details:
Quads: UR, UL, LL, LR
Arch: UA, LA

If any of the following keywords appear anywhere within the Description area and service starts with "D" is not there : PREP, SEAT, IMPS, PO, OS, CONSU, WISDOM, BIOPR, OV, ADJ,POST, RETEM, TRYIN, WAX, REIM, RIMP, DELCR, NG, RESM, ADJDE, RIM, PRMDN, WAXTE, etc. they must be considered a service_code. Pay special attention to single-row images, as they're more likely to contain this data.
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
      `✅ Successfully extracted ${extractedData.data?.length || 0} rows from LC3 image`,
    );

    return extractedData;
  } catch (error) {
    console.error("❌ Error extracting data from LC3 walkout image:", error);
    throw new Error(`Failed to extract data from LC3 image: ${error.message}`);
  }
};
