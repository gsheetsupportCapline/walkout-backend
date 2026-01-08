const Walkout = require("../models/Walkout");
const validateOfficeSection = require("../utils/validateOfficeSection");

// ====================================
// OFFICE SECTION OPERATIONS
// ====================================

// Submit Office Section
exports.submitOfficeSection = async (req, res) => {
  try {
    const {
      formRefId,
      patientCame,
      postOpZeroProduction,
      patientType,
      hasInsurance,
      insuranceType,
      insurance,
      googleReviewRequest,
      expectedPatientPortionOfficeWO,
      patientPortionCollected,
      differenceInPatientPortion,
      patientPortionPrimaryMode,
      amountCollectedPrimaryMode,
      patientPortionSecondaryMode,
      amountCollectedSecondaryMode,
      lastFourDigitsCheckForte,
      reasonLessCollection,
      ruleEngineRun,
      ruleEngineNotRunReason,
      ruleEngineError,
      errorFixRemarks,
      issuesFixed,
      signedGeneralConsent,
      signedTreatmentConsent,
      preAuthAvailable,
      signedTxPlan,
      perioChart,
      nvd,
      xRayPanoAttached,
      majorServiceForm,
      routeSheet,
      prcUpdatedInRouteSheet,
      narrative,
      newOfficeNote,
      openTime,
    } = req.body;

    // ====================================
    // VALIDATION LOGIC
    // ====================================

    // Level 1: patientCame is always mandatory
    if (
      patientCame === undefined ||
      patientCame === null ||
      patientCame === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "patientCame is required",
        field: "patientCame",
        receivedValue: patientCame,
        expectedType: "number (1 or 2)",
        tip: "Make sure you select 'Patient Came' or 'Patient Did Not Come' in the form",
      });
    }

    // Validate patientCame is a valid number
    if (
      typeof patientCame !== "number" ||
      (patientCame !== 1 && patientCame !== 2)
    ) {
      return res.status(400).json({
        success: false,
        message: "patientCame must be either 1 (Yes) or 2 (No)",
        field: "patientCame",
        receivedValue: patientCame,
        receivedType: typeof patientCame,
      });
    }

    const officeData = {
      patientCame,
    };

    let walkoutStatus = "draft";
    let submitToLC3Time = null;

    // If patient didn't come (patientCame = 2)
    if (patientCame === 2) {
      walkoutStatus = "patient_not_came";
      // Only save patientCame, rest will be undefined/default
    } else if (patientCame === 1) {
      // Patient came - validate other fields

      // Level 2: postOpZeroProduction is mandatory
      if (postOpZeroProduction === undefined || postOpZeroProduction === null) {
        return res.status(400).json({
          success: false,
          message: "postOpZeroProduction is required when patient came",
        });
      }
      officeData.postOpZeroProduction = postOpZeroProduction;

      // Level 3: patientType is mandatory
      if (patientType === undefined || patientType === null) {
        return res.status(400).json({
          success: false,
          message: "patientType is required when patient came",
        });
      }
      officeData.patientType = patientType;

      // Level 4: hasInsurance is mandatory
      if (hasInsurance === undefined || hasInsurance === null) {
        return res.status(400).json({
          success: false,
          message: "hasInsurance is required when patient came",
        });
      }
      officeData.hasInsurance = hasInsurance;

      // Level 5: insuranceType (conditional)
      if (hasInsurance === 1) {
        if (insuranceType === undefined || insuranceType === null) {
          return res.status(400).json({
            success: false,
            message: "insuranceType is required when patient has insurance",
          });
        }
        officeData.insuranceType = insuranceType;

        // Level 5b: insurance (conditional based on insuranceType)
        if (insuranceType === 2 || insuranceType === 6) {
          if (insurance === undefined || insurance === null) {
            return res.status(400).json({
              success: false,
              message:
                "insurance is required for selected insurance type (2 or 6)",
            });
          }
          officeData.insurance = insurance;
        }
      }

      // Level 6: googleReviewRequest is mandatory
      if (googleReviewRequest === undefined || googleReviewRequest === null) {
        return res.status(400).json({
          success: false,
          message: "googleReviewRequest is required",
        });
      }
      officeData.googleReviewRequest = googleReviewRequest;

      // Check if postOpZeroProduction = 1 (skip payment/document fields)
      if (postOpZeroProduction !== 1) {
        // Level 7: expectedPatientPortionOfficeWO is mandatory (can be 0)
        // Important: 0 is a valid value, so we only check for undefined/null/empty string
        if (
          expectedPatientPortionOfficeWO === undefined ||
          expectedPatientPortionOfficeWO === null ||
          expectedPatientPortionOfficeWO === ""
        ) {
          return res.status(400).json({
            success: false,
            message: "expectedPatientPortionOfficeWO is required (can be 0)",
            tip: "Please enter expected patient portion amount. Zero (0) is allowed.",
          });
        }

        // Validate it's a valid number
        if (
          typeof expectedPatientPortionOfficeWO !== "number" ||
          isNaN(expectedPatientPortionOfficeWO)
        ) {
          return res.status(400).json({
            success: false,
            message: "expectedPatientPortionOfficeWO must be a valid number",
            receivedValue: expectedPatientPortionOfficeWO,
            receivedType: typeof expectedPatientPortionOfficeWO,
          });
        }

        officeData.expectedPatientPortionOfficeWO =
          expectedPatientPortionOfficeWO;

        // Level 8: patientPortionCollected (not mandatory)
        if (
          patientPortionCollected !== undefined &&
          patientPortionCollected !== null &&
          patientPortionCollected !== ""
        ) {
          officeData.patientPortionCollected = patientPortionCollected;
        }

        // Level 9: differenceInPatientPortion (not mandatory)
        if (
          differenceInPatientPortion !== undefined &&
          differenceInPatientPortion !== null &&
          differenceInPatientPortion !== ""
        ) {
          officeData.differenceInPatientPortion = differenceInPatientPortion;
        }

        // Level 10: patientPortionPrimaryMode and amount
        if (
          patientPortionPrimaryMode !== undefined &&
          patientPortionPrimaryMode !== null &&
          patientPortionPrimaryMode !== ""
        ) {
          officeData.patientPortionPrimaryMode = patientPortionPrimaryMode;

          // If primary mode has value, amount is mandatory
          if (
            amountCollectedPrimaryMode === undefined ||
            amountCollectedPrimaryMode === null ||
            amountCollectedPrimaryMode === ""
          ) {
            return res.status(400).json({
              success: false,
              message:
                "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided",
            });
          }
          officeData.amountCollectedPrimaryMode = amountCollectedPrimaryMode;
        }

        // Level 11: patientPortionSecondaryMode and amount
        if (
          patientPortionSecondaryMode !== undefined &&
          patientPortionSecondaryMode !== null &&
          patientPortionSecondaryMode !== ""
        ) {
          officeData.patientPortionSecondaryMode = patientPortionSecondaryMode;

          // If secondary mode has value, amount is mandatory
          if (
            amountCollectedSecondaryMode === undefined ||
            amountCollectedSecondaryMode === null ||
            amountCollectedSecondaryMode === ""
          ) {
            return res.status(400).json({
              success: false,
              message:
                "amountCollectedSecondaryMode is required when patientPortionSecondaryMode is provided",
            });
          }
          officeData.amountCollectedSecondaryMode =
            amountCollectedSecondaryMode;
        }

        // Level 12: lastFourDigitsCheckForte (if mode = 4)
        const isPrimaryMode4 = patientPortionPrimaryMode === 4;
        const isSecondaryMode4 = patientPortionSecondaryMode === 4;

        if (isPrimaryMode4 || isSecondaryMode4) {
          if (
            lastFourDigitsCheckForte === undefined ||
            lastFourDigitsCheckForte === null ||
            lastFourDigitsCheckForte === ""
          ) {
            return res.status(400).json({
              success: false,
              message:
                "lastFourDigitsCheckForte is required when payment mode is 4",
            });
          }
          officeData.lastFourDigitsCheckForte = lastFourDigitsCheckForte;
        }

        // Level 13: reasonLessCollection (if difference is negative)
        if (
          differenceInPatientPortion !== undefined &&
          differenceInPatientPortion < 0
        ) {
          if (
            reasonLessCollection === undefined ||
            reasonLessCollection === null ||
            reasonLessCollection === ""
          ) {
            return res.status(400).json({
              success: false,
              message:
                "reasonLessCollection is required when differenceInPatientPortion is negative",
            });
          }
          officeData.reasonLessCollection = reasonLessCollection;
        }

        // Level 14: ruleEngineRun is mandatory
        if (ruleEngineRun === undefined || ruleEngineRun === null) {
          return res.status(400).json({
            success: false,
            message: "ruleEngineRun is required",
          });
        }
        officeData.ruleEngineRun = ruleEngineRun;

        // Level 15: ruleEngineError or ruleEngineNotRunReason
        if (ruleEngineRun === 1) {
          // ruleEngineError is mandatory
          if (ruleEngineError === undefined || ruleEngineError === null) {
            return res.status(400).json({
              success: false,
              message: "ruleEngineError is required when rule engine ran",
            });
          }
          officeData.ruleEngineError = ruleEngineError;

          // Level 15b: If ruleEngineError = 1, errorFixRemarks and issuesFixed mandatory
          if (ruleEngineError === 1) {
            if (!errorFixRemarks || errorFixRemarks.trim() === "") {
              return res.status(400).json({
                success: false,
                message:
                  "errorFixRemarks is required when ruleEngineError is 1",
              });
            }
            if (issuesFixed === undefined || issuesFixed === null) {
              return res.status(400).json({
                success: false,
                message: "issuesFixed is required when ruleEngineError is 1",
              });
            }
            officeData.errorFixRemarks = errorFixRemarks;
            officeData.issuesFixed = issuesFixed;
          }
        } else if (ruleEngineRun === 2) {
          // ruleEngineNotRunReason is mandatory
          if (
            ruleEngineNotRunReason === undefined ||
            ruleEngineNotRunReason === null
          ) {
            return res.status(400).json({
              success: false,
              message:
                "ruleEngineNotRunReason is required when rule engine did not run",
            });
          }
          officeData.ruleEngineNotRunReason = ruleEngineNotRunReason;
        }

        // Level 16: Boolean fields - mandatory ones
        if (
          signedGeneralConsent === undefined ||
          signedGeneralConsent === null
        ) {
          return res.status(400).json({
            success: false,
            message: "signedGeneralConsent is required",
          });
        }
        officeData.signedGeneralConsent = signedGeneralConsent;

        if (signedTxPlan === undefined || signedTxPlan === null) {
          return res.status(400).json({
            success: false,
            message: "signedTxPlan is required",
          });
        }
        officeData.signedTxPlan = signedTxPlan;

        if (xRayPanoAttached === undefined || xRayPanoAttached === null) {
          return res.status(400).json({
            success: false,
            message: "xRayPanoAttached is required",
          });
        }
        officeData.xRayPanoAttached = xRayPanoAttached;

        if (
          prcUpdatedInRouteSheet === undefined ||
          prcUpdatedInRouteSheet === null
        ) {
          return res.status(400).json({
            success: false,
            message: "prcUpdatedInRouteSheet is required",
          });
        }
        officeData.prcUpdatedInRouteSheet = prcUpdatedInRouteSheet;

        if (routeSheet === undefined || routeSheet === null) {
          return res.status(400).json({
            success: false,
            message: "routeSheet is required",
          });
        }
        officeData.routeSheet = routeSheet;

        // Optional boolean fields
        if (signedTreatmentConsent !== undefined)
          officeData.signedTreatmentConsent = signedTreatmentConsent;
        if (preAuthAvailable !== undefined)
          officeData.preAuthAvailable = preAuthAvailable;
        if (perioChart !== undefined) officeData.perioChart = perioChart;
        if (nvd !== undefined) officeData.nvd = nvd;
        if (majorServiceForm !== undefined)
          officeData.majorServiceForm = majorServiceForm;
        if (narrative !== undefined) officeData.narrative = narrative;
      }

      // Set status to office_submitted and submitToLC3 time
      walkoutStatus = "office_submitted";
      submitToLC3Time = new Date();
    }

    // Handle office historical notes
    const officeHistoricalNotes = [];
    if (newOfficeNote && newOfficeNote.trim() !== "") {
      officeHistoricalNotes.push({
        note: newOfficeNote.trim(),
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }
    officeData.officeHistoricalNotes = officeHistoricalNotes;

    // Metadata
    officeData.officeSubmittedBy = req.user._id;
    officeData.officeSubmittedAt = new Date();
    officeData.officeLastUpdatedAt = new Date();

    // Validate formRefId if provided
    if (formRefId && typeof formRefId !== "string") {
      return res.status(400).json({
        success: false,
        message: "formRefId must be a string",
        receivedType: typeof formRefId,
      });
    }

    // Create walkout document
    const walkout = await Walkout.create({
      userId: req.user._id,
      formRefId: formRefId || undefined, // Set only if provided, immutable after this
      openTime: openTime || new Date(),
      submitToLC3: submitToLC3Time,
      lastUpdateOn: new Date(),
      officeSection: officeData,
      walkoutStatus,
    });

    const populatedWalkout = await Walkout.findById(walkout._id)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Office section submitted successfully",
      data: populatedWalkout,
    });
  } catch (error) {
    console.error("Error submitting office section:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting office section",
      error: error.message,
    });
  }
};

