const { syncAllAppointments } = require("../services/appointmentService");
const SyncLog = require("../models/SyncLog");
const PatientAppointment = require("../models/PatientAppointment");
const Walkout = require("../models/Walkout");
const DropdownSet = require("../models/DropdownSet");

/**
 * @desc    Manually trigger appointment sync
 * @route   POST /api/appointments/sync
 * @access  Admin, SuperAdmin
 */
exports.manualSync = async (req, res) => {
  try {
    console.log(
      `Manual sync triggered by user: ${req.user.name} (${req.user.role})`,
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
 * @desc    Get appointments with filters (office name, date range)
 * @route   GET /api/appointments/list
 * @access  All authenticated users
 */
exports.getAppointmentsList = async (req, res) => {
  try {
    const {
      officeName,
      startDate,
      endDate,
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

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const appointments = await PatientAppointment.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select(
        "patient-id patient-name dos chair-name insurance-name insurance-type office-name updated-on mode isWalkoutSubmittedToLC3",
      );

    const total = await PatientAppointment.countDocuments(query);

    // ====================================
    // FETCH WALKOUT DATA FOR EACH APPOINTMENT
    // ====================================

    // Get all appointment IDs
    const appointmentIds = appointments.map((apt) => apt._id.toString());

    // Fetch all walkouts matching these appointment IDs (formRefId)
    const walkouts = await Walkout.find({
      formRefId: { $in: appointmentIds },
      isActive: true,
    }).select(
      "formRefId walkoutStatus lc3Section pendingWith isOnHoldAddressed",
    );

    // Fetch on-hold reasons dropdown for name mapping
    const onHoldReasonsDropdown = await DropdownSet.findById(
      "695c1c81feea0c62ede5f2b6",
    );
    const onHoldReasonsMap = {};
    if (onHoldReasonsDropdown && onHoldReasonsDropdown.options) {
      onHoldReasonsDropdown.options.forEach((option) => {
        onHoldReasonsMap[option.incrementalId] = option.name;
      });
    }

    // Create a map for quick lookup: appointmentId -> walkout data
    const walkoutMap = {};
    walkouts.forEach((walkout) => {
      walkoutMap[walkout.formRefId] = walkout;
    });

    // Enrich appointments with walkout data
    const enrichedAppointments = appointments.map((appointment) => {
      const appointmentObj = appointment.toObject();
      const appointmentId = appointment._id.toString();
      const walkout = walkoutMap[appointmentId];

      // Default walkout data
      let walkoutData = {
        walkoutStatus: "Walkout not Submitted to LC3",
        pendingWith: "Office",
        isOnHoldAddressed: undefined,
        pendingChecks: {
          ruleEngine: undefined,
          documentCheck: undefined,
          attachmentsCheck: undefined,
          patientPortionCheck: undefined,
          productionDetails: undefined,
          providerNotes: undefined,
        },
        onHoldReasons: [],
      };

      // If walkout exists, populate actual data
      if (walkout) {
        walkoutData.walkoutStatus = walkout.walkoutStatus;
        walkoutData.pendingWith = walkout.pendingWith;
        walkoutData.isOnHoldAddressed = walkout.isOnHoldAddressed;

        // Extract pending checks from lc3Section
        if (walkout.lc3Section) {
          walkoutData.pendingChecks = {
            ruleEngine: walkout.lc3Section.ruleEngine?.fieldsetStatus,
            documentCheck:
              walkout.lc3Section.documentCheck?.lc3DocumentCheckStatus,
            attachmentsCheck:
              walkout.lc3Section.attachmentsCheck?.lc3AttachmentsCheckStatus,
            patientPortionCheck:
              walkout.lc3Section.patientPortionCheck?.lc3PatientPortionStatus,
            productionDetails:
              walkout.lc3Section.productionDetails?.lc3ProductionStatus,
            providerNotes:
              walkout.lc3Section.providerNotes?.lc3ProviderNotesStatus,
          };

          // Extract on-hold reasons and map to names
          if (
            walkout.lc3Section.productionDetails?.onHoldReasons &&
            Array.isArray(walkout.lc3Section.productionDetails.onHoldReasons)
          ) {
            walkoutData.onHoldReasons =
              walkout.lc3Section.productionDetails.onHoldReasons
                .map((reasonId) => onHoldReasonsMap[reasonId])
                .filter((name) => name !== undefined); // Filter out undefined mappings
          }
        }
      }

      // Add walkout data to appointment
      return {
        ...appointmentObj,
        mode: appointmentObj.mode || "ES-Query",
        isWalkoutSubmittedToLC3: appointmentObj.isWalkoutSubmittedToLC3 || "No",
        walkout: walkoutData,
      };
    });

    // ====================================
    // CUSTOM SORTING: DOS (date) -> Patient ID (number)
    // ====================================
    enrichedAppointments.sort((a, b) => {
      // First: Sort by DOS (date of service) - convert to Date for comparison
      const dosA = new Date(a.dos);
      const dosB = new Date(b.dos);

      if (dosA.getTime() !== dosB.getTime()) {
        return dosB - dosA; // Descending order by date (most recent first)
      }

      // Second: If DOS is same, sort by patient-id as number
      const patientIdA = parseInt(a["patient-id"]) || 0;
      const patientIdB = parseInt(b["patient-id"]) || 0;

      return patientIdA - patientIdB; // Ascending order by patient ID number
    });

    res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      total,
      filters: {
        officeName: officeName,
        startDate: startDate || null,
        endDate: endDate || null,
      },
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + enrichedAppointments.length < total,
      },
      data: enrichedAppointments,
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

/**
 * @desc    Get all appointments for a patient in a specific office (no date filter)
 * @route   GET /api/appointments/by-patient
 * @access  All authenticated users
 */
exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const {
      officeName,
      patientId,
      limit = 100,
      skip = 0,
      sortBy = "dos",
      sortOrder = "desc",
    } = req.query;

    console.log("=== By Patient API Called ===");
    console.log("Query params received:", {
      officeName,
      patientId,
      limit,
      skip,
    });

    // Both office name and patient ID are mandatory
    if (!officeName || !patientId) {
      return res.status(400).json({
        success: false,
        message: "Both office name and patient ID are required",
      });
    }

    // Check if this patient exists in ANY office first
    const anyPatient = await PatientAppointment.findOne({
      "patient-id": patientId.trim(),
    }).select("patient-id patient-name office-name dos");

    console.log(
      "Patient found anywhere in DB (exact match):",
      anyPatient
        ? {
            patientId: anyPatient["patient-id"],
            patientName: anyPatient["patient-name"],
            office: anyPatient["office-name"],
            dos: anyPatient.dos,
          }
        : "NOT FOUND",
    );

    // Now check specifically for this office
    const patientInOffice = await PatientAppointment.findOne({
      "office-name": officeName,
      "patient-id": patientId.trim(),
    }).select("patient-id patient-name office-name dos");

    console.log(
      "Patient in specified office (exact match):",
      patientInOffice
        ? {
            patientId: patientInOffice["patient-id"],
            patientName: patientInOffice["patient-name"],
            office: patientInOffice["office-name"],
            dos: patientInOffice.dos,
          }
        : "NOT FOUND",
    );

    // Build query - exact match for office name and patient ID
    const query = {
      "office-name": officeName,
      "patient-id": patientId.trim(),
    };

    console.log("Final query for all appointments:", JSON.stringify(query));

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const appointments = await PatientAppointment.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select(
        "patient-id patient-name dos chair-name insurance-name insurance-type office-name updated-on mode isWalkoutSubmittedToLC3",
      );

    const total = await PatientAppointment.countDocuments(query);

    console.log(
      `Final result: Found ${appointments.length} appointments (total: ${total})`,
    );
    if (appointments.length > 0) {
      console.log("First appointment:", {
        patientId: appointments[0]["patient-id"],
        patientName: appointments[0]["patient-name"],
        dos: appointments[0].dos,
        office: appointments[0]["office-name"],
      });
    }

    // ====================================
    // FETCH WALKOUT DATA FOR EACH APPOINTMENT
    // ====================================

    // Get all appointment IDs
    const appointmentIds = appointments.map((apt) => apt._id.toString());

    // Fetch all walkouts matching these appointment IDs (formRefId)
    const walkouts = await Walkout.find({
      formRefId: { $in: appointmentIds },
      isActive: true,
    }).select(
      "formRefId walkoutStatus lc3Section pendingWith isOnHoldAddressed",
    );

    // Fetch on-hold reasons dropdown for name mapping
    const onHoldReasonsDropdown = await DropdownSet.findById(
      "695c1c81feea0c62ede5f2b6",
    );
    const onHoldReasonsMap = {};
    if (onHoldReasonsDropdown && onHoldReasonsDropdown.options) {
      onHoldReasonsDropdown.options.forEach((option) => {
        onHoldReasonsMap[option.incrementalId] = option.name;
      });
    }

    // Create a map for quick lookup: appointmentId -> walkout data
    const walkoutMap = {};
    walkouts.forEach((walkout) => {
      walkoutMap[walkout.formRefId] = walkout;
    });

    // Enrich appointments with walkout data
    const enrichedAppointments = appointments.map((appointment) => {
      const appointmentObj = appointment.toObject();
      const appointmentId = appointment._id.toString();
      const walkout = walkoutMap[appointmentId];

      // Default walkout data
      let walkoutData = {
        walkoutStatus: "Walkout not Submitted to LC3",
        pendingWith: "Office",
        isOnHoldAddressed: undefined,
        pendingChecks: {
          ruleEngine: undefined,
          documentCheck: undefined,
          attachmentsCheck: undefined,
          patientPortionCheck: undefined,
          productionDetails: undefined,
          providerNotes: undefined,
        },
        onHoldReasons: [],
      };

      // If walkout exists, populate actual data
      if (walkout) {
        walkoutData.walkoutStatus = walkout.walkoutStatus;
        walkoutData.pendingWith = walkout.pendingWith;
        walkoutData.isOnHoldAddressed = walkout.isOnHoldAddressed;

        // Extract pending checks from lc3Section
        if (walkout.lc3Section) {
          walkoutData.pendingChecks = {
            ruleEngine: walkout.lc3Section.ruleEngine?.fieldsetStatus,
            documentCheck:
              walkout.lc3Section.documentCheck?.lc3DocumentCheckStatus,
            attachmentsCheck:
              walkout.lc3Section.attachmentsCheck?.lc3AttachmentsCheckStatus,
            patientPortionCheck:
              walkout.lc3Section.patientPortionCheck?.lc3PatientPortionStatus,
            productionDetails:
              walkout.lc3Section.productionDetails?.lc3ProductionStatus,
            providerNotes:
              walkout.lc3Section.providerNotes?.lc3ProviderNotesStatus,
          };

          // Extract on-hold reasons and map to names
          if (
            walkout.lc3Section.productionDetails?.onHoldReasons &&
            Array.isArray(walkout.lc3Section.productionDetails.onHoldReasons)
          ) {
            walkoutData.onHoldReasons =
              walkout.lc3Section.productionDetails.onHoldReasons
                .map((reasonId) => onHoldReasonsMap[reasonId])
                .filter((name) => name !== undefined); // Filter out undefined mappings
          }
        }
      }

      // Add walkout data to appointment
      return {
        ...appointmentObj,
        mode: appointmentObj.mode || "ES-Query",
        isWalkoutSubmittedToLC3: appointmentObj.isWalkoutSubmittedToLC3 || "No",
        walkout: walkoutData,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedAppointments.length,
      total,
      filters: {
        officeName,
        patientId,
      },
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + enrichedAppointments.length < total,
      },
      data: enrichedAppointments,
    });
  } catch (error) {
    console.error("Error fetching appointments by patient:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments by patient",
      error: error.message,
    });
  }
};

/**
 * @desc    Create Walk-in/Unscheduled Patient Appointment
 * @route   POST /api/appointments/walk-in
 * @access  Admin, SuperAdmin, User
 */
exports.createWalkInAppointment = async (req, res) => {
  try {
    const {
      "patient-id": patientId,
      "patient-name": patientName,
      dos,
      "chair-name": chairName,
      "insurance-name": insuranceName,
      "insurance-type": insuranceType,
      "office-name": officeName,
    } = req.body;

    // Validate required fields
    if (!patientId || !patientName || !dos || !officeName) {
      return res.status(400).json({
        success: false,
        message: "patient-id, patient-name, dos, and office-name are required",
      });
    }

    // Check if appointment already exists with same DOS and patient-id
    const existingAppointment = await PatientAppointment.findOne({
      dos: dos,
      "patient-id": patientId,
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: `Appointment exists: Patient ID ${existingAppointment["patient-id"]} at ${existingAppointment["office-name"]} on ${new Date(existingAppointment.dos).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        data: existingAppointment,
      });
    }

    // Create new appointment
    const appointment = await PatientAppointment.create({
      "patient-id": patientId,
      "patient-name": patientName,
      dos: dos,
      "chair-name": chairName || "",
      "insurance-name": insuranceName || "",
      "insurance-type": insuranceType || "",
      "office-name": officeName,
      "updated-on": new Date(),
      mode: "manual",
      isWalkIn: true,
      createdOn: new Date(),
      createdBy: req.user._id,
      isWalkoutSubmittedToLC3: "No",
    });

    res.status(201).json({
      success: true,
      message: "Walk-in appointment created successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error creating walk-in appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating walk-in appointment",
      error: error.message,
    });
  }
};

/**
 * @desc    Update Walk-in/Unscheduled Patient Appointment
 * @route   PUT /api/appointments/walk-in/:id
 * @access  SuperAdmin only
 */
exports.updateWalkInAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      "patient-id": patientId,
      "patient-name": patientName,
      dos,
      "chair-name": chairName,
      "insurance-name": insuranceName,
      "insurance-type": insuranceType,
      "office-name": officeName,
    } = req.body;

    // Find the appointment
    const appointment = await PatientAppointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if it's a manual appointment
    if (appointment.mode !== "manual") {
      return res.status(400).json({
        success: false,
        message: "Only manually created appointments can be updated",
      });
    }

    // If DOS or patient-id is being updated, check for duplicates
    if (
      (dos && dos !== appointment.dos) ||
      (patientId && patientId !== appointment["patient-id"])
    ) {
      const newDos = dos || appointment.dos;
      const newPatientId = patientId || appointment["patient-id"];

      const existingAppointment = await PatientAppointment.findOne({
        dos: newDos,
        "patient-id": newPatientId,
        _id: { $ne: id },
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message:
            "Another appointment already exists for this patient on this date",
        });
      }
    }

    // Update fields
    if (patientId) appointment["patient-id"] = patientId;
    if (patientName) appointment["patient-name"] = patientName;
    if (dos) appointment.dos = dos;
    if (chairName) appointment["chair-name"] = chairName;
    if (insuranceName) appointment["insurance-name"] = insuranceName;
    if (insuranceType) appointment["insurance-type"] = insuranceType;
    if (officeName) appointment["office-name"] = officeName;
    appointment["updated-on"] = new Date();
    appointment.updatedBy = req.user._id.toString();

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Walk-in appointment updated successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Error updating walk-in appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error updating walk-in appointment",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete Walk-in/Unscheduled Patient Appointment
 * @route   DELETE /api/appointments/walk-in/:id
 * @access  SuperAdmin only
 */
exports.deleteWalkInAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the appointment
    const appointment = await PatientAppointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if it's a manual appointment
    if (appointment.mode !== "manual") {
      return res.status(400).json({
        success: false,
        message: "Only manually created appointments can be deleted",
      });
    }

    await PatientAppointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Walk-in appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting walk-in appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting walk-in appointment",
      error: error.message,
    });
  }
};
