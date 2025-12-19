const DropdownOption = require("../models/DropdownOption");

/**
 * @desc    Create a new dropdown option
 * @route   POST /api/dropdowns
 * @access  Admin, SuperAdmin
 */
exports.createDropdownOption = async (req, res) => {
  try {
    const { name, visibility, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Option name is required",
      });
    }

    const dropdownOption = await DropdownOption.create({
      name,
      visibility: visibility !== undefined ? visibility : true,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const populatedOption = await DropdownOption.findById(
      dropdownOption._id
    ).populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Dropdown option created successfully",
      data: populatedOption,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown option with this name already exists",
      });
    }
    console.error("Error creating dropdown option:", error);
    res.status(500).json({
      success: false,
      message: "Error creating dropdown option",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all dropdown options
 * @route   GET /api/dropdowns
 * @access  All authenticated users
 */
exports.getAllDropdownOptions = async (req, res) => {
  try {
    const { isActive, visibility, limit = 100, skip = 0 } = req.query;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (visibility !== undefined) {
      query.visibility = visibility === "true";
    }

    const dropdownOptions = await DropdownOption.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await DropdownOption.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dropdownOptions.length,
      total,
      data: dropdownOptions,
    });
  } catch (error) {
    console.error("Error fetching dropdown options:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dropdown options",
      error: error.message,
    });
  }
};

/**
 * @desc    Get dropdown option by ID
 * @route   GET /api/dropdowns/:id
 * @access  All authenticated users
 */
exports.getDropdownOptionById = async (req, res) => {
  try {
    const dropdownOption = await DropdownOption.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!dropdownOption) {
      return res.status(404).json({
        success: false,
        message: "Dropdown option not found",
      });
    }

    res.status(200).json({
      success: true,
      data: dropdownOption,
    });
  } catch (error) {
    console.error("Error fetching dropdown option:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dropdown option",
      error: error.message,
    });
  }
};

/**
 * @desc    Update dropdown option
 * @route   PUT /api/dropdowns/:id
 * @access  Admin, SuperAdmin
 */
exports.updateDropdownOption = async (req, res) => {
  try {
    const { name, visibility, isActive } = req.body;

    const dropdownOption = await DropdownOption.findById(req.params.id);

    if (!dropdownOption) {
      return res.status(404).json({
        success: false,
        message: "Dropdown option not found",
      });
    }

    if (name) dropdownOption.name = name;
    if (visibility !== undefined) dropdownOption.visibility = visibility;
    if (isActive !== undefined) dropdownOption.isActive = isActive;
    dropdownOption.updatedBy = req.user._id;

    await dropdownOption.save();

    const updatedOption = await DropdownOption.findById(dropdownOption._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Dropdown option updated successfully",
      data: updatedOption,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown option with this name already exists",
      });
    }
    console.error("Error updating dropdown option:", error);
    res.status(500).json({
      success: false,
      message: "Error updating dropdown option",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete dropdown option
 * @route   DELETE /api/dropdowns/:id
 * @access  Admin, SuperAdmin
 */
exports.deleteDropdownOption = async (req, res) => {
  try {
    const dropdownOption = await DropdownOption.findById(req.params.id);

    if (!dropdownOption) {
      return res.status(404).json({
        success: false,
        message: "Dropdown option not found",
      });
    }

    // Remove this option from all dropdown sets that reference it
    const DropdownSet = require("../models/DropdownSet");
    await DropdownSet.updateMany(
      { options: req.params.id },
      { $pull: { options: req.params.id } }
    );

    await DropdownOption.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Dropdown option deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting dropdown option:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting dropdown option",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk create dropdown options
 * @route   POST /api/dropdowns/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkCreateDropdownOptions = async (req, res) => {
  try {
    const { options } = req.body;

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Options array is required",
      });
    }

    const createdOptions = [];
    const errors = [];

    for (const optionData of options) {
      try {
        if (!optionData.name) {
          errors.push({
            data: optionData,
            error: "Option name is required",
          });
          continue;
        }

        const dropdownOption = await DropdownOption.create({
          name: optionData.name,
          visibility:
            optionData.visibility !== undefined ? optionData.visibility : true,
          isActive:
            optionData.isActive !== undefined ? optionData.isActive : true,
          createdBy: req.user._id,
        });
        createdOptions.push(dropdownOption);
      } catch (error) {
        errors.push({
          name: optionData.name,
          error: error.code === 11000 ? "Duplicate name" : error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdOptions.length} dropdown options`,
      created: createdOptions.length,
      failed: errors.length,
      data: createdOptions,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk creating dropdown options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk creating dropdown options",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk update dropdown options
 * @route   PUT /api/dropdowns/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkUpdateDropdownOptions = async (req, res) => {
  try {
    const { options } = req.body;

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Options array with IDs is required",
      });
    }

    const updated = [];
    const errors = [];

    for (const optionData of options) {
      try {
        if (!optionData.id) {
          errors.push({
            data: optionData,
            error: "Option ID is required",
          });
          continue;
        }

        const dropdownOption = await DropdownOption.findById(optionData.id);
        if (!dropdownOption) {
          errors.push({
            id: optionData.id,
            error: "Dropdown option not found",
          });
          continue;
        }

        if (optionData.name) dropdownOption.name = optionData.name;
        if (optionData.visibility !== undefined)
          dropdownOption.visibility = optionData.visibility;
        if (optionData.isActive !== undefined)
          dropdownOption.isActive = optionData.isActive;
        dropdownOption.updatedBy = req.user._id;

        await dropdownOption.save();
        updated.push(dropdownOption);
      } catch (error) {
        errors.push({
          id: optionData.id,
          error: error.code === 11000 ? "Duplicate name" : error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updated.length} dropdown options`,
      updated: updated.length,
      failed: errors.length,
      data: updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk updating dropdown options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating dropdown options",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk delete dropdown options
 * @route   DELETE /api/dropdowns/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkDeleteDropdownOptions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of option IDs is required",
      });
    }

    // Remove these options from all dropdown sets
    const DropdownSet = require("../models/DropdownSet");
    await DropdownSet.updateMany(
      { options: { $in: ids } },
      { $pull: { options: { $in: ids } } }
    );

    const result = await DropdownOption.deleteMany({
      _id: { $in: ids },
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} dropdown options`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting dropdown options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk deleting dropdown options",
      error: error.message,
    });
  }
};
