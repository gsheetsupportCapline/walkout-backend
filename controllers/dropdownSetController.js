const DropdownSet = require("../models/DropdownSet");
const DropdownOption = require("../models/DropdownOption");

/**
 * @desc    Create a new dropdown set
 * @route   POST /api/dropdowns/dropdown-sets
 * @access  Admin, SuperAdmin
 */
exports.createDropdownSet = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set name is required",
      });
    }

    const dropdownSet = await DropdownSet.create({
      name,
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Dropdown set created successfully",
      data: dropdownSet,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set with this name already exists",
      });
    }
    console.error("Error creating dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error creating dropdown set",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all dropdown sets
 * @route   GET /api/dropdowns/dropdown-sets
 * @access  All authenticated users
 */
exports.getAllDropdownSets = async (req, res) => {
  try {
    const { isActive, limit = 100, skip = 0 } = req.query;

    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const dropdownSets = await DropdownSet.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await DropdownSet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dropdownSets.length,
      total,
      data: dropdownSets,
    });
  } catch (error) {
    console.error("Error fetching dropdown sets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dropdown sets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get dropdown set by ID
 * @route   GET /api/dropdowns/dropdown-sets/:id
 * @access  All authenticated users
 */
exports.getDropdownSetById = async (req, res) => {
  try {
    const dropdownSet = await DropdownSet.findById(req.params.id)
      .populate("options", "name visibility isActive")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dropdownSet,
    });
  } catch (error) {
    console.error("Error fetching dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dropdown set",
      error: error.message,
    });
  }
};

/**
 * @desc    Update dropdown set
 * @route   PUT /api/dropdowns/dropdown-sets/:id
 * @access  Admin, SuperAdmin
 */
exports.updateDropdownSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const dropdownSet = await DropdownSet.findById(req.params.id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    if (name) dropdownSet.name = name;
    if (description !== undefined) dropdownSet.description = description;
    if (isActive !== undefined) dropdownSet.isActive = isActive;
    dropdownSet.updatedBy = req.user._id;

    await dropdownSet.save();

    res.status(200).json({
      success: true,
      message: "Dropdown set updated successfully",
      data: dropdownSet,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set with this name already exists",
      });
    }
    console.error("Error updating dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error updating dropdown set",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete dropdown set
 * @route   DELETE /api/dropdowns/dropdown-sets/:id
 * @access  Admin, SuperAdmin
 */
exports.deleteDropdownSet = async (req, res) => {
  try {
    const dropdownSet = await DropdownSet.findById(req.params.id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    await DropdownSet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Dropdown set deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting dropdown set",
      error: error.message,
    });
  }
};

/**
 * @desc    Add options to dropdown set
 * @route   POST /api/dropdowns/dropdown-sets/:id/options
 * @access  Admin, SuperAdmin
 */
exports.addOptionsToSet = async (req, res) => {
  try {
    const { optionIds } = req.body;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Option IDs array is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(req.params.id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Verify all options exist
    const options = await DropdownOption.find({ _id: { $in: optionIds } });
    if (options.length !== optionIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more option IDs are invalid",
      });
    }

    // Add options (avoid duplicates)
    optionIds.forEach((optionId) => {
      if (!dropdownSet.options.includes(optionId)) {
        dropdownSet.options.push(optionId);
      }
    });

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedDropdownSet = await DropdownSet.findById(dropdownSet._id)
      .populate("options", "name visibility isActive")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Options added to dropdown set successfully",
      data: updatedDropdownSet,
    });
  } catch (error) {
    console.error("Error adding options to dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error adding options to dropdown set",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove options from dropdown set
 * @route   DELETE /api/dropdowns/dropdown-sets/:id/options
 * @access  Admin, SuperAdmin
 */
exports.removeOptionsFromSet = async (req, res) => {
  try {
    const { optionIds } = req.body;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Option IDs array is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(req.params.id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Remove options
    dropdownSet.options = dropdownSet.options.filter(
      (optionId) => !optionIds.includes(optionId.toString())
    );

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedDropdownSet = await DropdownSet.findById(dropdownSet._id)
      .populate("options", "name visibility isActive")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Options removed from dropdown set successfully",
      data: updatedDropdownSet,
    });
  } catch (error) {
    console.error("Error removing options from dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error removing options from dropdown set",
      error: error.message,
    });
  }
};
