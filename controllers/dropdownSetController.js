const DropdownSet = require("../models/DropdownSet");
const ArchiveDropdown = require("../models/ArchiveDropdown");

// ====================================
// DROPDOWN SET CRUD OPERATIONS
// ====================================

// Create dropdown set
exports.createDropdownSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set name is required",
      });
    }

    const dropdownSet = await DropdownSet.create({
      name,
      description: description || "",
      options: [], // Start with empty options array
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const populatedSet = await DropdownSet.findById(dropdownSet._id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({
      success: true,
      data: populatedSet,
    });
  } catch (error) {
    console.error("Error creating dropdown set:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating dropdown set",
      error: error.message,
    });
  }
};

// Get all dropdown sets
exports.getAllDropdownSets = async (req, res) => {
  try {
    const { isActive, limit, skip = 0 } = req.query;

    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    let query = DropdownSet.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip));

    // Only apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const dropdownSets = await query;

    res.status(200).json({
      success: true,
      count: dropdownSets.length,
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

// Get dropdown set by ID
exports.getDropdownSetById = async (req, res) => {
  try {
    const dropdownSet = await DropdownSet.findById(req.params.id)
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

// Update dropdown set (name, description, isActive only - not options)
exports.updateDropdownSet = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const updateData = {
      updatedBy: req.user._id,
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    const dropdownSet = await DropdownSet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
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
    console.error("Error updating dropdown set:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Dropdown set with this name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating dropdown set",
      error: error.message,
    });
  }
};

// Delete dropdown set
exports.deleteDropdownSet = async (req, res) => {
  try {
    const dropdownSet = await DropdownSet.findById(req.params.id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Archive the dropdown set with deletion metadata
    const archivedOptions = dropdownSet.options.map((opt) => ({
      incrementalId: opt.incrementalId,
      name: opt.name,
      visibility: opt.visibility,
      isActive: opt.isActive,
      originalId: opt._id,
      createdAt: opt.createdAt,
      updatedAt: opt.updatedAt,
    }));

    await ArchiveDropdown.create({
      originalId: dropdownSet._id,
      name: dropdownSet.name,
      description: dropdownSet.description,
      lastOptionId: dropdownSet.lastOptionId,
      options: archivedOptions,
      isActive: dropdownSet.isActive,
      createdBy: dropdownSet.createdBy,
      updatedBy: dropdownSet.updatedBy,
      deletedBy: req.user._id,
      deletedAt: new Date(),
      deletionReason: req.body.deletionReason || "Manual deletion",
      deletionType: "set",
      originalCreatedAt: dropdownSet.createdAt,
      originalUpdatedAt: dropdownSet.updatedAt,
    });

    // Now delete from main collection
    await DropdownSet.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Dropdown set archived and deleted successfully",
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

// ====================================
// DROPDOWN OPTION OPERATIONS (Embedded)
// ====================================

// Create dropdown option in a dropdown set
exports.createOption = async (req, res) => {
  try {
    const { dropdownSetId } = req.params;
    const { name, visibility, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Option name is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Check if option with same name already exists in this set
    const existingOption = dropdownSet.options.find((opt) => opt.name === name);
    if (existingOption) {
      return res.status(400).json({
        success: false,
        message: "Option with this name already exists in this set",
      });
    }

    // Increment lastOptionId and assign to new option
    dropdownSet.lastOptionId += 1;
    const incrementalId = dropdownSet.lastOptionId;

    // Add new option with incremental ID
    dropdownSet.options.push({
      incrementalId,
      name,
      visibility: visibility !== undefined ? visibility : true,
      isActive: isActive !== undefined ? isActive : true,
    });

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedSet = await DropdownSet.findById(dropdownSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(201).json({
      success: true,
      data: updatedSet,
    });
  } catch (error) {
    console.error("Error creating option:", error);
    res.status(500).json({
      success: false,
      message: "Error creating option",
      error: error.message,
    });
  }
};

// Get all options in a dropdown set
exports.getOptionsBySetId = async (req, res) => {
  try {
    const { dropdownSetId } = req.params;
    const { isActive, visibility } = req.query;

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    let options = dropdownSet.options;

    // Apply filters
    if (isActive !== undefined) {
      options = options.filter((opt) => opt.isActive === (isActive === "true"));
    }

    if (visibility !== undefined) {
      options = options.filter(
        (opt) => opt.visibility === (visibility === "true")
      );
    }

    res.status(200).json({
      success: true,
      count: options.length,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching options:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching options",
      error: error.message,
    });
  }
};

// Get single option by ID
exports.getOptionById = async (req, res) => {
  try {
    const { dropdownSetId, optionId } = req.params;

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const option = dropdownSet.options.id(optionId);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Option not found",
      });
    }

    res.status(200).json({
      success: true,
      data: option,
    });
  } catch (error) {
    console.error("Error fetching option:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching option",
      error: error.message,
    });
  }
};

// Update dropdown option
exports.updateOption = async (req, res) => {
  try {
    const { dropdownSetId, optionId } = req.params;
    const { name, visibility, isActive } = req.body;

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const option = dropdownSet.options.id(optionId);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Option not found",
      });
    }

    // Check if new name conflicts with existing option (excluding current option)
    if (name && name !== option.name) {
      const existingOption = dropdownSet.options.find(
        (opt) => opt.name === name && opt._id.toString() !== optionId
      );
      if (existingOption) {
        return res.status(400).json({
          success: false,
          message: "Option with this name already exists in this set",
        });
      }
    }

    // Update option fields
    if (name) option.name = name;
    if (visibility !== undefined) option.visibility = visibility;
    if (isActive !== undefined) option.isActive = isActive;

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedSet = await DropdownSet.findById(dropdownSetId)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    res.status(200).json({
      success: true,
      data: updatedSet,
    });
  } catch (error) {
    console.error("Error updating option:", error);
    res.status(500).json({
      success: false,
      message: "Error updating option",
      error: error.message,
    });
  }
};

