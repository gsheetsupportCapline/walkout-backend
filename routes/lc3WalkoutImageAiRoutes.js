const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/auth");
const Walkout = require("../models/Walkout");
const {
  extractLc3WalkoutData,
} = require("../controllers/lc3WalkoutImageAiController");

/**
 * @desc    Re-extract data from LC3 walkout image using AI
 * @route   POST /api/lc3-walkout-ai/regenerate/:id
 * @access  Protected (Admin, SuperAdmin)
 */
router.post(
  "/regenerate/:id",
  protect,
  restrictTo("admin", "superAdmin"),
  async (req, res) => {
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

      // Check if LC3 walkout image exists
      if (!walkout.lc3WalkoutImage || !walkout.lc3WalkoutImage.imageId) {
        return res.status(404).json({
          success: false,
          message: "No LC3 walkout image found for this walkout",
        });
      }

      const imageKey = walkout.lc3WalkoutImage.imageId;

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
      if (!walkout.lc3WalkoutImage.aiRegenerationDetails) {
        walkout.lc3WalkoutImage.aiRegenerationDetails = {
          totalRegenerateCount: 0,
          hourlyRegenerateCount: 0,
          lastRegeneratedAt: null,
        };
      }

      const regenDetails = walkout.lc3WalkoutImage.aiRegenerationDetails;

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
          if (walkout.lc3WalkoutImage.extractedData) {
            existingData = JSON.parse(walkout.lc3WalkoutImage.extractedData);
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
        `🔄 Re-generating AI extraction for LC3 walkout ${id}, image: ${imageKey}`,
      );
      console.log(
        `📊 Current counts - Total: ${regenDetails.totalRegenerateCount}, Hourly: ${regenDetails.hourlyRegenerateCount}`,
      );

      // Extract data using AI
      const extractedJson = await extractLc3WalkoutData(imageKey);

      // Update walkout with extracted data and increment counters
      walkout.lc3WalkoutImage.extractedData = JSON.stringify(extractedJson);
      regenDetails.totalRegenerateCount += 1;
      regenDetails.hourlyRegenerateCount += 1;
      regenDetails.lastRegeneratedAt = now;

      // Save to database immediately
      await walkout.save();

      console.log(
        `✅ Successfully re-extracted ${extractedJson.data?.length || 0} rows from LC3 image`,
      );
      console.log(
        `📊 Updated counts - Total: ${regenDetails.totalRegenerateCount}, Hourly: ${regenDetails.hourlyRegenerateCount}`,
      );

      res.status(200).json({
        success: true,
        message: "Data extracted successfully from LC3 image",
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
      console.error("❌ Error re-extracting LC3 data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to extract data from LC3 image",
        error: error.message,
      });
    }
  },
);

module.exports = router;
