const { syncAllAppointments } = require("../services/appointmentService");
const SyncLog = require("../models/SyncLog");
const PatientAppointment = require("../models/PatientAppointment");

/**
 * @desc    Manually trigger appointment sync
 * @route   POST /api/appointments/sync
 * @access  Admin, SuperAdmin
 */
exports.manualSync = async (req, res) => {
  try {
    console.log(
      `Manual sync triggered by user: ${req.user.name} (${req.user.role})`
    );

    const result = await syncAllAppointments({
      manualTrigger: true,
      triggeredBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Appointment sync completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in manual sync:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing appointments",
      error: error.message,
    });
  }
};

/**
 * @desc    Get sync history
 * @route   GET /api/appointments/sync-history
 * @access  Admin, SuperAdmin
 */
exports.getSyncHistory = async (req, res) => {
  try {
    const { limit = 30, date } = req.query;

    let query = {};
    if (date) {
      query.date = date;
    }

    const syncLogs = await SyncLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate("executions.triggeredBy", "name email role");

    res.status(200).json({
      success: true,
      count: syncLogs.length,
      data: syncLogs,
    });
  } catch (error) {
    console.error("Error fetching sync history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sync history",
      error: error.message,
    });
  }
};

/**
 * @desc    Get current appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Admin, SuperAdmin
 */
exports.getAppointmentStats = async (req, res) => {
  try {
    const totalAppointments = await PatientAppointment.countDocuments();

    const appointmentsByOffice = await PatientAppointment.aggregate([
      {
        $group: {
          _id: "$office-name",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const recentSync = await SyncLog.findOne().sort({ lastSyncAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalAppointments,
        appointmentsByOffice,
        lastSync: recentSync ? recentSync.lastSyncAt : null,
        lastSyncDetails: recentSync
          ? {
              date: recentSync.date,
              totalExecutions: recentSync.totalExecutions,
              lastExecution:
                recentSync.executions[recentSync.executions.length - 1],
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching appointment stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointment statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get appointments for a specific office
 * @route   GET /api/appointments/office/:officeName
 * @access  All authenticated users
 */
exports.getOfficeAppointments = async (req, res) => {
  try {
    const { officeName } = req.params;
    const { limit = 100, skip = 0 } = req.query;

    const appointments = await PatientAppointment.find({
      "office-name": officeName,
    })
      .sort({ "updated-on": -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await PatientAppointment.countDocuments({
      "office-name": officeName,
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching office appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching office appointments",
      error: error.message,
    });
  }
};

/**
 * @desc    Get appointments with filters (office name, date range, patient ID)
 * @route   GET /api/appointments/list
 * @access  All authenticated users
 */
exports.getAppointmentsList = async (req, res) => {
  try {
    const {
      officeName,
      startDate,
      endDate,
      patientId,
      limit = 100,
      skip = 0,
      sortBy = "dos",
      sortOrder = "desc",
    } = req.query;

    // Office name is mandatory
    if (!officeName) {
      return res.status(400).json({
        success: false,
        message: "Office name is required",
      });
    }

    // Build query
    let query = {
      "office-name": officeName,
    };

    if (startDate || endDate) {
      query.dos = {};
      if (startDate) query.dos.$gte = startDate;
      if (endDate) query.dos.$lte = endDate;
    }

    if (patientId) {
      query["patient-id"] = { $regex: patientId, $options: "i" };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const appointments = await PatientAppointment.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select(
        "patient-id patient-name dos chair-name insurance-name insurance-type office-name updated-on"
      );

    const total = await PatientAppointment.countDocuments(query);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      filters: {
        officeName: officeName,
        startDate: startDate || null,
        endDate: endDate || null,
        patientId: patientId || null,
      },
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + appointments.length < total,
      },
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments list",
      error: error.message,
    });
  }
};