// Delete dropdown option (archive and remove from set)
exports.deleteOption = async (req, res) => {
  try {
    const { dropdownSetId, optionId } = req.params;

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const option = dropdownSet.options.id(optionId);

    if (!option) {
      return res.status(404).json({
        success: false,
        message: "Option not found",
      });
    }

    // Archive individual option by creating an archive entry for the dropdown set with only this option
    const archivedOption = {
      incrementalId: option.incrementalId,
      name: option.name,
      visibility: option.visibility,
      isActive: option.isActive,
      originalId: option._id,
      createdAt: option.createdAt,
      updatedAt: option.updatedAt,
    };

    await ArchiveDropdown.create({
      originalId: option._id, // Reference to the option itself
      name: dropdownSet.name, // Keep original set name
      description: dropdownSet.description, // Keep original set description
      lastOptionId: dropdownSet.lastOptionId,
      options: [archivedOption], // Only the deleted option
      isActive: dropdownSet.isActive,
      createdBy: dropdownSet.createdBy,
      updatedBy: dropdownSet.updatedBy,
      deletedBy: req.user._id,
      deletedAt: new Date(),
      deletionReason: req.body.deletionReason || "Individual option deletion",
      deletionType: "option", // Mark as individual option deletion
      parentSetId: dropdownSet._id, // Store parent set ID
      parentSetName: dropdownSet.name, // Store parent set name
      originalCreatedAt: dropdownSet.createdAt,
      originalUpdatedAt: dropdownSet.updatedAt,
    });

    // Now remove option from set
    option.deleteOne();
    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    res.status(200).json({
      success: true,
      message: "Option archived and deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting option:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting option",
      error: error.message,
    });
  }
};

// ====================================
// BULK OPERATIONS
// ====================================

// Bulk create options
exports.bulkCreateOptions = async (req, res) => {
  try {
    const { dropdownSetId } = req.params;
    const { options } = req.body;

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Options array is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const created = [];
    const errors = [];

    for (const optionData of options) {
      try {
        if (!optionData.name) {
          errors.push({
            option: optionData,
            error: "Option name is required",
          });
          continue;
        }

        // Check for duplicate name in set
        const existingOption = dropdownSet.options.find(
          (opt) => opt.name === optionData.name
        );
        if (existingOption) {
          errors.push({
            option: optionData,
            error: `Option with name '${optionData.name}' already exists in this set`,
          });
          continue;
        }

        // Increment lastOptionId and assign to new option
        dropdownSet.lastOptionId += 1;
        const incrementalId = dropdownSet.lastOptionId;

        dropdownSet.options.push({
          incrementalId,
          name: optionData.name,
          visibility:
            optionData.visibility !== undefined ? optionData.visibility : true,
          isActive:
            optionData.isActive !== undefined ? optionData.isActive : true,
        });

        created.push(optionData.name);
      } catch (error) {
        errors.push({
          option: optionData,
          error: error.message,
        });
      }
    }

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedSet = await DropdownSet.findById(dropdownSetId)
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
    console.error("Error bulk creating options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk creating options",
      error: error.message,
    });
  }
};

