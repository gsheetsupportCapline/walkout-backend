const ImageExtractionLog = require("../models/ImageExtractionLog");
const { toCSTDate, toCSTDateString } = require("../utils/timezone");
const {
  getLogsByFormRefId,
  getLogsByStatus,
  getExtractionStats,
  getRecentFailures,
  retryExtraction,
} = require("../utils/imageExtractionLogger");

/**
 * @desc    Get all extraction logs with filters
 * @route   GET /api/extraction-logs
 * @access  Admin, SuperAdmin
 */
exports.getExtractionLogs = async (req, res) => {
  try {
    const {
      status,
      extractorType,
      extractionMode,
      formRefId,
      patientId,
      officeName,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (extractorType) query.extractorType = extractorType;
    if (extractionMode) query.extractionMode = extractionMode;
    if (formRefId) query.formRefId = formRefId;
    if (patientId) query.patientId = patientId;
    if (officeName) query.officeName = new RegExp(officeName, "i");

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = toCSTDateString(startDate);
      if (endDate) query.createdAt.$lte = toCSTDateString(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ImageExtractionLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("triggeredBy", "firstName lastName email")
      .select("-errorStack -promptUsed"); // Exclude large fields

    const total = await ImageExtractionLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching extraction logs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching extraction logs",
      error: error.message,
    });
  }
};

/**
 * @desc    Get extraction log by ID
 * @route   GET /api/extraction-logs/:id
 * @access  Admin, SuperAdmin
 */
exports.getExtractionLogById = async (req, res) => {
  try {
    const log = await ImageExtractionLog.findById(req.params.id).populate(
      "triggeredBy",
      "firstName lastName email",
    );

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Extraction log not found",
      });
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Error fetching extraction log:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching extraction log",
      error: error.message,
    });
  }
};

/**
 * @desc    Get extraction logs by formRefId
 * @route   GET /api/extraction-logs/form/:formRefId
 * @access  Admin, SuperAdmin, User
 */
exports.getLogsByForm = async (req, res) => {
  try {
    const { formRefId } = req.params;

    const logs = await getLogsByFormRefId(formRefId);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching logs by formRefId:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching logs",
      error: error.message,
    });
  }
};

/**
 * @desc    Get extraction statistics
 * @route   GET /api/extraction-logs/stats
 * @access  Admin, SuperAdmin
 */
exports.getStats = async (req, res) => {
  try {
    const { extractorType } = req.query;

    const stats = await getExtractionStats(extractorType);

    // Get additional stats
    const officeStats = await getExtractionStats("office");
    const lc3Stats = await getExtractionStats("lc3");

    res.status(200).json({
      success: true,
      data: {
        overall: stats,
        office: officeStats,
        lc3: lc3Stats,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get recent failed extractions
 * @route   GET /api/extraction-logs/failures
 * @access  Admin, SuperAdmin
 */
exports.getFailures = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const failures = await getRecentFailures(parseInt(limit));

    res.status(200).json({
      success: true,
      count: failures.length,
      data: failures,
    });
  } catch (error) {
    console.error("Error fetching failures:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching failures",
      error: error.message,
    });
  }
};

/**
 * @desc    Retry a failed extraction
 * @route   POST /api/extraction-logs/:id/retry
 * @access  Admin, SuperAdmin
 */
exports.retryFailedExtraction = async (req, res) => {
  try {
    const newLog = await retryExtraction(req.params.id);

    // Here you would trigger the actual extraction process again
    // For now, just return the new log entry

    res.status(200).json({
      success: true,
      message: "Extraction retry initiated",
      data: newLog,
    });
  } catch (error) {
    console.error("Error retrying extraction:", error);
    res.status(500).json({
      success: false,
      message: "Error retrying extraction",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete extraction log
 * @route   DELETE /api/extraction-logs/:id
 * @access  SuperAdmin only
 */
exports.deleteExtractionLog = async (req, res) => {
  try {
    const log = await ImageExtractionLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Extraction log not found",
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: "Extraction log deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting extraction log:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting extraction log",
      error: error.message,
    });
  }
};

/**
 * @desc    Get extraction logs summary for dashboard
 * @route   GET /api/extraction-logs/dashboard/summary
 * @access  Admin, SuperAdmin
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get stats for last 24 hours
    const last24Hours = toCSTDateString(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    const recentStats = await ImageExtractionLog.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours },
        },
      },
      {
        $group: {
          _id: {
            status: "$status",
            extractorType: "$extractorType",
          },
          count: { $sum: 1 },
          avgDuration: { $avg: "$processDuration" },
        },
      },
    ]);

    // Get current pending/processing count
    const pendingCount = await ImageExtractionLog.countDocuments({
      status: { $in: ["pending", "processing"] },
    });

    // Get recent failures (last 10)
    const recentFailures = await ImageExtractionLog.find({ status: "failed" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "formRefId patientId officeName errorMessage createdAt extractorType",
      );

    res.status(200).json({
      success: true,
      data: {
        last24Hours: recentStats,
        pendingCount,
        recentFailures,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard summary",
      error: error.message,
    });
  }
};
