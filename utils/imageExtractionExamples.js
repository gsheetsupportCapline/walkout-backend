/**
 * USAGE EXAMPLE: Image Extraction Logger
 *
 * How to integrate this logger in your image extraction process
 */

const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

/**
 * Example 1: Office Walkout Image Extraction (Automatic - on upload)
 */
async function officeWalkoutImageExtraction(walkoutData, imageDetails, userId) {
  let logId = null;

  try {
    // Step 1: Create log entry when extraction starts
    const log = await createExtractionLog({
      formRefId: walkoutData.formRefId,
      patientId: walkoutData.appointmentInfo.patientId,
      dateOfService: walkoutData.appointmentInfo.dateOfService,
      officeName: walkoutData.appointmentInfo.officeName,
      imageId: imageDetails.imageId,
      fileName: imageDetails.fileName,
      imageUploadedAt: imageDetails.uploadedAt,
      extractorType: "office",
      extractionMode: "automatic", // ⭐ Automatic mode - background extraction
      triggeredBy: userId,
      promptUsed: "Office walkout extraction prompt...", // Your actual prompt
      isRegeneration: false,
    });

    logId = log._id;

    // Step 2: Mark as processing when AI starts working
    await markAsProcessing(logId);

    // Step 3: Call your AI extraction service
    const extractedData = await callOpenAIForExtraction(imageDetails);

    // Step 4: Mark as completed with extracted data
    await markAsCompleted(logId, extractedData);

    // Return the extracted data
    return extractedData;
  } catch (error) {
    // Step 5: Mark as failed if any error occurs
    if (logId) {
      await markAsFailed(logId, error);
    }

    throw error;
  }
}

/**
 * Example 2: LC3 Walkout Image Extraction (Automatic - on upload)
 */
async function lc3WalkoutImageExtraction(walkoutData, imageDetails, userId) {
  let logId = null;

  try {
    // Create log entry
    const log = await createExtractionLog({
      formRefId: walkoutData.formRefId,
      patientId: walkoutData.appointmentInfo.patientId,
      dateOfService: walkoutData.appointmentInfo.dateOfService,
      officeName: walkoutData.appointmentInfo.officeName,
      imageId: imageDetails.imageId,
      fileName: imageDetails.fileName,
      imageUploadedAt: imageDetails.uploadedAt,
      extractorType: "lc3",
      extractionMode: "automatic", // ⭐ Automatic mode - background extraction
      triggeredBy: userId,
      promptUsed: "LC3 walkout extraction prompt...", // Your actual prompt
      isRegeneration: false,
    });

    logId = log._id;

    // Mark as processing
    await markAsProcessing(logId);

    // AI extraction
    const extractedData = await callOpenAIForExtraction(imageDetails);

    // Mark as completed
    await markAsCompleted(logId, extractedData);

    return extractedData;
  } catch (error) {
    if (logId) {
      await markAsFailed(logId, error);
    }
    throw error;
  }
}

/**
 * Example 3: Background/Async Extraction Process (Automatic)
 */
async function backgroundImageExtraction(
  walkoutData,
  imageDetails,
  userId,
  extractorType,
) {
  let logId = null;

  try {
    // Create log entry
    const log = await createExtractionLog({
      formRefId: walkoutData.formRefId,
      patientId: walkoutData.appointmentInfo.patientId,
      dateOfService: walkoutData.appointmentInfo.dateOfService,
      officeName: walkoutData.appointmentInfo.officeName,
      imageId: imageDetails.imageId,
      fileName: imageDetails.fileName,
      imageUploadedAt: imageDetails.uploadedAt,
      extractorType: extractorType, // 'office' or 'lc3'
      extractionMode: "automatic", // ⭐ Background extraction is always automatic
      triggeredBy: userId,
      promptUsed:
        extractorType === "office" ? "Office prompt..." : "LC3 prompt...",
      isRegeneration: false,
    });

    logId = log._id;

    // Don't await - run in background
    processExtractionInBackground(logId, imageDetails);

    // Return immediately with log ID
    return {
      success: true,
      message: "Image extraction started in background",
      logId: logId,
    };
  } catch (error) {
    console.error("Error starting background extraction:", error);
    throw error;
  }
}

/**
 * Background processing function
 */
async function processExtractionInBackground(logId, imageDetails) {
  try {
    // Mark as processing
    await markAsProcessing(logId);

    // Perform extraction
    const extractedData = await callOpenAIForExtraction(imageDetails);

    // Save to walkout document
    await saveExtractedDataToWalkout(logId, extractedData);

    // Mark as completed
    await markAsCompleted(logId, extractedData);

    console.log(`✅ Background extraction completed: ${logId}`);
  } catch (error) {
    console.error(`❌ Background extraction failed: ${logId}`, error);
    await markAsFailed(logId, error);
  }
}

/**
 * Example 4: Regeneration with tracking (Manual mode)
 */
async function regenerateImageExtraction(
  walkoutData,
  imageDetails,
  userId,
  extractorType,
) {
  let logId = null;

  try {
    // Create log entry with regeneration flag
    const log = await createExtractionLog({
      formRefId: walkoutData.formRefId,
      patientId: walkoutData.appointmentInfo.patientId,
      dateOfService: walkoutData.appointmentInfo.dateOfService,
      officeName: walkoutData.appointmentInfo.officeName,
      imageId: imageDetails.imageId,
      fileName: imageDetails.fileName,
      imageUploadedAt: imageDetails.uploadedAt,
      extractorType: extractorType,
      extractionMode: "manual", // ⭐ Regeneration is always manual
      triggeredBy: userId,
      promptUsed: "Regeneration prompt...",
      isRegeneration: true, // Mark as regeneration
    });

    logId = log._id;

    await markAsProcessing(logId);

    const extractedData = await callOpenAIForExtraction(imageDetails);

    await markAsCompleted(logId, extractedData);

    return extractedData;
  } catch (error) {
    if (logId) {
      await markAsFailed(logId, error);
    }
    throw error;
  }
}

// Dummy function - replace with your actual AI service
async function callOpenAIForExtraction(imageDetails) {
  // Your OpenAI API call here
  return "Extracted data from AI...";
}

// Dummy function - replace with your actual save logic
async function saveExtractedDataToWalkout(logId, extractedData) {
  // Save extracted data to walkout document
  console.log(`Saving data to walkout for log: ${logId}`);
}

module.exports = {
  officeWalkoutImageExtraction,
  lc3WalkoutImageExtraction,
  backgroundImageExtraction,
  regenerateImageExtraction,
};
