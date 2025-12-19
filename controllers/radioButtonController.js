const RadioButton = require("../models/RadioButton");

/**
 * @desc    Create a new radio button
 * @route   POST /api/radio-buttons
 * @access  Admin, SuperAdmin
 */
exports.createRadioButton = async (req, res) => {
  try {
    const { name, visibility, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Button name is required",
      });
    }

    const radioButton = await RadioButton.create({
      name,
      visibility: visibility !== undefined ? visibility : true,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const populatedButton = await RadioButton.findById(
      radioButton._id
    ).populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Radio button created successfully",
      data: populatedButton,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Radio button with this name already exists",
      });
    }
    console.error("Error creating radio button:", error);
    res.status(500).json({
      success: false,
      message: "Error creating radio button",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all radio buttons
 * @route   GET /api/radio-buttons
 * @access  All authenticated users
 */
exports.getAllRadioButtons = async (req, res) => {
  try {
    const { isActive, visibility, limit = 100, skip = 0 } = req.query;

    let query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (visibility !== undefined) {
      query.visibility = visibility === "true";
    }

    const radioButtons = await RadioButton.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await RadioButton.countDocuments(query);

    res.status(200).json({
      success: true,
      count: radioButtons.length,
      total,
      data: radioButtons,
    });
  } catch (error) {
    console.error("Error fetching radio buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching radio buttons",
      error: error.message,
    });
  }
};

/**
 * @desc    Get radio button by ID
 * @route   GET /api/radio-buttons/:id
 * @access  All authenticated users
 */
exports.getRadioButtonById = async (req, res) => {
  try {
    const radioButton = await RadioButton.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!radioButton) {
      return res.status(404).json({
        success: false,
        message: "Radio button not found",
      });
    }

    res.status(200).json({
      success: true,
      data: radioButton,
    });
  } catch (error) {
    console.error("Error fetching radio button:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching radio button",
      error: error.message,
    });
  }
};

/**
 * @desc    Update radio button
 * @route   PUT /api/radio-buttons/:id
 * @access  Admin, SuperAdmin
 */
exports.updateRadioButton = async (req, res) => {
  try {
    const { name, visibility, isActive } = req.body;

    const radioButton = await RadioButton.findById(req.params.id);

    if (!radioButton) {
      return res.status(404).json({
        success: false,
        message: "Radio button not found",
      });
    }

    if (name) radioButton.name = name;
    if (visibility !== undefined) radioButton.visibility = visibility;
    if (isActive !== undefined) radioButton.isActive = isActive;
    radioButton.updatedBy = req.user._id;

    await radioButton.save();

    const updatedButton = await RadioButton.findById(radioButton._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Radio button updated successfully",
      data: updatedButton,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Radio button with this name already exists",
      });
    }
    console.error("Error updating radio button:", error);
    res.status(500).json({
      success: false,
      message: "Error updating radio button",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete radio button
 * @route   DELETE /api/radio-buttons/:id
 * @access  Admin, SuperAdmin
 */
exports.deleteRadioButton = async (req, res) => {
  try {
    const radioButton = await RadioButton.findById(req.params.id);

    if (!radioButton) {
      return res.status(404).json({
        success: false,
        message: "Radio button not found",
      });
    }

    // Remove this button from all button sets that reference it
    const ButtonSet = require("../models/ButtonSet");
    await ButtonSet.updateMany(
      { buttons: req.params.id },
      { $pull: { buttons: req.params.id } }
    );

    await RadioButton.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Radio button deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting radio button:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting radio button",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk create radio buttons
 * @route   POST /api/radio-buttons/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkCreateRadioButtons = async (req, res) => {
  try {
    const { buttons } = req.body;

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Buttons array is required",
      });
    }

    const createdButtons = [];
    const errors = [];

    for (const buttonData of buttons) {
      try {
        if (!buttonData.name) {
          errors.push({
            data: buttonData,
            error: "Button name is required",
          });
          continue;
        }

        const radioButton = await RadioButton.create({
          name: buttonData.name,
          visibility:
            buttonData.visibility !== undefined ? buttonData.visibility : true,
          isActive:
            buttonData.isActive !== undefined ? buttonData.isActive : true,
          createdBy: req.user._id,
        });
        createdButtons.push(radioButton);
      } catch (error) {
        errors.push({
          name: buttonData.name,
          error: error.code === 11000 ? "Duplicate name" : error.message,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdButtons.length} radio buttons`,
      created: createdButtons.length,
      failed: errors.length,
      data: createdButtons,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk creating radio buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk creating radio buttons",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk update radio buttons
 * @route   PUT /api/radio-buttons/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkUpdateRadioButtons = async (req, res) => {
  try {
    const { buttons } = req.body;

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Buttons array with IDs is required",
      });
    }

    const updated = [];
    const errors = [];

    for (const buttonData of buttons) {
      try {
        if (!buttonData.id) {
          errors.push({
            data: buttonData,
            error: "Button ID is required",
          });
          continue;
        }

        const radioButton = await RadioButton.findById(buttonData.id);
        if (!radioButton) {
          errors.push({
            id: buttonData.id,
            error: "Radio button not found",
          });
          continue;
        }

        if (buttonData.name) radioButton.name = buttonData.name;
        if (buttonData.visibility !== undefined)
          radioButton.visibility = buttonData.visibility;
        if (buttonData.isActive !== undefined)
          radioButton.isActive = buttonData.isActive;
        radioButton.updatedBy = req.user._id;

        await radioButton.save();
        updated.push(radioButton);
      } catch (error) {
        errors.push({
          id: buttonData.id,
          error: error.code === 11000 ? "Duplicate name" : error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updated.length} radio buttons`,
      updated: updated.length,
      failed: errors.length,
      data: updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error bulk updating radio buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating radio buttons",
      error: error.message,
    });
  }
};

/**
 * @desc    Bulk delete radio buttons
 * @route   DELETE /api/radio-buttons/bulk
 * @access  Admin, SuperAdmin
 */
exports.bulkDeleteRadioButtons = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of button IDs is required",
      });
    }

    // Remove these buttons from all button sets that reference them
    const ButtonSet = require("../models/ButtonSet");
    await ButtonSet.updateMany(
      { buttons: { $in: ids } },
      { $pull: { buttons: { $in: ids } } }
    );

    const result = await RadioButton.deleteMany({
      _id: { $in: ids },
    });

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} radio buttons`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Error bulk deleting radio buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk deleting radio buttons",
      error: error.message,
    });
  }
};