// Bulk update options
exports.bulkUpdateOptions = async (req, res) => {
  try {
    const { dropdownSetId } = req.params;
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const updated = [];
    const errors = [];

    for (const updateData of updates) {
      try {
        if (!updateData.id) {
          errors.push({
            update: updateData,
            error: "Option ID is required",
          });
          continue;
        }

        const option = dropdownSet.options.id(updateData.id);

        if (!option) {
          errors.push({
            id: updateData.id,
            error: "Option not found",
          });
          continue;
        }

        // Check for name conflict
        if (updateData.name && updateData.name !== option.name) {
          const existingOption = dropdownSet.options.find(
            (opt) =>
              opt.name === updateData.name &&
              opt._id.toString() !== updateData.id
          );
          if (existingOption) {
            errors.push({
              id: updateData.id,
              error: `Option with name '${updateData.name}' already exists in this set`,
            });
            continue;
          }
        }

        // Update fields
        if (updateData.name) option.name = updateData.name;
        if (updateData.visibility !== undefined)
          option.visibility = updateData.visibility;
        if (updateData.isActive !== undefined)
          option.isActive = updateData.isActive;

        updated.push(updateData.id);
      } catch (error) {
        errors.push({
          update: updateData,
          error: error.message,
        });
      }
    }

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const updatedSet = await DropdownSet.findById(dropdownSetId)
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
    console.error("Error bulk updating options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk updating options",
      error: error.message,
    });
  }
};

// Bulk delete options
exports.bulkDeleteOptions = async (req, res) => {
  try {
    const { dropdownSetId } = req.params;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Option IDs array is required",
      });
    }

    const dropdownSet = await DropdownSet.findById(dropdownSetId);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    const deleted = [];
    const errors = [];

    for (const optionId of ids) {
      try {
        const option = dropdownSet.options.id(optionId);

        if (!option) {
          errors.push({
            id: optionId,
            error: "Option not found",
          });
          continue;
        }

        option.deleteOne();
        deleted.push(optionId);
      } catch (error) {
        errors.push({
          id: optionId,
          error: error.message,
        });
      }
    }

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    res.status(200).json({
      success: true,
      deleted: deleted.length,
      failed: errors.length,
      message: `${deleted.length} options deleted successfully`,
      errors,
    });
  } catch (error) {
    console.error("Error bulk deleting options:", error);
    res.status(500).json({
      success: false,
      message: "Error bulk deleting options",
      error: error.message,
    });
  }
};

// ====================================
// ARCHIVE OPERATIONS (SuperAdmin Only)
// ====================================

// Get all archived dropdown sets
exports.getArchivedDropdownSets = async (req, res) => {
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

    const archivedSets = await ArchiveDropdown.find(filter)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("deletedBy", "name email")
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await ArchiveDropdown.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: archivedSets.length,
      total,
      data: archivedSets,
    });
  } catch (error) {
    console.error("Error fetching archived dropdown sets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived dropdown sets",
      error: error.message,
    });
  }
};

// Get archived dropdown set by ID
exports.getArchivedDropdownSetById = async (req, res) => {
  try {
    const archivedSet = await ArchiveDropdown.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("deletedBy", "name email");

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived dropdown set not found",
      });
    }

    res.status(200).json({
      success: true,
      data: archivedSet,
    });
  } catch (error) {
    console.error("Error fetching archived dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching archived dropdown set",
      error: error.message,
    });
  }
};