// Get all walkouts
exports.getAllWalkouts = async (req, res) => {
  try {
    const { walkoutStatus, userId, formRefId, limit, skip = 0 } = req.query;

    const filter = { isActive: true };

    if (walkoutStatus) {
      filter.walkoutStatus = walkoutStatus;
    }

    if (userId) {
      filter.userId = userId;
    }

    if (formRefId) {
      filter.formRefId = formRefId;
    }

    let query = Walkout.find(filter)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip));

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const walkouts = await query;

    res.status(200).json({
      success: true,
      count: walkouts.length,
      data: walkouts,
    });
  } catch (error) {
    console.error("Error fetching walkouts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching walkouts",
      error: error.message,
    });
  }
};

// Get walkout by ID
exports.getWalkoutById = async (req, res) => {
  try {
    const walkout = await Walkout.findById(req.params.id)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email");

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    res.status(200).json({
      success: true,
      data: walkout,
    });
  } catch (error) {
    console.error("Error fetching walkout:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching walkout",
      error: error.message,
    });
  }
};

// Update office section (re-submit)
exports.updateOfficeSection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientCame,
      postOpZeroProduction,
      patientType,
      hasInsurance,
      insuranceType,
      insurance,
      googleReviewRequest,
      expectedPatientPortionOfficeWO,
      patientPortionCollected,
      differenceInPatientPortion,
      patientPortionPrimaryMode,
      amountCollectedPrimaryMode,
      patientPortionSecondaryMode,
      amountCollectedSecondaryMode,
      lastFourDigitsCheckForte,
      reasonLessCollection,
      ruleEngineRun,
      ruleEngineNotRunReason,
      ruleEngineError,
      errorFixRemarks,
      issuesFixed,
      signedGeneralConsent,
      signedTreatmentConsent,
      preAuthAvailable,
      signedTxPlan,
      perioChart,
      nvd,
      xRayPanoAttached,
      majorServiceForm,
      routeSheet,
      prcUpdatedInRouteSheet,
      narrative,
      newOfficeNote,
    } = req.body;

    const walkout = await Walkout.findById(id);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // ====================================
    // VALIDATION LOGIC WITH BATCH ERRORS
    // ====================================

    const validation = validateOfficeSection(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed. Please fix the following errors:",
        errorCount: validation.errors.length,
        errors: validation.errors,
      });
    }

    // ====================================
    // CLEAR AND UPDATE FIELDS
    // ====================================

    // Clear all office section fields first, keep only metadata and notes
    const existingNotes = walkout.officeSection.officeHistoricalNotes || [];
    const submittedBy = walkout.officeSection.officeSubmittedBy;
    const submittedAt = walkout.officeSection.officeSubmittedAt;

    walkout.officeSection = {
      officeHistoricalNotes: existingNotes,
      officeSubmittedBy: submittedBy,
      officeSubmittedAt: submittedAt,
    };

    // Set only validated and conditionally required fields
    Object.keys(validation.cleanData).forEach((key) => {
      walkout.officeSection[key] = validation.cleanData[key];
    });

    // Add new note if provided
    if (newOfficeNote && newOfficeNote.trim() !== "") {
      walkout.officeSection.officeHistoricalNotes.push({
        note: newOfficeNote.trim(),
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }

    // IMPORTANT: formRefId is immutable - do NOT update it
    // submitToLC3 is also immutable - do NOT update it

    // Update metadata
    walkout.officeSection.officeLastUpdatedAt = new Date();
    walkout.lastUpdateOn = new Date();

    await walkout.save();

    const populatedWalkout = await Walkout.findById(id)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Office section updated successfully",
      data: populatedWalkout,
    });
  } catch (error) {
    console.error("Error updating office section:", error);
    res.status(500).json({
      success: false,
      message: "Error updating office section",
      error: error.message,
    });
  }
};

