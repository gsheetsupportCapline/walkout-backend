const Walkout = require("../models/Walkout");
const { analyzeWalkoutData } = require("../utils/analyzeWalkoutData");
const {
  syncAllAnalysisData,
  syncCodeCompatibility,
  syncAllowableChanges,
} = require("../services/analysisDataSyncService");

/**
 * @desc    Analyze walkout data by comparing Office and LC3 extracted data
 * @route   POST /api/analysis/analyze/:walkoutId
 * @access  Private (authenticated users)
 */
exports.analyzeWalkout = async (req, res) => {
  try {
    const { walkoutId } = req.params;

    // Find walkout by ID
    const walkout = await Walkout.findById(walkoutId);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // Check if both office and LC3 data exist
    const officeData = walkout.officeWalkoutSnip?.extractedData;
    const lc3Data = walkout.lc3WalkoutImage?.extractedData;

    if (!officeData) {
      return res.status(400).json({
        success: false,
        message: "Office walkout image data not found. Please upload and extract office walkout image first.",
      });
    }

    if (!lc3Data) {
      return res.status(400).json({
        success: false,
        message: "LC3 walkout image data not found. Please upload and extract LC3 walkout image first.",
      });
    }

    // Perform analysis
    const analysisResult = await analyzeWalkoutData(officeData, lc3Data);

    if (!analysisResult.success) {
      return res.status(400).json(analysisResult);
    }

    // Save analysis result to walkout document
    walkout.analysisResult = JSON.stringify(analysisResult.data);
    walkout.lastAnalyzedAt = new Date().toISOString();
    
    // Update audit section with analysis data
    if (!walkout.auditSection) {
      walkout.auditSection = {};
    }
    walkout.auditSection.auditAnalysisData = JSON.stringify(analysisResult.data);
    
    await walkout.save();

    res.status(200).json({
      success: true,
      message: "Analysis completed successfully",
      data: analysisResult.data,
      analyzedAt: walkout.lastAnalyzedAt,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Analysis failed",
      error: error.message,
    });
  }
};

/**
 * @desc    Regenerate analysis for a walkout (re-run analysis on existing data)
 * @route   POST /api/analysis/regenerate/:walkoutId
 * @access  Private (authenticated users)
 */
exports.regenerateAnalysis = async (req, res) => {
  try {
    const { walkoutId } = req.params;

    // Find walkout by ID
    const walkout = await Walkout.findById(walkoutId);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // Check if both office and LC3 data exist
    const officeData = walkout.officeWalkoutSnip?.extractedData;
    const lc3Data = walkout.lc3WalkoutImage?.extractedData;

    if (!officeData) {
      return res.status(400).json({
        success: false,
        message: "Office walkout image data not found. Please upload and extract office walkout image first.",
      });
    }

    if (!lc3Data) {
      return res.status(400).json({
        success: false,
        message: "LC3 walkout image data not found. Please upload and extract LC3 walkout image first.",
      });
    }

    console.log(`🔄 Regenerating analysis for walkout ${walkoutId}`);
    console.log(`👤 Triggered by: ${req.user.name} (${req.user.email})`);

    // Perform analysis
    const analysisResult = await analyzeWalkoutData(officeData, lc3Data);

    if (!analysisResult.success) {
      return res.status(400).json(analysisResult);
    }

    // Save analysis result to walkout document
    walkout.analysisResult = JSON.stringify(analysisResult.data);
    walkout.lastAnalyzedAt = new Date().toISOString();
    
    // Update audit section with analysis data
    if (!walkout.auditSection) {
      walkout.auditSection = {};
    }
    walkout.auditSection.auditAnalysisData = JSON.stringify(analysisResult.data);
    
    await walkout.save();

    console.log(`✅ Analysis regenerated successfully`);

    res.status(200).json({
      success: true,
      message: "Analysis regenerated successfully",
      data: analysisResult.data,
      analyzedAt: walkout.lastAnalyzedAt,
      triggeredBy: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    console.error("Analysis regeneration error:", error);
    res.status(500).json({
      success: false,
      message: "Analysis regeneration failed",
      error: error.message,
    });
  }
};

/**
 * @desc    Get analysis result for a walkout
 * @route   GET /api/analysis/result/:walkoutId
 * @access  Private (authenticated users)
 */
exports.getAnalysisResult = async (req, res) => {
  try {
    const { walkoutId } = req.params;

    const walkout = await Walkout.findById(walkoutId);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    if (!walkout.analysisResult) {
      return res.status(404).json({
        success: false,
        message: "No analysis result found. Please run analysis first.",
      });
    }

    const analysisData = JSON.parse(walkout.analysisResult);

    res.status(200).json({
      success: true,
      data: analysisData,
      analyzedAt: walkout.lastAnalyzedAt,
    });
  } catch (error) {
    console.error("Get analysis result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get analysis result",
      error: error.message,
    });
  }
};

/**
 * @desc    Manual sync of analysis data (Code Compatibility & Allowable Changes) from Google Sheets
 * @route   POST /api/analysis/sync
 * @access  Private (admin/superAdmin only)
 */
exports.manualSyncAnalysisData = async (req, res) => {
  try {
    console.log(`\n🔄 Manual sync triggered by: ${req.user.name}`);

    const syncResult = await syncAllAnalysisData();

    res.status(200).json({
      success: true,
      message: "Analysis data synced successfully from Google Sheets",
      data: syncResult,
    });
  } catch (error) {
    console.error("Manual sync error:", error);
    res.status(500).json({
      success: false,
      message: "Sync failed",
      error: error.message,
    });
  }
};

/**
 * @desc    Get sync status and data counts
 * @route   GET /api/analysis/sync-status
 * @access  Private (admin/superAdmin only)
 */
exports.getSyncStatus = async (req, res) => {
  try {
    const CodeCompatibility = require("../models/CodeCompatibility");
    const AllowableChanges = require("../models/AllowableChanges");

    const codeCompatibilityCount = await CodeCompatibility.countDocuments();
    const allowableChangesCount = await AllowableChanges.countDocuments();

    // Get last sync time
    const lastCodeCompatibility = await CodeCompatibility.findOne()
      .sort({ lastSyncedAt: -1 })
      .limit(1);
    const lastAllowableChange = await AllowableChanges.findOne()
      .sort({ lastSyncedAt: -1 })
      .limit(1);

    res.status(200).json({
      success: true,
      data: {
        codeCompatibility: {
          count: codeCompatibilityCount,
          lastSyncedAt: lastCodeCompatibility?.lastSyncedAt || "Never synced",
        },
        allowableChanges: {
          count: allowableChangesCount,
          lastSyncedAt: lastAllowableChange?.lastSyncedAt || "Never synced",
        },
      },
    });
  } catch (error) {
    console.error("Get sync status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sync status",
      error: error.message,
    });
  }
};