// Restore archived dropdown set or option
exports.restoreDropdownSet = async (req, res) => {
  try {
    const { archiveId } = req.params;

    // Find archived dropdown set
    const archivedSet = await ArchiveDropdown.findById(archiveId);

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived dropdown set not found",
      });
    }

    // Check deletion type
    if (archivedSet.deletionType === "option") {
      // CASE 1: Individual option restoration
      // Try to restore to the original parent set if it still exists
      const parentSet = await DropdownSet.findById(archivedSet.parentSetId);

      if (parentSet) {
        // Parent set exists - restore option back to it
        const optionToRestore = archivedSet.options[0]; // Only one option for individual deletion

        // Check if option with same name already exists in the set
        const existingOption = parentSet.options.find(
          (opt) => opt.name === optionToRestore.name
        );

        if (existingOption) {
          return res.status(400).json({
            success: false,
            message: `Option with name '${optionToRestore.name}' already exists in set '${parentSet.name}'. Cannot restore.`,
          });
        }

        // Restore option to parent set
        parentSet.options.push({
          incrementalId: optionToRestore.incrementalId,
          name: optionToRestore.name,
          visibility: optionToRestore.visibility,
          isActive: optionToRestore.isActive,
          createdAt: optionToRestore.createdAt,
          updatedAt: optionToRestore.updatedAt,
        });

        parentSet.updatedBy = req.user._id;
        await parentSet.save();

        // Remove from archive
        await ArchiveDropdown.findByIdAndDelete(archiveId);

        const populatedSet = await DropdownSet.findById(parentSet._id)
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");

        return res.status(200).json({
          success: true,
          message: `Option restored successfully to set '${parentSet.name}'`,
          data: populatedSet,
        });
      } else {
        // Parent set no longer exists - recreate the set with this option
        // Check if a set with the original name already exists
        const existingSet = await DropdownSet.findOne({
          name: archivedSet.name,
        });

        if (existingSet && !req.body.newName) {
          return res.status(400).json({
            success: false,
            message: `Parent set '${archivedSet.name}' was also deleted. A set with this name now exists. Provide 'newName' to create a new set with this option.`,
          });
        }

        // Create new set with the restored option
        const optionToRestore = archivedSet.options[0];
        const restoredSet = await DropdownSet.create({
          name: req.body.newName || archivedSet.name,
          description: archivedSet.description,
          lastOptionId: archivedSet.lastOptionId,
          options: [
            {
              incrementalId: optionToRestore.incrementalId,
              name: optionToRestore.name,
              visibility: optionToRestore.visibility,
              isActive: optionToRestore.isActive,
              createdAt: optionToRestore.createdAt,
              updatedAt: optionToRestore.updatedAt,
            },
          ],
          isActive: archivedSet.isActive,
          createdBy: archivedSet.createdBy,
          updatedBy: req.user._id,
        });

        // Remove from archive
        await ArchiveDropdown.findByIdAndDelete(archiveId);

        const populatedSet = await DropdownSet.findById(restoredSet._id)
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email");

        return res.status(200).json({
          success: true,
          message: `Parent set was deleted. Created new set '${restoredSet.name}' with restored option.`,
          data: populatedSet,
        });
      }
    } else {
      // CASE 2: Full set restoration
      // Check if a dropdown set with same name already exists
      const existingSet = await DropdownSet.findOne({ name: archivedSet.name });

      if (existingSet && !req.body.newName) {
        return res.status(400).json({
          success: false,
          message: `Dropdown set with name '${archivedSet.name}' already exists. Provide 'newName' to restore with a different name.`,
        });
      }

      // Restore all options
      const restoredOptions = archivedSet.options.map((opt) => ({
        incrementalId: opt.incrementalId,
        name: opt.name,
        visibility: opt.visibility,
        isActive: opt.isActive,
        createdAt: opt.createdAt,
        updatedAt: opt.updatedAt,
      }));

      // Create restored dropdown set
      const restoredSet = await DropdownSet.create({
        name: req.body.newName || archivedSet.name,
        description: archivedSet.description,
        lastOptionId: archivedSet.lastOptionId,
        options: restoredOptions,
        isActive: archivedSet.isActive,
        createdBy: archivedSet.createdBy,
        updatedBy: req.user._id,
      });

      // Remove from archive after successful restoration
      await ArchiveDropdown.findByIdAndDelete(archiveId);

      const populatedSet = await DropdownSet.findById(restoredSet._id)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email");

      return res.status(200).json({
        success: true,
        message: "Dropdown set restored successfully",
        data: populatedSet,
      });
    }
  } catch (error) {
    console.error("Error restoring dropdown set:", error);
    res.status(500).json({
      success: false,
      message: "Error restoring dropdown set",
      error: error.message,
    });
  }
};

// Permanently delete archived dropdown set
exports.permanentlyDeleteArchivedSet = async (req, res) => {
  try {
    const { archiveId } = req.params;

    const archivedSet = await ArchiveDropdown.findByIdAndDelete(archiveId);

    if (!archivedSet) {
      return res.status(404).json({
        success: false,
        message: "Archived dropdown set not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Archived dropdown set permanently deleted",
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

    const dropdownSet = await DropdownSet.findById(id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Add unique references to usedIn array
    const newReferences = references.filter(
      (ref) => !dropdownSet.usedIn.includes(ref)
    );

    if (newReferences.length === 0) {
      return res.status(200).json({
        success: true,
        message: "All references already exist in usedIn array",
        data: dropdownSet,
      });
    }

    dropdownSet.usedIn.push(...newReferences);
    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const populatedSet = await DropdownSet.findById(id)
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

    const dropdownSet = await DropdownSet.findById(id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Remove references from usedIn array
    const originalLength = dropdownSet.usedIn.length;
    dropdownSet.usedIn = dropdownSet.usedIn.filter(
      (ref) => !references.includes(ref)
    );

    const removedCount = originalLength - dropdownSet.usedIn.length;

    if (removedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No matching references found to remove",
        data: dropdownSet,
      });
    }

    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const populatedSet = await DropdownSet.findById(id)
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

    const dropdownSet = await DropdownSet.findById(id);

    if (!dropdownSet) {
      return res.status(404).json({
        success: false,
        message: "Dropdown set not found",
      });
    }

    // Remove duplicates from input
    const uniqueReferences = [...new Set(references)];

    dropdownSet.usedIn = uniqueReferences;
    dropdownSet.updatedBy = req.user._id;
    await dropdownSet.save();

    const populatedSet = await DropdownSet.findById(id)
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
