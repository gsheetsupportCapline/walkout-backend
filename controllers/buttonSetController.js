const ButtonSet = require("../models/ButtonSet");
const ArchiveRadioButton = require("../models/ArchiveRadioButton");
const { toCSTDateString } = require("../utils/timezone");

// ====================================
// BUTTON SET CRUD OPERATIONS
// ====================================

// Create button set
exports.createButtonSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Button set name is required",
      });
    }

    const buttonSet = await ButtonSet.create({
      name,
      description: description || "",
      buttons: [], // Start with empty buttons array
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const populatedSet = await ButtonSet.findById(buttonSet._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedSet,
    });
  } catch (error) {
    console.error("Error creating button set:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Button set with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating button set",
      error: error.message,
    });
  }
};

// Get all button sets
exports.getAllButtonSets = async (req, res) => {
  try {
    const { isActive, limit, skip = 0 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    let query = ButtonSet.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip));

    // Only apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const buttonSets = await query;

    res.status(200).json({
      success: true,
      count: buttonSets.length,
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

// Get button set by ID
exports.getButtonSetById = async (req, res) => {
  try {
    const buttonSet = await ButtonSet.findById(req.params.id)
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

// Update button set (name, description, isActive only - not buttons)
exports.updateButtonSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const updateData = {
      updatedBy: req.user._id,
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const buttonSet = await ButtonSet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
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
    console.error("Error updating button set:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Button set with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating button set",
      error: error.message,
    });
  }
};

// Delete button set (archive instead of permanent deletion)
exports.deleteButtonSet = async (req, res) => {
  try {
    const buttonSet = await ButtonSet.findById(req.params.id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Archive the button set with deletion metadata
    const archivedButtons = buttonSet.buttons.map((btn) => ({
      incrementalId: btn.incrementalId,
      name: btn.name,
      visibility: btn.visibility,
      isActive: btn.isActive,
      originalId: btn._id,
      createdAt: btn.createdAt,
      updatedAt: btn.updatedAt,
    }));

    await ArchiveRadioButton.create({
      originalId: buttonSet._id,
      name: buttonSet.name,
      description: buttonSet.description,
      lastButtonId: buttonSet.lastButtonId,
      buttons: archivedButtons,
      isActive: buttonSet.isActive,
      createdBy: buttonSet.createdBy,
      updatedBy: buttonSet.updatedBy,
      deletedBy: req.user._id,
      deletedAt: toCSTDateString(),
      deletionReason: req.body.deletionReason || "Manual deletion",
      deletionType: "set",
      originalCreatedAt: buttonSet.createdAt,
      originalUpdatedAt: buttonSet.updatedAt,
    });

    // Now delete from main collection
    await ButtonSet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Button set archived and deleted successfully",
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

// ====================================
// RADIO BUTTON OPERATIONS (Embedded)
// ====================================

// Create radio button in a button set
exports.createButton = async (req, res) => {
  try {
    const { buttonSetId } = req.params;
    const { name, visibility, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Button name is required",
      });
    }

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Check if button with same name already exists in this set
    const existingButton = buttonSet.buttons.find((btn) => btn.name === name);
    if (existingButton) {
      return res.status(400).json({
        success: false,
        message: "Button with this name already exists in this set",
      });
    }

    // Increment lastButtonId and assign to new button
    buttonSet.lastButtonId += 1;
    const incrementalId = buttonSet.lastButtonId;

    // Add new button with incremental ID
    buttonSet.buttons.push({
      incrementalId,
      name,
      visibility: visibility !== undefined ? visibility : true,
      isActive: isActive !== undefined ? isActive : true,
    });

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedSet = await ButtonSet.findById(buttonSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({
      success: true,
      data: updatedSet,
    });
  } catch (error) {
    console.error("Error creating button:", error);
    res.status(500).json({
      success: false,
      message: "Error creating button",
      error: error.message,
    });
  }
};

// Get all buttons in a button set
exports.getButtonsBySetId = async (req, res) => {
  try {
    const { buttonSetId } = req.params;
    const { isActive, visibility } = req.query;

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    let buttons = buttonSet.buttons;

    // Apply filters
    if (isActive !== undefined) {
      buttons = buttons.filter((btn) => btn.isActive === (isActive === "true"));
    }

    if (visibility !== undefined) {
      buttons = buttons.filter(
        (btn) => btn.visibility === (visibility === "true"),
      );
    }

    res.status(200).json({
      success: true,
      count: buttons.length,
      data: buttons,
    });
  } catch (error) {
    console.error("Error fetching buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching buttons",
      error: error.message,
    });
  }
};

// Get single button by ID
exports.getButtonById = async (req, res) => {
  try {
    const { buttonSetId, buttonId } = req.params;

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const button = buttonSet.buttons.id(buttonId);

    if (!button) {
      return res.status(404).json({
        success: false,
        message: "Button not found",
      });
    }

    res.status(200).json({
      success: true,
      data: button,
    });
  } catch (error) {
    console.error("Error fetching button:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching button",
      error: error.message,
    });
  }
};

// Update radio button
exports.updateButton = async (req, res) => {
  try {
    const { buttonSetId, buttonId } = req.params;
    const { name, visibility, isActive } = req.body;

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const button = buttonSet.buttons.id(buttonId);

    if (!button) {
      return res.status(404).json({
        success: false,
        message: "Button not found",
      });
    }

    // Check if new name conflicts with existing button (excluding current button)
    if (name && name !== button.name) {
      const existingButton = buttonSet.buttons.find(
        (btn) => btn.name === name && btn._id.toString() !== buttonId,
      );
      if (existingButton) {
        return res.status(400).json({
          success: false,
          message: "Button with this name already exists in this set",
        });
      }
    }

    // Update button fields
    if (name) button.name = name;
    if (visibility !== undefined) button.visibility = visibility;
    if (isActive !== undefined) button.isActive = isActive;

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedSet = await ButtonSet.findById(buttonSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      data: updatedSet,
    });
  } catch (error) {
    console.error("Error updating button:", error);
    res.status(500).json({
      success: false,
      message: "Error updating button",
      error: error.message,
    });
  }
};

// Delete radio button (archive and remove from set)
exports.deleteButton = async (req, res) => {
  try {
    const { buttonSetId, buttonId } = req.params;

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const button = buttonSet.buttons.id(buttonId);

    if (!button) {
      return res.status(404).json({
        success: false,
        message: "Button not found",
      });
    }

    // Archive individual button by creating an archive entry for the button set with only this button
    const archivedButton = {
      incrementalId: button.incrementalId,
      name: button.name,
      visibility: button.visibility,
      isActive: button.isActive,
      originalId: button._id,
      createdAt: button.createdAt,
      updatedAt: button.updatedAt,
    };

    await ArchiveRadioButton.create({
      originalId: button._id, // Reference to the button itself
      name: buttonSet.name, // Keep original set name
      description: buttonSet.description, // Keep original set description
      lastButtonId: buttonSet.lastButtonId,
      buttons: [archivedButton], // Only the deleted button
      isActive: buttonSet.isActive,
      createdBy: buttonSet.createdBy,
      updatedBy: buttonSet.updatedBy,
      deletedBy: req.user._id,
      deletedAt: toCSTDateString(),
      deletionReason: req.body.deletionReason || "Individual button deletion",
      deletionType: "button", // Mark as individual button deletion
      parentSetId: buttonSet._id, // Store parent set ID
      parentSetName: buttonSet.name, // Store parent set name
      originalCreatedAt: buttonSet.createdAt,
      originalUpdatedAt: buttonSet.updatedAt,
    });

    // Now remove button from set
    button.deleteOne();
    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    res.status(200).json({
      success: true,
      message: "Button archived and deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting button:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting button",
      error: error.message,
    });
  }
};

// ====================================
// BULK OPERATIONS
// ====================================

// Bulk create buttons
exports.bulkCreateButtons = async (req, res) => {
  try {
    const { buttonSetId } = req.params;
    const { buttons } = req.body;

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Buttons array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const created = [];
    const errors = [];

    for (const buttonData of buttons) {
      try {
        if (!buttonData.name) {
          errors.push({
            button: buttonData,
            error: "Button name is required",
          });
          continue;
        }

        // Check for duplicate name in set
        const existingButton = buttonSet.buttons.find(
          (btn) => btn.name === buttonData.name,
        );
        if (existingButton) {
          errors.push({
            button: buttonData,
            error: `Button with name '${buttonData.name}' already exists in this set`,
          });
          continue;
        }

        // Increment lastButtonId and assign to new button
        buttonSet.lastButtonId += 1;
        const incrementalId = buttonSet.lastButtonId;

        buttonSet.buttons.push({
          incrementalId,
          name: buttonData.name,
          visibility:
            buttonData.visibility !== undefined ? buttonData.visibility : true,
          isActive:
            buttonData.isActive !== undefined ? buttonData.isActive : true,
        });

        created.push(buttonData.name);
      } catch (error) {
        errors.push({
          button: buttonData,
          error: error.message,
        });
      }
    }

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedSet = await ButtonSet.findById(buttonSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({
      success: true,
      created: created.length,
      failed: errors.length,
      data: updatedSet,
      errors,
    });
  } catch (error) {
    console.error("Error bulk creating buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk creating buttons",
      error: error.message,
    });
  }
};

// Bulk update buttons
exports.bulkUpdateButtons = async (req, res) => {
  try {
    const { buttonSetId } = req.params;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const updated = [];
    const errors = [];

    for (const updateData of updates) {
      try {
        if (!updateData.id) {
          errors.push({
            update: updateData,
            error: "Button ID is required",
          });
          continue;
        }

        const button = buttonSet.buttons.id(updateData.id);

        if (!button) {
          errors.push({
            id: updateData.id,
            error: "Button not found",
          });
          continue;
        }

        // Check for name conflict
        if (updateData.name && updateData.name !== button.name) {
          const existingButton = buttonSet.buttons.find(
            (btn) =>
              btn.name === updateData.name &&
              btn._id.toString() !== updateData.id,
          );
          if (existingButton) {
            errors.push({
              id: updateData.id,
              error: `Button with name '${updateData.name}' already exists in this set`,
            });
            continue;
          }
        }

        // Update fields
        if (updateData.name) button.name = updateData.name;
        if (updateData.visibility !== undefined)
          button.visibility = updateData.visibility;
        if (updateData.isActive !== undefined)
          button.isActive = updateData.isActive;

        updated.push(updateData.id);
      } catch (error) {
        errors.push({
          update: updateData,
          error: error.message,
        });
      }
    }

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const updatedSet = await ButtonSet.findById(buttonSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      updated: updated.length,
      failed: errors.length,
      data: updatedSet,
      errors,
    });
  } catch (error) {
    console.error("Error bulk updating buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating buttons",
      error: error.message,
    });
  }
};

