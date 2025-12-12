const { syncProviderSchedule } = require("../services/providerScheduleService");
const ProviderSchedule = require("../models/ProviderSchedule");

/**
 * @desc    Manually trigger provider schedule sync
 * @route   POST /api/provider-schedule/sync
 * @access  Admin, SuperAdmin
 */
exports.manualSync = async (req, res) => {
  try {
    console.log(
      `Manual provider schedule sync triggered by user: ${req.user.name} (${req.user.role})`
    );

    const result = await syncProviderSchedule();

    res.status(200).json({
      success: true,
      message: "Provider schedule sync completed",
      data: result,
    });
  } catch (error) {
    console.error("Error in manual provider schedule sync:", error);
    res.status(500).json({
      success: false,
      message: "Error syncing provider schedule",
      error: error.message,
    });
  }
};

/**
 * @desc    Get provider schedule with filters
 * @route   GET /api/provider-schedule/list
 * @access  All authenticated users
 */
exports.getProviderScheduleList = async (req, res) => {
  try {
    const {
      officeName,
      startDate,
      endDate,
      providerCode,
      providerType,
      limit = 100,
      skip = 0,
      sortBy = "dos",
      sortOrder = "desc",
    } = req.query;

    // Build query
    let query = {};

    if (officeName) {
      query["office-name"] = officeName;
    }

    if (startDate || endDate) {
      query.dos = {};
      if (startDate) query.dos.$gte = startDate;
      if (endDate) query.dos.$lte = endDate;
    }

    if (providerCode) {
      query["provider-code"] = { $regex: providerCode, $options: "i" };
    }

    if (providerType) {
      query["provider-type"] = { $regex: providerType, $options: "i" };
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const schedules = await ProviderSchedule.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select(
        "dos office-name provider-code provider-hygienist provider-code-with-type provider-full-name provider-type updated-on"
      );

    const total = await ProviderSchedule.countDocuments(query);

    res.status(200).json({
      success: true,
      count: schedules.length,
      total,
      filters: {
        officeName: officeName || null,
        startDate: startDate || null,
        endDate: endDate || null,
        providerCode: providerCode || null,
        providerType: providerType || null,
      },
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + schedules.length < total,
      },
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching provider schedule list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching provider schedule list",
      error: error.message,
    });
  }
};

/**
 * @desc    Get provider schedule stats
 * @route   GET /api/provider-schedule/stats
 * @access  Admin, SuperAdmin
 */
exports.getProviderScheduleStats = async (req, res) => {
  try {
    const totalRecords = await ProviderSchedule.countDocuments();

    const schedulesByOffice = await ProviderSchedule.aggregate([
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

    const schedulesByProviderType = await ProviderSchedule.aggregate([
      {
        $group: {
          _id: "$provider-type",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRecords,
        schedulesByOffice,
        schedulesByProviderType,
      },
    });
  } catch (error) {
    console.error("Error fetching provider schedule stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching provider schedule statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get provider schedule by office name and DOS
 * @route   POST /api/provider-schedule/get-by-office-dos
 * @access  All authenticated users
 */
exports.getByOfficeAndDOS = async (req, res) => {
  try {
    const { officeName, dos } = req.body;

    // Validate required fields
    if (!officeName || !dos) {
      return res.status(400).json({
        success: false,
        message: "Office name and DOS (date of service) are required",
      });
    }

    // Find all provider schedules for this office and DOS
    const schedules = await ProviderSchedule.find({
      "office-name": officeName,
      dos: dos,
    }).select(
      "dos office-name provider-code provider-hygienist provider-code-with-type provider-full-name provider-type updated-on"
    );

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No provider schedule found for this office and date",
      });
    }

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error("Error fetching provider schedule by office and DOS:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching provider schedule",
      error: error.message,
    });
  }
};
