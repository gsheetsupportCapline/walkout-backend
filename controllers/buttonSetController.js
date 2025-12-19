const ButtonSet = require("../models/ButtonSet");
const RadioButton = require("../models/RadioButton");

/**
 * @desc    Create a new button set
 * @route   POST /api/radio-buttons/button-sets
 * @access  Admin, SuperAdmin
 */
exports.createButtonSet = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Button set name is required",
      });
    }

    const buttonSet = await ButtonSet.create({
      name,
      description: description || "",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Button set created successfully",
      data: buttonSet,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Button set with this name already exists",
      });
    }
    console.error("Error creating button set:", error);
    res.status(500).json({
      success: false,
      message: "Error creating button set",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all button sets
 * @route   GET /api/radio-buttons/button-sets
 * @access  All authenticated users
 */
exports.getAllButtonSets = async (req, res) => {
  try {
    const { isActive, limit = 100, skip = 0 } = req.query;

    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const buttonSets = await ButtonSet.find(query)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ButtonSet.countDocuments(query);

    res.status(200).json({
      success: true,
      count: buttonSets.length,
      total,
      data: buttonSets,
    });
  } catch (error) {
    console.error("Error fetching button sets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching button sets",
      error: error.message,
    });
  }
};

/**
 * @desc    Get button set by ID
 * @route   GET /api/radio-buttons/button-sets/:id
 * @access  All authenticated users
 */
exports.getButtonSetById = async (req, res) => {
  try {
    const buttonSet = await ButtonSet.findById(req.params.id)
      .populate("buttons", "name visibility isActive")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    res.status(200).json({
      success: true,
      data: buttonSet,
    });
  } catch (error) {
    console.error("Error fetching button set:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching button set",
      error: error.message,
    });
  }
};

/**
 * @desc    Update button set
 * @route   PUT /api/radio-buttons/button-sets/:id
 * @access  Admin, SuperAdmin
 */
exports.updateButtonSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const buttonSet = await ButtonSet.findById(req.params.id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    if (name) buttonSet.name = name;
    if (description !== undefined) buttonSet.description = description;
    if (isActive !== undefined) buttonSet.isActive = isActive;
    buttonSet.updatedBy = req.user._id;

    await buttonSet.save();

    res.status(200).json({
      success: true,
      message: "Button set updated successfully",
      data: buttonSet,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Button set with this name already exists",
      });
    }
    console.error("Error updating button set:", error);
    res.status(500).json({
      success: false,
      message: "Error updating button set",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete button set
 * @route   DELETE /api/radio-buttons/button-sets/:id
 * @access  Admin, SuperAdmin
 */
exports.deleteButtonSet = async (req, res) => {
  try {
    const buttonSet = await ButtonSet.findById(req.params.id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    await ButtonSet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Button set deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting button set:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting button set",
      error: error.message,
    });
  }
};

/**
 * @desc    Add buttons to button set
 * @route   POST /api/radio-buttons/button-sets/:id/buttons
 * @access  Admin, SuperAdmin
 */
exports.addButtonsToSet = async (req, res) => {
  try {
    const { buttonIds } = req.body;

    if (!buttonIds || !Array.isArray(buttonIds) || buttonIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Button IDs array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(req.params.id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Verify all buttons exist
    const buttons = await RadioButton.find({ _id: { $in: buttonIds } });
    if (buttons.length !== buttonIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more button IDs are invalid",
      });
    }

    // Add buttons (avoid duplicates)
    buttonIds.forEach((buttonId) => {
      if (!buttonSet.buttons.includes(buttonId)) {
        buttonSet.buttons.push(buttonId);
      }
    });

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedButtonSet = await ButtonSet.findById(buttonSet._id)
      .populate("buttons", "name visibility isActive")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Buttons added to button set successfully",
      data: updatedButtonSet,
    });
  } catch (error) {
    console.error("Error adding buttons to button set:", error);
    res.status(500).json({
      success: false,
      message: "Error adding buttons to button set",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove buttons from button set
 * @route   DELETE /api/radio-buttons/button-sets/:id/buttons
 * @access  Admin, SuperAdmin
 */
exports.removeButtonsFromSet = async (req, res) => {
  try {
    const { buttonIds } = req.body;

    if (!buttonIds || !Array.isArray(buttonIds) || buttonIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Button IDs array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(req.params.id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Remove buttons
    buttonSet.buttons = buttonSet.buttons.filter(
      (buttonId) => !buttonIds.includes(buttonId.toString())
    );

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedButtonSet = await ButtonSet.findById(buttonSet._id)
      .populate("buttons", "name visibility isActive")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Buttons removed from button set successfully",
      data: updatedButtonSet,
    });
  } catch (error) {
    console.error("Error removing buttons from button set:", error);
    res.status(500).json({
      success: false,
      message: "Error removing buttons from button set",
      error: error.message,
    });
  }
};