// Bulk delete buttons
exports.bulkDeleteButtons = async (req, res) => {
  try {
    const { buttonSetId } = req.params;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Button IDs array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(buttonSetId);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    const deleted = [];
    const errors = [];

    for (const buttonId of ids) {
      try {
        const button = buttonSet.buttons.id(buttonId);

        if (!button) {
          errors.push({
            id: buttonId,
            error: "Button not found",
          });
          continue;
        }

        button.deleteOne();
        deleted.push(buttonId);
      } catch (error) {
        errors.push({
          id: buttonId,
          error: error.message,
        });
      }
    }

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    res.status(200).json({
      success: true,
      deleted: deleted.length,
      failed: errors.length,
      message: `${deleted.length} buttons deleted successfully`,
      errors,
    });
  } catch (error) {
    console.error("Error bulk deleting buttons:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk deleting buttons",
      error: error.message,
    });
  }
};

// ====================================
// ARCHIVE OPERATIONS (SuperAdmin Only)
// ====================================

// Get all archived button sets
exports.getArchivedButtonSets = async (req, res) => {
  try {
    const {
      deletedBy,
      limit = 20,
      skip = 0,
      sortBy = "-deletedAt",
    } = req.query;

    const filter = {};
    if (deletedBy) {
      filter.deletedBy = deletedBy;
    }

    const archivedSets = await ArchiveRadioButton.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("deletedBy", "name email")
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ArchiveRadioButton.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: archivedSets.length,
      total,
      data: archivedSets,
    });
  } catch (error) {
    console.error("Error fetching archived button sets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived button sets",
      error: error.message,
    });
  }
};

