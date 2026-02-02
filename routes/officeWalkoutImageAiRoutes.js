const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Walkout = require("../models/Walkout");
const {
  extractOfficeWalkoutData,
} = require("../controllers/officeWalkoutImageAiController");
const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

/**
 * @desc    Re-extract data from office walkout image using AI
 * @route   POST /api/office-walkout-ai/regenerate/:id
 * @access  Protected (Admin, SuperAdmin)
 */
router.post(
  "/regenerate/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  async (req, res) => {
    let logId = null;

    try {
      const { id } = req.params;

      // Find walkout
      const walkout = await Walkout.findById(id);

      if (!walkout) {
        return res.status(404).json({
          success: false,
          message: "Walkout not found",
        });
      }

      // Check if office walkout image exists
      if (!walkout.officeWalkoutSnip || !walkout.officeWalkoutSnip.imageId) {
        return res.status(404).json({
          success: false,
          message: "No office walkout image found for this walkout",
        });
      }

      const imageKey = walkout.officeWalkoutSnip.imageId;

      // Check if this is a legacy Google Drive image
      const isGoogleDriveId =
        !imageKey.includes("/") && /^[a-zA-Z0-9_-]+$/.test(imageKey);

      if (isGoogleDriveId) {
        return res.status(410).json({
          success: false,
          message:
            "Cannot extract data from legacy Google Drive images. Please re-upload the image.",
          errorCode: "LEGACY_GOOGLE_DRIVE_IMAGE",
        });
      }

      // ====================================
      // AI REGENERATION RATE LIMITING
      // ====================================
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      // Initialize aiRegenerationDetails if not exists
      if (!walkout.officeWalkoutSnip.aiRegenerationDetails) {
        walkout.officeWalkoutSnip.aiRegenerationDetails = {
          totalRegenerateCount: 0,
          hourlyRegenerateCount: 0,
          lastRegeneratedAt: null,
        };
      }

      const regenDetails = walkout.officeWalkoutSnip.aiRegenerationDetails;

      // Check if last regeneration was more than 1 hour ago
      const isMoreThanOneHour =
        !regenDetails.lastRegeneratedAt ||
        regenDetails.lastRegeneratedAt < oneHourAgo;

      // Reset hourly count if more than 1 hour has passed
      if (isMoreThanOneHour) {
        console.log(
          "⏰ More than 1 hour since last regeneration - resetting hourly count",
        );
        regenDetails.hourlyRegenerateCount = 0;
      }

      // Check hourly limit (max 5 per hour)
      if (regenDetails.hourlyRegenerateCount >= 5) {
        const timeUntilReset = new Date(
          regenDetails.lastRegeneratedAt.getTime() + 60 * 60 * 1000,
        );
        const minutesRemaining = Math.ceil(
          (timeUntilReset - now) / (60 * 1000),
        );

        // Parse existing extracted data to return
        let existingData = null;
        try {
          if (walkout.officeWalkoutSnip.extractedData) {
            existingData = JSON.parse(walkout.officeWalkoutSnip.extractedData);
          }
        } catch (parseError) {
          console.error("Error parsing existing extractedData:", parseError);
        }

        return res.status(429).json({
          success: false,
          message: `Hourly regeneration limit reached (5 per hour). Please try again in ${minutesRemaining} minute(s).`,
          errorCode: "RATE_LIMIT_EXCEEDED",
          details: {
            hourlyCount: regenDetails.hourlyRegenerateCount,
            totalCount: regenDetails.totalRegenerateCount,
            lastRegeneratedAt: regenDetails.lastRegeneratedAt,
            retryAfter: timeUntilReset,
          },
          data: {
            extractedData: existingData, // Return existing data for frontend rendering
            rowsExtracted: existingData?.data?.length || 0,
          },
        });
      }

      console.log(
        `🔄 Re-generating AI extraction for walkout ${id}, image: ${imageKey}`,
      );
      console.log(
        `📊 Current counts - Total: ${regenDetails.totalRegenerateCount}, Hourly: ${regenDetails.hourlyRegenerateCount}`,
      );

      // ====================================
      // CREATE EXTRACTION LOG (Manual/Regenerate)
      // ====================================
      const log = await createExtractionLog({
        formRefId: walkout.formRefId,
        patientId: walkout.appointmentInfo.patientId,
        dateOfService: walkout.appointmentInfo.dateOfService,
        officeName: walkout.appointmentInfo.officeName,
        imageId: walkout.officeWalkoutSnip.imageId,
        fileName: walkout.officeWalkoutSnip.fileName,
        imageUploadedAt: walkout.officeWalkoutSnip.uploadedAt,
        extractorType: "office",
        extractionMode: "manual", // Regenerate is always manual
        triggeredBy: req.user._id,
        isRegeneration: true,
      });

      logId = log._id;
      console.log(`📝 Extraction log created: ${logId}`);

      // Mark as processing
      await markAsProcessing(logId);

      // Extract data using AI
      const extractedJson = await extractOfficeWalkoutData(imageKey);

      // Update walkout with extracted data and increment counters
      walkout.officeWalkoutSnip.extractedData = JSON.stringify(extractedJson);
      regenDetails.totalRegenerateCount += 1;
      regenDetails.hourlyRegenerateCount += 1;
      regenDetails.lastRegeneratedAt = now;

      // Save to database immediately
      await walkout.save();

      // Mark extraction as completed
      await markAsCompleted(logId, JSON.stringify(extractedJson));

      console.log(
        `✅ Successfully re-extracted ${extractedJson.data?.length || 0} rows`,
      );
      console.log(
        `📊 Updated counts - Total: ${regenDetails.totalRegenerateCount}, Hourly: ${regenDetails.hourlyRegenerateCount}`,
      );

      res.status(200).json({
        success: true,
        message: "Data extracted successfully",
        logId: logId, // Return log ID
        data: {
          rowsExtracted: extractedJson.data?.length || 0,
          extractedData: extractedJson,
          regenerationDetails: {
            totalRegenerateCount: regenDetails.totalRegenerateCount,
            hourlyRegenerateCount: regenDetails.hourlyRegenerateCount,
            lastRegeneratedAt: regenDetails.lastRegeneratedAt,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error re-extracting data:", error);

      // Mark extraction as failed if log was created
      if (logId) {
        await markAsFailed(logId, error);
      }

      res.status(500).json({
        success: false,
        message: "Failed to extract data from image",
        error: error.message,
      });
    }
  },
);

module.exports = router;
