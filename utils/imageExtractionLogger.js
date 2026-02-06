const ImageExtractionLog = require("../models/ImageExtractionLog");
const { toCSTDateString, parseCSTDateString } = require("./timezone");

/**
 * Add extraction log entry for a specific section (office or lc3)
 * Creates document if doesn't exist, appends to existing if it does
 * @param {Object} data - Log data
 * @returns {Promise<Object>} Created/updated log entry with attemptId
 */
exports.addExtractionLog = async (data) => {
  try {
    const {
      formRefId,
      appointmentInfo, // { patientId, dateOfService, officeName }
      sectionType, // 'office' or 'lc3'
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode = "automatic",
      triggeredBy,
      isRegeneration = false,
    } = data;

    if (!sectionType || !["office", "lc3"].includes(sectionType)) {
      throw new Error("sectionType must be 'office' or 'lc3'");
    }

    // Create new extraction attempt object
    const newAttempt = {
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode,
      triggeredBy,
      isRegeneration,
      status: "pending",
      requestStartedAt: toCSTDateString(),
    };

    const sectionField =
      sectionType === "office" ? "officeSection" : "lc3Section";

    // Find existing log or create new one
    let log = await ImageExtractionLog.findOneAndUpdate(
      { formRefId },
      {
        $setOnInsert: {
          formRefId,
          appointmentInfo,
        },
        $push: {
          [`${sectionField}.extractions`]: newAttempt,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    // Get the ID of the newly added attempt (last item in array)
    const attempts = log[sectionField].extractions;
    const attemptId = attempts[attempts.length - 1]._id;

    console.log(
      `📝 Extraction log added: formRefId=${formRefId}, section=${sectionType}, attemptId=${attemptId}, mode=${extractionMode}`,
    );

    return {
      logId: log._id,
      attemptId: attemptId,
      sectionType,
    };
  } catch (error) {
    console.error("Error adding extraction log:", error);
    throw error;
  }
};

/**
 * Mark specific extraction attempt as processing
 * @param {String} formRefId - Form Reference ID
 * @param {String} sectionType - 'office' or 'lc3'
 * @param {String} attemptId - Attempt ID
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsProcessing = async (formRefId, sectionType, attemptId) => {
  try {
    const sectionField =
      sectionType === "office" ? "officeSection" : "lc3Section";

    const log = await ImageExtractionLog.findOneAndUpdate(
      {
        formRefId,
        [`${sectionField}.extractions._id`]: attemptId,
      },
      {
        $set: {
          [`${sectionField}.extractions.$.status`]: "processing",
        },
      },
      { new: true },
    );

    if (!log) {
      throw new Error("Extraction log or attempt not found");
    }

    console.log(
      `⏳ Extraction marked as processing: formRefId=${formRefId}, section=${sectionType}, attemptId=${attemptId}`,
    );
    return log;
  } catch (error) {
    console.error("Error marking as processing:", error);
    throw error;
  }
};

/**
 * Mark specific extraction attempt as completed
 * @param {String} formRefId - Form Reference ID
 * @param {String} sectionType - 'office' or 'lc3'
 * @param {String} attemptId - Attempt ID
 * @param {String} extractedData - Extracted data JSON string
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsCompleted = async (
  formRefId,
  sectionType,
  attemptId,
  extractedData,
) => {
  try {
    const sectionField =
      sectionType === "office" ? "officeSection" : "lc3Section";

    // First, get the attempt to calculate duration
    const log = await ImageExtractionLog.findOne({
      formRefId,
      [`${sectionField}.extractions._id`]: attemptId,
    });

    if (!log) {
      throw new Error("Extraction log or attempt not found");
    }

    const attempt = log[sectionField].extractions.id(attemptId);
    const completedAt = toCSTDateString();
    const duration =
      parseCSTDateString(completedAt) -
      parseCSTDateString(attempt.requestStartedAt);

    // Update the attempt
    const updatedLog = await ImageExtractionLog.findOneAndUpdate(
      {
        formRefId,
        [`${sectionField}.extractions._id`]: attemptId,
      },
      {
        $set: {
          [`${sectionField}.extractions.$.status`]: "success",
          [`${sectionField}.extractions.$.extractedData`]: extractedData,
          [`${sectionField}.extractions.$.requestCompletedAt`]: completedAt,
          [`${sectionField}.extractions.$.processDuration`]: duration,
        },
      },
      { new: true },
    );

    console.log(
      `✅ Extraction completed: formRefId=${formRefId}, section=${sectionType}, attemptId=${attemptId} (Duration: ${duration}ms)`,
    );
    return updatedLog;
  } catch (error) {
    console.error("Error marking as completed:", error);
    throw error;
  }
};

/**
 * Mark specific extraction attempt as failed
 * @param {String} formRefId - Form Reference ID
 * @param {String} sectionType - 'office' or 'lc3'
 * @param {String} attemptId - Attempt ID
 * @param {Error} error - Error object
 * @returns {Promise<Object>} Updated log entry
 */
exports.markAsFailed = async (formRefId, sectionType, attemptId, error) => {
  try {
    const sectionField =
      sectionType === "office" ? "officeSection" : "lc3Section";

    // First, get the attempt to calculate duration
    const log = await ImageExtractionLog.findOne({
      formRefId,
      [`${sectionField}.extractions._id`]: attemptId,
    });

    if (!log) {
      throw new Error("Extraction log or attempt not found");
    }

    const attempt = log[sectionField].extractions.id(attemptId);
    const completedAt = toCSTDateString();
    const duration =
      parseCSTDateString(completedAt) -
      parseCSTDateString(attempt.requestStartedAt);

    // Update the attempt
    const updatedLog = await ImageExtractionLog.findOneAndUpdate(
      {
        formRefId,
        [`${sectionField}.extractions._id`]: attemptId,
      },
      {
        $set: {
          [`${sectionField}.extractions.$.status`]: "failed",
          [`${sectionField}.extractions.$.errorMessage`]: error.message,
          [`${sectionField}.extractions.$.errorStack`]: error.stack,
          [`${sectionField}.extractions.$.requestCompletedAt`]: completedAt,
          [`${sectionField}.extractions.$.processDuration`]: duration,
        },
      },
      { new: true },
    );

    console.log(
      `❌ Extraction failed: formRefId=${formRefId}, section=${sectionType}, attemptId=${attemptId}`,
    );
    return updatedLog;
  } catch (err) {
    console.error("Error marking as failed:", err);
    throw err;
  }
};

/**
 * Get extraction logs by formRefId
 * @param {String} formRefId - Form Reference ID
 * @returns {Promise<Object>} Extraction log with all attempts
 */
exports.getLogsByFormRefId = async (formRefId) => {
  try {
    const log = await ImageExtractionLog.findOne({ formRefId }).populate(
      "officeSection.extractions.triggeredBy lc3Section.extractions.triggeredBy",
      "name email",
    );

    return log;
  } catch (error) {
    console.error("Error fetching logs by formRefId:", error);
    throw error;
  }
};

/**
 * Get extraction statistics for a section
 * @param {String} sectionType - 'office' or 'lc3'
 * @returns {Promise<Object>} Statistics
 */
exports.getExtractionStats = async (sectionType = null) => {
  try {
    const sectionField =
      sectionType === "office"
        ? "officeSection"
        : sectionType === "lc3"
          ? "lc3Section"
          : null;

    if (!sectionField) {
      // Get stats for both sections
      const logs = await ImageExtractionLog.find({});

      let totalOffice = 0,
        successOffice = 0,
        failedOffice = 0;
      let totalLc3 = 0,
        successLc3 = 0,
        failedLc3 = 0;

      logs.forEach((log) => {
        if (log.officeSection && log.officeSection.extractions) {
          log.officeSection.extractions.forEach((attempt) => {
            totalOffice++;
            if (attempt.status === "success") successOffice++;
            if (attempt.status === "failed") failedOffice++;
          });
        }
        if (log.lc3Section && log.lc3Section.extractions) {
          log.lc3Section.extractions.forEach((attempt) => {
            totalLc3++;
            if (attempt.status === "success") successLc3++;
            if (attempt.status === "failed") failedLc3++;
          });
        }
      });

      return {
        office: {
          total: totalOffice,
          success: successOffice,
          failed: failedOffice,
        },
        lc3: { total: totalLc3, success: successLc3, failed: failedLc3 },
      };
    }

    // Get stats for specific section
    const logs = await ImageExtractionLog.find({});
    let total = 0,
      success = 0,
      failed = 0;

    logs.forEach((log) => {
      if (log[sectionField] && log[sectionField].extractions) {
        log[sectionField].extractions.forEach((attempt) => {
          total++;
          if (attempt.status === "success") success++;
          if (attempt.status === "failed") failed++;
        });
      }
    });

    return { total, success, failed };
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
      requestStartedAt: toCSTDateString(),
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