// Get archived button set by ID
exports.getArchivedButtonSetById = async (req, res) => {
  try {
    const archivedSet = await ArchiveRadioButton.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("deletedBy", "name email");

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived button set not found",
      });
    }

    res.status(200).json({
      success: true,
      data: archivedSet,
    });
  } catch (error) {
    console.error("Error fetching archived button set:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived button set",
      error: error.message,
    });
  }
};

// Restore archived button set or button
exports.restoreButtonSet = async (req, res) => {
  try {
    const { archiveId } = req.params;

    // Find archived button set
    const archivedSet = await ArchiveRadioButton.findById(archiveId);

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived button set not found",
      });
    }

    // Check deletion type
    if (archivedSet.deletionType === "button") {
      // CASE 1: Individual button restoration
      // Try to restore to the original parent set if it still exists
      const parentSet = await ButtonSet.findById(archivedSet.parentSetId);

      if (parentSet) {
        // Parent set exists - restore button back to it
        const buttonToRestore = archivedSet.buttons[0]; // Only one button for individual deletion

        // Check if button with same name already exists in the set
        const existingButton = parentSet.buttons.find(
          (btn) => btn.name === buttonToRestore.name,
        );

        if (existingButton) {
          return res.status(400).json({
            success: false,
            message: `Button with name '${buttonToRestore.name}' already exists in set '${parentSet.name}'. Cannot restore.`,
          });
        }

        // Restore button to parent set
        parentSet.buttons.push({
          incrementalId: buttonToRestore.incrementalId,
          name: buttonToRestore.name,
          visibility: buttonToRestore.visibility,
          isActive: buttonToRestore.isActive,
          createdAt: buttonToRestore.createdAt,
          updatedAt: buttonToRestore.updatedAt,
        });

        parentSet.updatedBy = req.user._id;
        await parentSet.save();

        // Remove from archive
        await ArchiveRadioButton.findByIdAndDelete(archiveId);

        const populatedSet = await ButtonSet.findById(parentSet._id)
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");

        return res.status(200).json({
          success: true,
          message: `Button restored successfully to set '${parentSet.name}'`,
          data: populatedSet,
        });
      } else {
        // Parent set no longer exists - recreate the set with this button
        // Check if a set with the original name already exists
        const existingSet = await ButtonSet.findOne({
          name: archivedSet.name,
        });

        if (existingSet && !req.body.newName) {
          return res.status(400).json({
            success: false,
            message: `Parent set '${archivedSet.name}' was also deleted. A set with this name now exists. Provide 'newName' to create a new set with this button.`,
          });
        }

        // Create new set with the restored button
        const buttonToRestore = archivedSet.buttons[0];
        const restoredSet = await ButtonSet.create({
          name: req.body.newName || archivedSet.name,
          description: archivedSet.description,
          lastButtonId: archivedSet.lastButtonId,
          buttons: [
            {
              incrementalId: buttonToRestore.incrementalId,
              name: buttonToRestore.name,
              visibility: buttonToRestore.visibility,
              isActive: buttonToRestore.isActive,
              createdAt: buttonToRestore.createdAt,
              updatedAt: buttonToRestore.updatedAt,
            },
          ],
          isActive: archivedSet.isActive,
          createdBy: archivedSet.createdBy,
          updatedBy: req.user._id,
        });

        // Remove from archive
        await ArchiveRadioButton.findByIdAndDelete(archiveId);

        const populatedSet = await ButtonSet.findById(restoredSet._id)
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");

        return res.status(200).json({
          success: true,
          message: `Parent set was deleted. Created new set '${restoredSet.name}' with restored button.`,
          data: populatedSet,
        });
      }
    } else {
      // CASE 2: Full set restoration
      // Check if a button set with same name already exists
      const existingSet = await ButtonSet.findOne({ name: archivedSet.name });

      if (existingSet && !req.body.newName) {
        return res.status(400).json({
          success: false,
          message: `Button set with name '${archivedSet.name}' already exists. Provide 'newName' to restore with a different name.`,
        });
      }

      // Restore all buttons
      const restoredButtons = archivedSet.buttons.map((btn) => ({
        incrementalId: btn.incrementalId,
        name: btn.name,
        visibility: btn.visibility,
        isActive: btn.isActive,
        createdAt: btn.createdAt,
        updatedAt: btn.updatedAt,
      }));

      // Create restored button set
      const restoredSet = await ButtonSet.create({
        name: req.body.newName || archivedSet.name,
        description: archivedSet.description,
        lastButtonId: archivedSet.lastButtonId,
        buttons: restoredButtons,
        isActive: archivedSet.isActive,
        createdBy: archivedSet.createdBy,
        updatedBy: req.user._id,
      });

      // Remove from archive after successful restoration
      await ArchiveRadioButton.findByIdAndDelete(archiveId);

      const populatedSet = await ButtonSet.findById(restoredSet._id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      return res.status(200).json({
        success: true,
        message: "Button set restored successfully",
        data: populatedSet,
      });
    }
  } catch (error) {
    console.error("Error restoring button set:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring button set",
      error: error.message,
    });
  }
};