// ====================================
// LC3 SECTION OPERATIONS
// ====================================

// Submit/Update LC3 Section
exports.submitLc3Section = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the walkout
    const walkout = await Walkout.findById(id);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // Validate that office section has been submitted
    if (!walkout.officeSection || !walkout.officeSection.officeSubmittedAt) {
      return res.status(400).json({
        success: false,
        message: "Office section must be submitted before LC3 section",
      });
    }

    // Initialize lc3Section if it doesn't exist
    if (!walkout.lc3Section) {
      walkout.lc3Section = {};
    }

    // Extract LC3 data from request body
    const {
      ruleEngine,
      documentCheck,
      attachmentsCheck,
      patientPortionCheck,
      productionDetails,
      providerNotes,
      lc3Remarks,
      onHoldNote, // Single note to add to onHoldNotes array
    } = req.body;

    // Update Rule Engine if provided
    if (ruleEngine) {
      walkout.lc3Section.ruleEngine = {
        ...walkout.lc3Section.ruleEngine,
        ...ruleEngine,
      };
    }

    // Update Document Check if provided
    if (documentCheck) {
      walkout.lc3Section.documentCheck = {
        ...walkout.lc3Section.documentCheck,
        ...documentCheck,
      };
    }

    // Update Attachments Check if provided
    if (attachmentsCheck) {
      walkout.lc3Section.attachmentsCheck = {
        ...walkout.lc3Section.attachmentsCheck,
        ...attachmentsCheck,
      };
    }

    // Update Patient Portion Check if provided
    if (patientPortionCheck) {
      walkout.lc3Section.patientPortionCheck = {
        ...walkout.lc3Section.patientPortionCheck,
        ...patientPortionCheck,
      };
    }

    // Update Production Details if provided
    if (productionDetails) {
      walkout.lc3Section.productionDetails = {
        ...walkout.lc3Section.productionDetails,
        ...productionDetails,
      };
    }

    // Update Provider Notes if provided
    if (providerNotes) {
      walkout.lc3Section.providerNotes = {
        ...walkout.lc3Section.providerNotes,
        ...providerNotes,
      };
    }

    // Update LC3 Remarks if provided
    if (lc3Remarks !== undefined) {
      walkout.lc3Section.lc3Remarks = lc3Remarks;
    }

    // Add on-hold note if provided
    if (onHoldNote) {
      if (!walkout.lc3Section.onHoldNotes) {
        walkout.lc3Section.onHoldNotes = [];
      }
      walkout.lc3Section.onHoldNotes.push({
        note: onHoldNote,
        addedBy: userId,
        addedAt: new Date(),
      });
    }

    // Update submission metadata
    const isFirstSubmit = !walkout.lc3Section.lc3SubmittedAt;

    if (isFirstSubmit) {
      walkout.lc3Section.lc3SubmittedAt = new Date();
      walkout.lc3Section.lc3SubmittedBy = userId;
      walkout.walkoutStatus = "lc3_submitted";
    }

    walkout.lc3Section.lc3LastUpdatedAt = new Date();
    walkout.lc3Section.lc3LastUpdatedBy = userId;
    walkout.lastUpdateOn = new Date();

    // Save the walkout
    await walkout.save();

    res.status(200).json({
      success: true,
      message: isFirstSubmit
        ? "LC3 section submitted successfully"
        : "LC3 section updated successfully",
      data: walkout,
    });
  } catch (error) {
    console.error("Error submitting/updating LC3 section:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting/updating LC3 section",
      error: error.message,
    });
  }
};

// Delete walkout (soft delete)
exports.deleteWalkout = async (req, res) => {
  try {
    const walkout = await Walkout.findById(req.params.id);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    walkout.isActive = false;
    await walkout.save();

    res.status(200).json({
      success: true,
      message: "Walkout deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting walkout:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting walkout",
      error: error.message,
    });
  }
};
