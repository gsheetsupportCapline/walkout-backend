const ImageExtractionLog = require("../models/ImageExtractionLog");

/**
 * Create a new image extraction log entry
 * @param {Object} data - Log data
 * @returns {Promise<Object>} Created log entry
 */
exports.createExtractionLog = async (data) => {
  try {
    const {
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt,
      extractorType,
      extractionMode = "automatic", // automatic or manual
      triggeredBy,
      promptUsed,
      isRegeneration = false,
    } = data;

    const log = await ImageExtractionLog.create({
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt,
      extractorType,
      extractionMode,
      triggeredBy,
      promptUsed,
      isRegeneration,
      status: "pending",
      requestStartedAt: new Date(),
    });

    console.log(
      `📝 Image extraction log created: ${log._id} (${extractorType} - ${extractionMode})`,
    );
    return log;
  } catch (error) {
    console.error("Error creating extraction log:", error);
    throw error;
  }
};

/**
 * Mark extraction as processing
 * @param {String} logId - Log entry ID
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsProcessing = async (logId) => {
  try {
    const log = await ImageExtractionLog.findById(logId);
    if (!log) {
      throw new Error("Extraction log not found");
    }

    await log.markAsProcessing();
    console.log(`⏳ Extraction marked as processing: ${logId}`);
    return log;
  } catch (error) {
    console.error("Error marking as processing:", error);
    throw error;
  }
};

/**
 * Mark extraction as completed
 * @param {String} logId - Log entry ID
 * @param {String} extractedData - Extracted data
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsCompleted = async (logId, extractedData) => {
  try {
    const log = await ImageExtractionLog.findById(logId);
    if (!log) {
      throw new Error("Extraction log not found");
    }

    await log.markAsCompleted(extractedData);
    console.log(
      `✅ Extraction completed: ${logId} (Duration: ${log.processDuration}ms)`,
    );
    return log;
  } catch (error) {
    console.error("Error marking as completed:", error);
    throw error;
  }
};

/**
 * Mark extraction as failed
 * @param {String} logId - Log entry ID
 * @param {Error} error - Error object
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsFailed = async (logId, error) => {
  try {
    const log = await ImageExtractionLog.findById(logId);
    if (!log) {
      throw new Error("Extraction log not found");
    }

    await log.markAsFailed(error);
    console.log(`❌ Extraction failed: ${logId}`);
    return log;
  } catch (err) {
    console.error("Error marking as failed:", err);
    throw err;
  }
};

/**
 * Get extraction logs by formRefId
 * @param {String} formRefId - Form Reference ID
 * @returns {Promise<Array>} Extraction logs
 */
exports.getLogsByFormRefId = async (formRefId) => {
  try {
    const logs = await ImageExtractionLog.find({ formRefId })
      .sort({ createdAt: -1 })
      .populate("triggeredBy", "firstName lastName email");

    return logs;
  } catch (error) {
    console.error("Error fetching logs by formRefId:", error);
    throw error;
  }
};

/**
 * Get extraction logs by status
 * @param {String} status - Status (pending, processing, success, failed)
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Extraction logs
 */
exports.getLogsByStatus = async (status, limit = 100) => {
  try {
    const logs = await ImageExtractionLog.find({ status })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("triggeredBy", "firstName lastName email");

    return logs;
  } catch (error) {
    console.error("Error fetching logs by status:", error);
    throw error;
  }
};

/**
 * Get extraction statistics
 * @param {String} extractorType - Optional: office or lc3
 * @returns {Promise<Object>} Statistics
 */
exports.getExtractionStats = async (extractorType = null) => {
  try {
    const matchStage = extractorType ? { extractorType } : {};

    const stats = await ImageExtractionLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgDuration: { $avg: "$processDuration" },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      success: 0,
      failed: 0,
      avgDurationSuccess: 0,
      avgDurationFailed: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result[stat._id] = stat.count;

      if (stat._id === "success") {
        result.avgDurationSuccess = Math.round(stat.avgDuration || 0);
      } else if (stat._id === "failed") {
        result.avgDurationFailed = Math.round(stat.avgDuration || 0);
      }
    });

    return result;
  } catch (error) {
    console.error("Error fetching extraction stats:", error);
    throw error;
  }
};

/**
 * Get recent failed extractions
 * @param {Number} limit - Limit results
 * @returns {Promise<Array>} Failed extraction logs
 */
exports.getRecentFailures = async (limit = 50) => {
  try {
    const logs = await ImageExtractionLog.find({ status: "failed" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("triggeredBy", "firstName lastName email")
      .select("-errorStack"); // Exclude error stack from response

    return logs;
  } catch (error) {
    console.error("Error fetching recent failures:", error);
    throw error;
  }
};

/**
 * Retry a failed extraction
 * @param {String} logId - Log entry ID to retry
 * @returns {Promise<Object>} New log entry
 */
exports.retryExtraction = async (logId) => {
  try {
    const oldLog = await ImageExtractionLog.findById(logId);
    if (!oldLog) {
      throw new Error("Extraction log not found");
    }

    // Create new log entry with incremented retry count
    const newLog = await ImageExtractionLog.create({
      formRefId: oldLog.formRefId,
      patientId: oldLog.patientId,
      dateOfService: oldLog.dateOfService,
      officeName: oldLog.officeName,
      imageId: oldLog.imageId,
      fileName: oldLog.fileName,
      imageUploadedAt: oldLog.imageUploadedAt,
      extractorType: oldLog.extractorType,
      extractionMode: "manual", // Retry is always manual
      triggeredBy: oldLog.triggeredBy,
      promptUsed: oldLog.promptUsed,
      isRegeneration: true, // Retry is a regeneration
      retryCount: oldLog.retryCount + 1,
      status: "pending",
      requestStartedAt: new Date(),
    });

    console.log(
      `🔄 Retry log created: ${newLog._id} (Retry #${newLog.retryCount})`,
    );
    return newLog;
  } catch (error) {
    console.error("Error retrying extraction:", error);
    throw error;
  }
};