// Permanently delete archived button set
exports.permanentlyDeleteArchivedSet = async (req, res) => {
  try {
    const { archiveId } = req.params;

    const archivedSet = await ArchiveRadioButton.findByIdAndDelete(archiveId);

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived button set not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Archived button set permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting archived set:", error);
    res.status(500).json({
      success: false,
      message: "Error permanently deleting archived set",
      error: error.message,
    });
  }
};

// ====================================
// USED IN OPERATIONS
// ====================================

// Update usedIn array - Add references
exports.addUsedInReferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { references } = req.body;

    if (!references || !Array.isArray(references) || references.length === 0) {
      return res.status(400).json({
        success: false,
        message: "References array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Add unique references to usedIn array
    const newReferences = references.filter(
      (ref) => !buttonSet.usedIn.includes(ref),
    );

    if (newReferences.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All references already exist in usedIn array",
        data: buttonSet,
      });
    }

    buttonSet.usedIn.push(...newReferences);
    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const populatedSet = await ButtonSet.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: `${newReferences.length} reference(s) added successfully`,
      data: populatedSet,
    });
  } catch (error) {
    console.error("Error adding usedIn references:", error);
    res.status(500).json({
      success: false,
      message: "Error adding usedIn references",
      error: error.message,
    });
  }
};

// Update usedIn array - Remove references
exports.removeUsedInReferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { references } = req.body;

    if (!references || !Array.isArray(references) || references.length === 0) {
      return res.status(400).json({
        success: false,
        message: "References array is required",
      });
    }

    const buttonSet = await ButtonSet.findById(id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Remove references from usedIn array
    const originalLength = buttonSet.usedIn.length;
    buttonSet.usedIn = buttonSet.usedIn.filter(
      (ref) => !references.includes(ref),
    );

    const removedCount = originalLength - buttonSet.usedIn.length;

    if (removedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No matching references found to remove",
        data: buttonSet,
      });
    }

    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const populatedSet = await ButtonSet.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: `${removedCount} reference(s) removed successfully`,
      data: populatedSet,
    });
  } catch (error) {
    console.error("Error removing usedIn references:", error);
    res.status(500).json({
      success: false,
      message: "Error removing usedIn references",
      error: error.message,
    });
  }
};

// Replace entire usedIn array
exports.replaceUsedInReferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { references } = req.body;

    if (!references || !Array.isArray(references)) {
      return res.status(400).json({
        success: false,
        message: "References array is required (can be empty to clear all)",
      });
    }

    const buttonSet = await ButtonSet.findById(id);

    if (!buttonSet) {
      return res.status(404).json({
        success: false,
        message: "Button set not found",
      });
    }

    // Remove duplicates from input
    const uniqueReferences = [...new Set(references)];

    buttonSet.usedIn = uniqueReferences;
    buttonSet.updatedBy = req.user._id;
    await buttonSet.save();

    const populatedSet = await ButtonSet.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      message: "UsedIn references updated successfully",
      data: populatedSet,
    });
  } catch (error) {
    console.error("Error replacing usedIn references:", error);
    res.status(500).json({
      success: false,
      message: "Error replacing usedIn references",
      error: error.message,
    });
  }
};
