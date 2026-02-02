const Walkout = require("../models/Walkout");
const PatientAppointment = require("../models/PatientAppointment");
const validateOfficeSection = require("../utils/validateOfficeSection");
// const { uploadToGoogleDrive } = require("../utils/driveUpload"); // Google Drive (deprecated)
const { uploadToS3 } = require("../utils/s3Upload"); // AWS S3 (new)

// Helper function to convert FormData string values to numbers
const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return value;
  const num = Number(value);
  return isNaN(num) ? value : num;
};

// Helper function to convert number to boolean (1 = true, 2/0 = false)
const toBoolean = (value) => {
  if (value === undefined || value === null || value === "") return value;
  const num = Number(value);
  if (isNaN(num)) return value;
  return num === 1; // 1 = true, anything else (2, 0) = false
};

// ====================================
// OFFICE SECTION OPERATIONS
// ====================================

// Submit Office Section
exports.submitOfficeSection = async (req, res) => {
  try {
    const {
      formRefId,
      appointmentInfo, // NEW: { patientId, dateOfService, officeName }
      extractedData, // NEW: Optional extracted data from image
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
      walkoutStatus, // Root level - from frontend (can update status)
      isOnHoldAddressed, // Root level - from frontend ("yes" or "no")
      pendingWith, // Root level - from frontend
    } = req.body;

    // ====================================
    // VALIDATION: Appointment Info
    // ====================================
    if (!appointmentInfo) {
      return res.status(400).json({
        success: false,
        message: "appointmentInfo is required",
        field: "appointmentInfo",
        tip: 'Send appointmentInfo as JSON string: {"patientId":"PAT-001","dateOfService":"2026-01-15","officeName":"Main Office"}',
      });
    }

    // Parse appointmentInfo if it's a string (from FormData)
    let parsedAppointmentInfo;
    try {
      parsedAppointmentInfo =
        typeof appointmentInfo === "string"
          ? JSON.parse(appointmentInfo)
          : appointmentInfo;
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "appointmentInfo must be a valid JSON string",
        field: "appointmentInfo",
        receivedValue: appointmentInfo,
        error: parseError.message,
      });
    }

    const { patientId, dateOfService, officeName } = parsedAppointmentInfo;

    if (!patientId || !dateOfService || !officeName) {
      return res.status(400).json({
        success: false,
        message:
          "appointmentInfo must contain patientId, dateOfService, and officeName",
        field: "appointmentInfo",
        receivedValue: parsedAppointmentInfo,
      });
    }

    // ====================================
    // VALIDATION LOGIC
    // ====================================

    // Convert string values to numbers (FormData sends everything as strings)
    const patientCameNum = toNumber(patientCame);
    const postOpZeroProductionNum = toNumber(postOpZeroProduction);
    const patientTypeNum = toNumber(patientType);
    const hasInsuranceNum = toNumber(hasInsurance);
    const insuranceTypeNum = toNumber(insuranceType);
    const googleReviewRequestNum = toNumber(googleReviewRequest);
    const expectedPatientPortionOfficeWONum = toNumber(
      expectedPatientPortionOfficeWO,
    );
    const patientPortionCollectedNum = toNumber(patientPortionCollected);
    const differenceInPatientPortionNum = toNumber(differenceInPatientPortion);
    const patientPortionPrimaryModeNum = toNumber(patientPortionPrimaryMode);
    const amountCollectedPrimaryModeNum = toNumber(amountCollectedPrimaryMode);
    const patientPortionSecondaryModeNum = toNumber(
      patientPortionSecondaryMode,
    );
    const amountCollectedSecondaryModeNum = toNumber(
      amountCollectedSecondaryMode,
    );
    const ruleEngineRunNum = toNumber(ruleEngineRun);
    const ruleEngineErrorNum = toNumber(ruleEngineError);
    const issuesFixedNum = toNumber(issuesFixed);
    const signedGeneralConsentNum = toNumber(signedGeneralConsent);
    const signedTreatmentConsentNum = toNumber(signedTreatmentConsent);
    const preAuthAvailableNum = toNumber(preAuthAvailable);
    const signedTxPlanNum = toNumber(signedTxPlan);
    const perioChartNum = toNumber(perioChart);
    const nvdNum = toNumber(nvd);
    const xRayPanoAttachedNum = toNumber(xRayPanoAttached);
    const majorServiceFormNum = toNumber(majorServiceForm);
    const routeSheetNum = toNumber(routeSheet);
    const prcUpdatedInRouteSheetNum = toNumber(prcUpdatedInRouteSheet);

    // Boolean/checkbox fields - convert string "true"/"false" to boolean
    const signedGeneralConsentBool =
      signedGeneralConsent === "true" || signedGeneralConsent === true;
    const signedTreatmentConsentBool =
      signedTreatmentConsent === "true" || signedTreatmentConsent === true;
    const preAuthAvailableBool =
      preAuthAvailable === "true" || preAuthAvailable === true;
    const signedTxPlanBool = signedTxPlan === "true" || signedTxPlan === true;
    const perioChartBool = perioChart === "true" || perioChart === true;
    const nvdBool = nvd === "true" || nvd === true;
    const xRayPanoAttachedBool =
      xRayPanoAttached === "true" || xRayPanoAttached === true;
    const majorServiceFormBool =
      majorServiceForm === "true" || majorServiceForm === true;
    const routeSheetBool = routeSheet === "true" || routeSheet === true;
    const prcUpdatedInRouteSheetBool =
      prcUpdatedInRouteSheet === "true" || prcUpdatedInRouteSheet === true;
    const narrativeBool = narrative === "true" || narrative === true;

    // Level 1: patientCame is always mandatory
    if (
      patientCameNum === undefined ||
      patientCameNum === null ||
      patientCameNum === "" ||
      isNaN(patientCameNum)
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
    if (patientCameNum !== 1 && patientCameNum !== 2) {
      return res.status(400).json({
        success: false,
        message: "patientCame must be either 1 (Yes) or 2 (No)",
        field: "patientCame",
        receivedValue: patientCame,
        receivedType: typeof patientCame,
      });
    }

    const officeData = {
      patientCame: patientCameNum,
    };

    let walkoutStatusDefault = "draft";
    let submitToLC3Time = null;

    // If patient didn't come (patientCame = 2)
    if (patientCameNum === 2) {
      walkoutStatusDefault = "patient_not_came";
      // Only save patientCame, rest will be undefined/default
    } else if (patientCameNum === 1) {
      // Patient came - validate other fields

      // Level 2: postOpZeroProduction is mandatory
      if (
        postOpZeroProductionNum === undefined ||
        postOpZeroProductionNum === null
      ) {
        return res.status(400).json({
          success: false,
          message: "postOpZeroProduction is required when patient came",
        });
      }
      officeData.postOpZeroProduction = postOpZeroProductionNum;

      // Level 3: patientType is mandatory
      if (patientTypeNum === undefined || patientTypeNum === null) {
        return res.status(400).json({
          success: false,
          message: "patientType is required when patient came",
        });
      }
      officeData.patientType = patientTypeNum;

      // Level 4: hasInsurance is mandatory
      if (hasInsuranceNum === undefined || hasInsuranceNum === null) {
        return res.status(400).json({
          success: false,
          message: "hasInsurance is required when patient came",
        });
      }
      officeData.hasInsurance = hasInsuranceNum;

      // Level 5: insuranceType (conditional)
      if (hasInsuranceNum === 1) {
        if (insuranceTypeNum === undefined || insuranceTypeNum === null) {
          return res.status(400).json({
            success: false,
            message: "insuranceType is required when patient has insurance",
          });
        }
        officeData.insuranceType = insuranceTypeNum;

        // Level 5b: insurance (conditional based on insuranceType)
        if (insuranceTypeNum === 2 || insuranceTypeNum === 6) {
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
      if (
        googleReviewRequestNum === undefined ||
        googleReviewRequestNum === null
      ) {
        return res.status(400).json({
          success: false,
          message: "googleReviewRequest is required",
        });
      }
      officeData.googleReviewRequest = googleReviewRequestNum;

      // Check if postOpZeroProduction = 1 (skip payment/document fields)
      if (postOpZeroProductionNum !== 1) {
        // Level 7: expectedPatientPortionOfficeWO is mandatory (can be 0)
        // Important: 0 is a valid value, so we only check for undefined/null/empty string
        if (
          expectedPatientPortionOfficeWONum === undefined ||
          expectedPatientPortionOfficeWONum === null ||
          (expectedPatientPortionOfficeWO === "" &&
            expectedPatientPortionOfficeWO !== 0)
        ) {
          return res.status(400).json({
            success: false,
            message: "expectedPatientPortionOfficeWO is required (can be 0)",
            tip: "Please enter expected patient portion amount. Zero (0) is allowed.",
          });
        }

        // Validate it's a valid number
        if (isNaN(expectedPatientPortionOfficeWONum)) {
          return res.status(400).json({
            success: false,
            message: "expectedPatientPortionOfficeWO must be a valid number",
            receivedValue: expectedPatientPortionOfficeWO,
            receivedType: typeof expectedPatientPortionOfficeWO,
          });
        }

        officeData.expectedPatientPortionOfficeWO =
          expectedPatientPortionOfficeWONum;

        // Level 8: patientPortionCollected (not mandatory, but 0 is valid)
        if (
          patientPortionCollectedNum !== undefined &&
          patientPortionCollectedNum !== null
        ) {
          officeData.patientPortionCollected = patientPortionCollectedNum;
        }

        // Level 9: differenceInPatientPortion (not mandatory, but 0 is valid)
        if (
          differenceInPatientPortionNum !== undefined &&
          differenceInPatientPortionNum !== null
        ) {
          officeData.differenceInPatientPortion = differenceInPatientPortionNum;
        }

        // Level 10: patientPortionPrimaryMode and amount
        if (
          patientPortionPrimaryModeNum !== undefined &&
          patientPortionPrimaryModeNum !== null &&
          patientPortionPrimaryMode !== ""
        ) {
          officeData.patientPortionPrimaryMode = patientPortionPrimaryModeNum;

          // If primary mode has value, amount is mandatory (0 is valid)
          if (
            amountCollectedPrimaryModeNum === undefined ||
            amountCollectedPrimaryModeNum === null ||
            (amountCollectedPrimaryMode === "" &&
              amountCollectedPrimaryMode !== 0)
          ) {
            return res.status(400).json({
              success: false,
              message:
                "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided (0 is valid)",
            });
          }
          officeData.amountCollectedPrimaryMode = amountCollectedPrimaryModeNum;
        }

        // Level 11: patientPortionSecondaryMode and amount
        if (
          patientPortionSecondaryModeNum !== undefined &&
          patientPortionSecondaryModeNum !== null &&
          patientPortionSecondaryMode !== ""
        ) {
          officeData.patientPortionSecondaryMode =
            patientPortionSecondaryModeNum;

          // If secondary mode has value, amount is mandatory (0 is valid)
          if (
            amountCollectedSecondaryModeNum === undefined ||
            amountCollectedSecondaryModeNum === null ||
            (amountCollectedSecondaryMode === "" &&
              amountCollectedSecondaryMode !== 0)
          ) {
            return res.status(400).json({
              success: false,
              message:
                "amountCollectedSecondaryMode is required when patientPortionSecondaryMode is provided (0 is valid)",
            });
          }
          officeData.amountCollectedSecondaryMode =
            amountCollectedSecondaryModeNum;
        }

        // Level 12: lastFourDigitsCheckForte (if mode = 4)
        const isPrimaryMode4 = patientPortionPrimaryModeNum === 4;
        const isSecondaryMode4 = patientPortionSecondaryModeNum === 4;

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
          differenceInPatientPortionNum !== undefined &&
          differenceInPatientPortionNum < 0
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
        if (ruleEngineRunNum === undefined || ruleEngineRunNum === null) {
          return res.status(400).json({
            success: false,
            message: "ruleEngineRun is required",
          });
        }
        officeData.ruleEngineRun = ruleEngineRunNum;

        // Level 15: ruleEngineError or ruleEngineNotRunReason
        if (ruleEngineRunNum === 1) {
          // ruleEngineError is mandatory
          if (ruleEngineErrorNum === undefined || ruleEngineErrorNum === null) {
            return res.status(400).json({
              success: false,
              message: "ruleEngineError is required when rule engine ran",
            });
          }
          officeData.ruleEngineError = ruleEngineErrorNum;

          // Level 15b: If ruleEngineError = 1, errorFixRemarks and issuesFixed mandatory
          if (ruleEngineErrorNum === 1) {
            if (!errorFixRemarks || errorFixRemarks.trim() === "") {
              return res.status(400).json({
                success: false,
                message:
                  "errorFixRemarks is required when ruleEngineError is 1",
              });
            }
            if (issuesFixedNum === undefined || issuesFixedNum === null) {
              return res.status(400).json({
                success: false,
                message: "issuesFixed is required when ruleEngineError is 1",
              });
            }
            officeData.errorFixRemarks = errorFixRemarks;
            officeData.issuesFixed = issuesFixedNum;
          }
        } else if (ruleEngineRunNum === 2) {
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
        officeData.signedGeneralConsent = signedGeneralConsentBool;

        if (signedTxPlan === undefined || signedTxPlan === null) {
          return res.status(400).json({
            success: false,
            message: "signedTxPlan is required",
          });
        }
        officeData.signedTxPlan = signedTxPlanBool;

        if (xRayPanoAttached === undefined || xRayPanoAttached === null) {
          return res.status(400).json({
            success: false,
            message: "xRayPanoAttached is required",
          });
        }
        officeData.xRayPanoAttached = xRayPanoAttachedBool;

        if (
          prcUpdatedInRouteSheet === undefined ||
          prcUpdatedInRouteSheet === null
        ) {
          return res.status(400).json({
            success: false,
            message: "prcUpdatedInRouteSheet is required",
          });
        }
        officeData.prcUpdatedInRouteSheet = prcUpdatedInRouteSheetBool;

        if (routeSheet === undefined || routeSheet === null) {
          return res.status(400).json({
            success: false,
            message: "routeSheet is required",
          });
        }
        officeData.routeSheet = routeSheetBool;

        // Optional boolean fields
        if (signedTreatmentConsent !== undefined)
          officeData.signedTreatmentConsent = signedTreatmentConsentBool;
        if (preAuthAvailable !== undefined)
          officeData.preAuthAvailable = preAuthAvailableBool;
        if (perioChart !== undefined) officeData.perioChart = perioChartBool;
        if (nvd !== undefined) officeData.nvd = nvdBool;
        if (majorServiceForm !== undefined)
          officeData.majorServiceForm = majorServiceFormBool;
        if (narrative !== undefined) officeData.narrative = narrativeBool;
      }

      // Set status to office_submitted and submitToLC3 time
      walkoutStatusDefault = "office_submitted";
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

    // Metadata (always set these)
    const currentTime = new Date();
    officeData.officeSubmittedBy = req.user._id;
    officeData.officeSubmittedAt = currentTime;
    officeData.officeLastUpdatedAt = currentTime;
    officeData.officeLastUpdatedBy = req.user._id;

    // First submission tracking (set only once, never updated)
    officeData.officeFirstSubmittedAt = currentTime;
    officeData.officeFirstSubmittedBy = req.user._id;

    // ====================================
    // CALCULATE isWalkoutSubmittedToLC3
    // ====================================
    // Logic: Set to "Yes" only if:
    // - patientCame = 1 (Yes) AND
    // - postOpZeroProduction = 2 (No)
    // Otherwise set to "No"
    let isWalkoutSubmittedToLC3 = "No";
    console.log("🔍 Checking isWalkoutSubmittedToLC3 conditions:");
    console.log(`   patientCame: ${officeData.patientCame} (type: ${typeof officeData.patientCame})`);
    console.log(`   postOpZeroProduction: ${officeData.postOpZeroProduction} (type: ${typeof officeData.postOpZeroProduction})`);
    if (officeData.patientCame === 1 && officeData.postOpZeroProduction === 2) {
      isWalkoutSubmittedToLC3 = "Yes";
      console.log("✅ Conditions matched! Setting isWalkoutSubmittedToLC3 = Yes");
    } else {
      console.log("❌ Conditions not matched. Setting isWalkoutSubmittedToLC3 = No");
    }

    // Validate formRefId if provided
    if (formRefId && typeof formRefId !== "string") {
      return res.status(400).json({
        success: false,
        message: "formRefId must be a string",
        receivedType: typeof formRefId,
      });
    }

    // ====================================
    // IMAGE UPLOADS TO AWS S3
    // ====================================
    let officeWalkoutSnipData = {};
    let checkImageData = {};

    // Handle Office Walkout Snip upload
    if (req.files && req.files.officeWalkoutSnip) {
      try {
        const file = req.files.officeWalkoutSnip[0];
        console.log("📤 Uploading office walkout snip to S3...");

        const uploadResult = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          parsedAppointmentInfo,
          "officeWalkoutSnip", // Folder type
        );

        officeWalkoutSnipData = {
          imageId: uploadResult.fileKey, // S3 key instead of Drive file ID
          fileName: uploadResult.fileName,
          uploadedAt: uploadResult.uploadedAt,
          extractedData: extractedData || undefined, // Use manually provided data if available
        };

        console.log(
          `✅ Office Walkout Snip uploaded. S3 Key: ${uploadResult.fileKey}`,
        );
      } catch (uploadError) {
        console.error("❌ Office Walkout Snip upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload Office Walkout Snip to S3",
          error: uploadError.message,
        });
      }
    } else if (extractedData) {
      // If no image but extractedData is provided
      officeWalkoutSnipData = {
        extractedData: extractedData,
      };
    }

    // Handle Check Image upload
    if (req.files && req.files.checkImage) {
      try {
        const file = req.files.checkImage[0];
        console.log("📤 Uploading check image to S3...");

        const uploadResult = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          parsedAppointmentInfo,
          "checkImage", // Folder type
        );

        checkImageData = {
          imageId: uploadResult.fileKey, // S3 key instead of Drive file ID
          fileName: uploadResult.fileName,
          uploadedAt: uploadResult.uploadedAt,
        };

        console.log(`✅ Check Image uploaded. S3 Key: ${uploadResult.fileKey}`);
      } catch (uploadError) {
        console.error("❌ Check Image upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload Check Image to S3",
          error: uploadError.message,
        });
      }
    }

    // Create walkout document
    const walkout = await Walkout.create({
      userId: req.user._id,
      formRefId: formRefId || undefined, // Set only if provided, immutable after this
      appointmentInfo: parsedAppointmentInfo, // NEW: Required appointment info
      officeWalkoutSnip: officeWalkoutSnipData, // NEW: Image data (if uploaded)
      checkImage: checkImageData, // NEW: Check image data (if uploaded)
      openTime: openTime || new Date(),
      submitToLC3: submitToLC3Time,
      lastUpdateOn: new Date(),
      officeSection: officeData,
      walkoutStatus: walkoutStatus || walkoutStatusDefault, // Use frontend value or calculated default
      isOnHoldAddressed: isOnHoldAddressed || undefined, // Root level - from frontend
      pendingWith: pendingWith || undefined, // Root level - from frontend
    });

    // ====================================
    // UPDATE APPOINTMENT isWalkoutSubmittedToLC3
    // ====================================
    if (formRefId) {
      try {
        console.log(`📝 Updating appointment ${formRefId} with isWalkoutSubmittedToLC3: ${isWalkoutSubmittedToLC3}`);
        await PatientAppointment.findByIdAndUpdate(formRefId, {
          isWalkoutSubmittedToLC3: isWalkoutSubmittedToLC3,
        });
        console.log(
          `✅ Updated appointment ${formRefId} - isWalkoutSubmittedToLC3: ${isWalkoutSubmittedToLC3}`,
        );
      } catch (updateError) {
        console.error(
          `⚠️ Failed to update appointment ${formRefId}:`,
          updateError.message,
        );
      }
    } else {
      console.log("⚠️ No formRefId provided, skipping appointment update");
    }

    const populatedWalkout = await Walkout.findById(walkout._id)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email");

    // ====================================
    // BACKGROUND AI EXTRACTION (if new image was uploaded)
    // ====================================
    if (
      req.files &&
      req.files.officeWalkoutSnip &&
      officeWalkoutSnipData.imageId
    ) {
      const walkoutId = walkout._id;
      const s3Key = officeWalkoutSnipData.imageId;

      // Run AI extraction in background (don't await)
      console.log(
        `🤖 Starting background AI extraction for walkout ${walkoutId}...`,
      );

      // Fire and forget - this runs in background
      (async () => {
        try {
          const {
            extractOfficeWalkoutData,
          } = require("./officeWalkoutImageAiController");

          console.log(
            `🤖 Extracting data from office walkout image (${s3Key})...`,
          );

          const extractedJson = await extractOfficeWalkoutData(s3Key);
          const aiExtractedData = JSON.stringify(extractedJson);

          // Update the walkout document with extracted data
          await Walkout.findByIdAndUpdate(walkoutId, {
            "officeWalkoutSnip.extractedData": aiExtractedData,
          });

          console.log(
            `✅ Background AI extraction completed for walkout ${walkoutId} - extracted ${extractedJson.data?.length || 0} rows`,
          );
        } catch (aiError) {
          console.error(
            `⚠️ Background AI extraction failed for walkout ${walkoutId}:`,
            aiError.message,
          );
          // Don't throw error - just log it
        }
      })();
    }

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

    // Convert FormData string values to proper types
    const convertedBody = {
      ...req.body,
      // Radio button fields - convert to Number
      patientCame: toNumber(req.body.patientCame),
      postOpZeroProduction: toNumber(req.body.postOpZeroProduction),
      patientType: toNumber(req.body.patientType),
      hasInsurance: toNumber(req.body.hasInsurance),
      insuranceType: toNumber(req.body.insuranceType),
      insurance: toNumber(req.body.insurance),
      googleReviewRequest: toNumber(req.body.googleReviewRequest),
      ruleEngineRun: toNumber(req.body.ruleEngineRun),
      ruleEngineError: toNumber(req.body.ruleEngineError),
      issuesFixed: toNumber(req.body.issuesFixed),

      // Dropdown fields - convert to Number
      patientPortionPrimaryMode: toNumber(req.body.patientPortionPrimaryMode),
      patientPortionSecondaryMode: toNumber(
        req.body.patientPortionSecondaryMode,
      ),
      reasonLessCollection: toNumber(req.body.reasonLessCollection),
      ruleEngineNotRunReason: toNumber(req.body.ruleEngineNotRunReason),

      // Amount/Number fields - convert to Number
      expectedPatientPortionOfficeWO: toNumber(
        req.body.expectedPatientPortionOfficeWO,
      ),
      patientPortionCollected: toNumber(req.body.patientPortionCollected),
      differenceInPatientPortion: toNumber(req.body.differenceInPatientPortion),
      amountCollectedPrimaryMode: toNumber(req.body.amountCollectedPrimaryMode),
      amountCollectedSecondaryMode: toNumber(
        req.body.amountCollectedSecondaryMode,
      ),
      lastFourDigitsCheckForte: toNumber(req.body.lastFourDigitsCheckForte),

      // Boolean fields - convert "true"/"false" strings to boolean
      signedGeneralConsent:
        req.body.signedGeneralConsent === "true" ||
        req.body.signedGeneralConsent === true,
      signedTreatmentConsent:
        req.body.signedTreatmentConsent === "true" ||
        req.body.signedTreatmentConsent === true,
      preAuthAvailable:
        req.body.preAuthAvailable === "true" ||
        req.body.preAuthAvailable === true,
      signedTxPlan:
        req.body.signedTxPlan === "true" || req.body.signedTxPlan === true,
      perioChart:
        req.body.perioChart === "true" || req.body.perioChart === true,
      nvd: req.body.nvd === "true" || req.body.nvd === true,
      xRayPanoAttached:
        req.body.xRayPanoAttached === "true" ||
        req.body.xRayPanoAttached === true,
      majorServiceForm:
        req.body.majorServiceForm === "true" ||
        req.body.majorServiceForm === true,
      routeSheet:
        req.body.routeSheet === "true" || req.body.routeSheet === true,
      prcUpdatedInRouteSheet:
        req.body.prcUpdatedInRouteSheet === "true" ||
        req.body.prcUpdatedInRouteSheet === true,
      narrative: req.body.narrative === "true" || req.body.narrative === true,

      // String fields - keep as is
      errorFixRemarks: req.body.errorFixRemarks,
      narrative: req.body.narrative,
      newOfficeNote: req.body.newOfficeNote,
      extractedData: req.body.extractedData,
      walkoutStatus: req.body.walkoutStatus, // Root level
      isOnHoldAddressed: req.body.isOnHoldAddressed, // Root level
      pendingWith: req.body.pendingWith, // Root level
    };

    const {
      extractedData,
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
      walkoutStatus, // Root level
      isOnHoldAddressed, // Root level
      pendingWith, // Root level
    } = convertedBody;

    const walkout = await Walkout.findById(id);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // DEBUG: Check what's in req.body and req.file
    console.log("=== UPDATE OFFICE SECTION DEBUG ===");
    console.log("req.file:", req.file ? "File present" : "No file");
    console.log("req.body keys:", Object.keys(req.body));
    console.log("patientCame value:", req.body.patientCame);
    console.log("patientCame type:", typeof req.body.patientCame);
    console.log("===================================");

    // ====================================
    // VALIDATION LOGIC WITH BATCH ERRORS
    // ====================================

    const validation = validateOfficeSection(convertedBody);

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
    // IMPORTANT: Preserve first submission tracking (never updated)
    const firstSubmittedAt = walkout.officeSection.officeFirstSubmittedAt;
    const firstSubmittedBy = walkout.officeSection.officeFirstSubmittedBy;

    walkout.officeSection = {
      officeHistoricalNotes: existingNotes,
      officeSubmittedBy: submittedBy,
      officeSubmittedAt: submittedAt,
      officeFirstSubmittedAt: firstSubmittedAt, // Preserve
      officeFirstSubmittedBy: firstSubmittedBy, // Preserve
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
    // appointmentInfo is also immutable - do NOT update it

    // ====================================
    // IMAGE UPLOADS TO GOOGLE DRIVE (if new images provided)
    // ====================================

    // Handle Office Walkout Snip update
    let newImageUploaded = false;
    let newImageS3Key = null;

    if (req.files && req.files.officeWalkoutSnip) {
      try {
        const file = req.files.officeWalkoutSnip[0];
        console.log("📤 Uploading new office walkout snip to S3...");

        const uploadResult = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          walkout.appointmentInfo,
          "officeWalkoutSnip",
        );

        // Update image data (without AI extracted data for now)
        walkout.officeWalkoutSnip.imageId = uploadResult.fileKey;
        walkout.officeWalkoutSnip.fileName = uploadResult.fileName;
        walkout.officeWalkoutSnip.uploadedAt = uploadResult.uploadedAt;
        walkout.officeWalkoutSnip.extractedData = undefined; // Will be updated in background

        newImageUploaded = true;
        newImageS3Key = uploadResult.fileKey;

        console.log(
          `✅ Office Walkout Snip updated. S3 Key: ${uploadResult.fileKey}`,
        );
      } catch (uploadError) {
        console.error("❌ Office Walkout Snip upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload Office Walkout Snip to S3",
          error: uploadError.message,
        });
      }
    }

    // Handle Check Image update
    if (req.files && req.files.checkImage) {
      try {
        const file = req.files.checkImage[0];
        console.log("📤 Uploading new check image to S3...");

        const uploadResult = await uploadToS3(
          file.buffer,
          file.originalname,
          file.mimetype,
          walkout.appointmentInfo,
          "checkImage",
        );

        // Update image data
        walkout.checkImage.imageId = uploadResult.fileKey; // S3 key
        walkout.checkImage.fileName = uploadResult.fileName;
        walkout.checkImage.uploadedAt = uploadResult.uploadedAt;

        console.log(`✅ Check Image updated. S3 Key: ${uploadResult.fileKey}`);
      } catch (uploadError) {
        console.error("❌ Check Image upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload Check Image to S3",
          error: uploadError.message,
        });
      }
    }

    // Update extractedData if provided (even without new image)
    if (extractedData !== undefined) {
      walkout.officeWalkoutSnip.extractedData = extractedData;
    }

    // Update metadata
    walkout.officeSection.officeLastUpdatedAt = new Date();
    walkout.officeSection.officeLastUpdatedBy = req.user._id;
    walkout.lastUpdateOn = new Date();

    // ====================================
    // CALCULATE isWalkoutSubmittedToLC3
    // ====================================
    // Recalculate based on current values of patientCame and postOpZeroProduction
    let isWalkoutSubmittedToLC3 = "No";
    console.log("🔍 UPDATE - Checking isWalkoutSubmittedToLC3 conditions:");
    console.log(`   patientCame: ${walkout.officeSection.patientCame} (type: ${typeof walkout.officeSection.patientCame})`);
    console.log(`   postOpZeroProduction: ${walkout.officeSection.postOpZeroProduction} (type: ${typeof walkout.officeSection.postOpZeroProduction})`);
    if (
      walkout.officeSection.patientCame === 1 &&
      walkout.officeSection.postOpZeroProduction === 2
    ) {
      isWalkoutSubmittedToLC3 = "Yes";
      console.log("✅ UPDATE - Conditions matched! Setting isWalkoutSubmittedToLC3 = Yes");
    } else {
      console.log("❌ UPDATE - Conditions not matched. Setting isWalkoutSubmittedToLC3 = No");
    }

    // ====================================
    // UPDATE APPOINTMENT isWalkoutSubmittedToLC3
    // ====================================
    if (walkout.formRefId) {
      try {
        console.log(`📝 UPDATE - Updating appointment ${walkout.formRefId} with isWalkoutSubmittedToLC3: ${isWalkoutSubmittedToLC3}`);
        await PatientAppointment.findByIdAndUpdate(walkout.formRefId, {
          isWalkoutSubmittedToLC3: isWalkoutSubmittedToLC3,
        });
        console.log(
          `✅ Updated appointment ${walkout.formRefId} - isWalkoutSubmittedToLC3: ${isWalkoutSubmittedToLC3}`,
        );
      } catch (updateError) {
        console.error(
          `⚠️ Failed to update appointment ${walkout.formRefId}:`,
          updateError.message,
        );
      }
    } else {
      console.log("⚠️ UPDATE - No formRefId in walkout, skipping appointment update");
    }

    // Update root level fields if provided
    if (walkoutStatus !== undefined) {
      walkout.walkoutStatus = walkoutStatus;
    }
    if (isOnHoldAddressed !== undefined) {
      walkout.isOnHoldAddressed = isOnHoldAddressed;
    }
    if (pendingWith !== undefined) {
      walkout.pendingWith = pendingWith;
    }

    await walkout.save();

    const populatedWalkout = await Walkout.findById(id)
      .populate("userId", "name email")
      .populate("officeSection.officeSubmittedBy", "name email")
      .populate("officeSection.officeHistoricalNotes.addedBy", "name email");

    // ====================================
    // BACKGROUND AI EXTRACTION (if new image was uploaded)
    // ====================================
    if (newImageUploaded && newImageS3Key) {
      console.log(`🤖 Starting background AI extraction for walkout ${id}...`);

      // Fire and forget - this runs in background
      (async () => {
        try {
          const {
            extractOfficeWalkoutData,
          } = require("./officeWalkoutImageAiController");

          console.log(
            `🤖 Extracting data from new office walkout image (${newImageS3Key})...`,
          );

          const extractedJson = await extractOfficeWalkoutData(newImageS3Key);
          const aiExtractedData = JSON.stringify(extractedJson);

          // Update the walkout document with extracted data
          await Walkout.findByIdAndUpdate(id, {
            "officeWalkoutSnip.extractedData": aiExtractedData,
          });

          console.log(
            `✅ Background AI extraction completed for walkout ${id} - extracted ${extractedJson.data?.length || 0} rows`,
          );
        } catch (aiError) {
          console.error(
            `⚠️ Background AI extraction failed for walkout ${id}:`,
            aiError.message,
          );
          // Don't throw error - just log it
        }
      })();
    }

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
    console.log("🔷 LC3 Section Submit - Starting...");
    console.log("📋 Request Params:", req.params);
    console.log("📋 Request Body Keys:", Object.keys(req.body));
    console.log(
      "📋 Request File:",
      req.file ? `Yes (${req.file.originalname})` : "No",
    );

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
    // Parse JSON strings from FormData
    const {
      ruleEngine: ruleEngineRaw,
      documentCheck: documentCheckRaw,
      attachmentsCheck: attachmentsCheckRaw,
      patientPortionCheck: patientPortionCheckRaw,
      productionDetails: productionDetailsRaw,
      providerNotes: providerNotesRaw,
      lc3Remarks,
      onHoldNote,
      walkoutStatus, // Root level - from frontend (can update status)
      isOnHoldAddressed, // Root level - from frontend ("yes" or "no")
      pendingWith, // Root level - from frontend
      isCompleted, // NEW: Flag to indicate if LC3 is being marked as completed
      sessionStartDateTime, // NEW: Session tracking - start time from frontend
      sessionEndDateTime, // NEW: Session tracking - end time from frontend (when submitting)
    } = req.body;

    // Parse JSON fields if they are strings
    const ruleEngine = ruleEngineRaw
      ? typeof ruleEngineRaw === "string"
        ? JSON.parse(ruleEngineRaw)
        : ruleEngineRaw
      : null;

    const documentCheck = documentCheckRaw
      ? typeof documentCheckRaw === "string"
        ? JSON.parse(documentCheckRaw)
        : documentCheckRaw
      : null;

    const attachmentsCheck = attachmentsCheckRaw
      ? typeof attachmentsCheckRaw === "string"
        ? JSON.parse(attachmentsCheckRaw)
        : attachmentsCheckRaw
      : null;

    const patientPortionCheck = patientPortionCheckRaw
      ? typeof patientPortionCheckRaw === "string"
        ? JSON.parse(patientPortionCheckRaw)
        : patientPortionCheckRaw
      : null;

    const productionDetails = productionDetailsRaw
      ? typeof productionDetailsRaw === "string"
        ? JSON.parse(productionDetailsRaw)
        : productionDetailsRaw
      : null;

    const providerNotes = providerNotesRaw
      ? typeof providerNotesRaw === "string"
        ? JSON.parse(providerNotesRaw)
        : providerNotesRaw
      : null;

    console.log("📝 LC3 Section Data Received:");
    console.log("  - ruleEngine:", ruleEngine ? "✓" : "✗");
    console.log("  - documentCheck:", documentCheck ? "✓" : "✗");
    console.log("  - attachmentsCheck:", attachmentsCheck ? "✓" : "✗");
    console.log("  - patientPortionCheck:", patientPortionCheck ? "✓" : "✗");
    console.log("  - productionDetails:", productionDetails ? "✓" : "✗");
    console.log("  - providerNotes:", providerNotes ? "✓" : "✗");
    console.log("  - lc3Remarks:", lc3Remarks ? "✓" : "✗");
    console.log("  - onHoldNote:", onHoldNote ? "✓" : "✗");

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

    // ====================================
    // SESSION TRACKING (Time tracking for LC3 work)
    // ====================================
    if (sessionStartDateTime && sessionEndDateTime) {
      // Initialize sessions if doesn't exist
      if (!walkout.lc3Section.sessions) {
        walkout.lc3Section.sessions = {
          list: [],
          total: 0,
        };
      }

      const startTime = new Date(sessionStartDateTime);
      const endTime = new Date(sessionEndDateTime);

      // Calculate duration in seconds
      const durationSeconds = Math.floor((endTime - startTime) / 1000);

      // Create new session object
      const newSession = {
        user: userId,
        startDateTime: startTime,
        endDateTime: endTime,
        duration: durationSeconds,
      };

      // Add session to list
      walkout.lc3Section.sessions.list.push(newSession);

      // Update total duration
      walkout.lc3Section.sessions.total =
        (walkout.lc3Section.sessions.total || 0) + durationSeconds;

      console.log(
        `⏱️ Session tracked: ${durationSeconds}s (Total: ${walkout.lc3Section.sessions.total}s)`,
      );
    }

    // ====================================
    // LC3 WALKOUT IMAGE UPLOAD TO S3 (if provided)
    // ====================================
    console.log("🔍 Checking for LC3 image upload...");
    console.log("📋 req.file exists:", !!req.file);
    console.log("📋 req.files exists:", !!req.files);
    if (req.file) {
      console.log("📋 req.file details:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    }

    let lc3ImageUploaded = false;
    let lc3ImageS3Key = null;

    if (req.file) {
      try {
        console.log("📤 Uploading LC3 walkout image to S3...");

        const { uploadToS3 } = require("../utils/s3Upload");

        const uploadResult = await uploadToS3(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          walkout.appointmentInfo,
          "lc3WalkoutImage", // Folder type
        );

        // Update LC3 image data (without AI extracted data for now)
        walkout.lc3WalkoutImage = {
          imageId: uploadResult.fileKey, // S3 key
          fileName: uploadResult.fileName,
          uploadedAt: uploadResult.uploadedAt,
          extractedData: undefined, // Will be updated in background
        };

        lc3ImageUploaded = true;
        lc3ImageS3Key = uploadResult.fileKey;

        console.log(
          `✅ LC3 Walkout Image uploaded. S3 Key: ${uploadResult.fileKey}`,
        );
      } catch (uploadError) {
        console.error("❌ LC3 Walkout Image upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload LC3 Walkout Image to S3",
          error: uploadError.message,
        });
      }
    }

    // Update submission metadata
    const isFirstSubmit = !walkout.lc3Section.lc3SubmittedAt;
    const currentTime = new Date();

    if (isFirstSubmit) {
      walkout.lc3Section.lc3SubmittedAt = currentTime;
      walkout.lc3Section.lc3SubmittedBy = userId;
      walkout.walkoutStatus = "lc3_submitted";
    }

    walkout.lc3Section.lc3LastUpdatedAt = currentTime;
    walkout.lc3Section.lc3LastUpdatedBy = userId;
    walkout.lastUpdateOn = currentTime;

    // Handle LC3 completion (set only once, never updated after that)
    if (isCompleted === "true" || isCompleted === true) {
      // Only set if not already completed
      if (!walkout.lc3Section.lc3CompletedAt) {
        walkout.lc3Section.lc3CompletedAt = currentTime;
        walkout.lc3Section.lc3CompletedBy = userId;
      }
    }

    // Update root level fields if provided
    if (walkoutStatus !== undefined) {
      walkout.walkoutStatus = walkoutStatus;
    }
    if (isOnHoldAddressed !== undefined) {
      walkout.isOnHoldAddressed = isOnHoldAddressed;
    }
    if (pendingWith !== undefined) {
      walkout.pendingWith = pendingWith;
    }

    // Save the walkout
    await walkout.save();

    // ====================================
    // BACKGROUND AI EXTRACTION (if new LC3 image was uploaded)
    // ====================================
    if (lc3ImageUploaded && lc3ImageS3Key) {
      console.log(
        `🤖 Starting background AI extraction for LC3 walkout ${id}...`,
      );

      // Fire and forget - this runs in background
      (async () => {
        try {
          const {
            extractLc3WalkoutData,
          } = require("./lc3WalkoutImageAiController");

          console.log(
            `🤖 Extracting data from LC3 walkout image (${lc3ImageS3Key})...`,
          );

          const extractedJson = await extractLc3WalkoutData(lc3ImageS3Key);
          const aiExtractedData = JSON.stringify(extractedJson);

          // Update the walkout document with extracted data
          await Walkout.findByIdAndUpdate(id, {
            "lc3WalkoutImage.extractedData": aiExtractedData,
          });

          console.log(
            `✅ Background AI extraction completed for LC3 walkout ${id} - extracted ${extractedJson.data?.length || 0} rows`,
          );
        } catch (aiError) {
          console.error(
            `⚠️ Background AI extraction failed for LC3 walkout ${id}:`,
            aiError.message,
          );
          // Don't throw error - just log it
        }
      })();
    }

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

// ====================================
// IMAGE OPERATIONS
// ====================================

// Serve image by imageId directly
exports.serveImageByImageId = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { getFileFromS3 } = require("../utils/s3Upload");

    console.log(`🖼️ Fetching image with ID: ${imageId}`);

    // Check if this is a legacy Google Drive ID (no slashes, alphanumeric format)
    const isGoogleDriveId =
      !imageId.includes("/") && /^[a-zA-Z0-9_-]+$/.test(imageId);

    if (isGoogleDriveId) {
      console.log(`⚠️ Legacy Google Drive file ID detected: ${imageId}`);
      return res.status(410).json({
        success: false,
        message:
          "This image was uploaded to Google Drive and is no longer accessible. Please re-upload the image.",
        errorCode: "LEGACY_GOOGLE_DRIVE_IMAGE",
      });
    }

    // Fetch file from S3 (imageId is S3 key)
    const buffer = await getFileFromS3(imageId);

    // Extract file extension and determine MIME type
    const extension = imageId.split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
    };
    const mimeType = mimeTypes[extension] || "application/octet-stream";

    // Extract filename from S3 key
    const fileName = imageId.split("/").pop();

    // Set appropriate headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour

    // Send file buffer
    res.send(buffer);

    console.log(`✅ Image served successfully: ${fileName}`);
  } catch (error) {
    console.error("❌ Error serving image from S3:", error);

    if (
      error.message.includes("not found") ||
      error.message.includes("NoSuchKey")
    ) {
      return res.status(404).json({
        success: false,
        message: "Image not found in S3 storage",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve image from S3",
      error: error.message,
    });
  }
};

// Serve image from S3 (by walkout ID - legacy endpoint)
exports.serveWalkoutImage = async (req, res) => {
  try {
    const { id } = req.params; // walkout ID
    const { getFileFromS3 } = require("../utils/s3Upload");

    // Find walkout
    const walkout = await Walkout.findById(id);

    if (!walkout) {
      return res.status(404).json({
        success: false,
        message: "Walkout not found",
      });
    }

    // Check if image exists
    if (!walkout.officeWalkoutSnip || !walkout.officeWalkoutSnip.imageId) {
      return res.status(404).json({
        success: false,
        message: "No image found for this walkout",
      });
    }

    const imageId = walkout.officeWalkoutSnip.imageId; // S3 key

    // Check if this is a legacy Google Drive ID
    const isGoogleDriveId =
      !imageId.includes("/") && /^[a-zA-Z0-9_-]+$/.test(imageId);

    if (isGoogleDriveId) {
      console.log(
        `⚠️ Legacy Google Drive file ID detected for walkout ${id}: ${imageId}`,
      );
      return res.status(410).json({
        success: false,
        message:
          "This image was uploaded to Google Drive and is no longer accessible. Please re-upload the image.",
        errorCode: "LEGACY_GOOGLE_DRIVE_IMAGE",
      });
    }

    // Get image from S3
    console.log(`📥 Fetching image from S3: ${imageId}`);
    const buffer = await getFileFromS3(imageId);

    // Extract file extension and determine MIME type
    const extension = imageId.split(".").pop().toLowerCase();
    const mimeTypes = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
    };
    const mimeType = mimeTypes[extension] || "application/octet-stream";
    const fileName = imageId.split("/").pop();

    // Set response headers
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour

    // Send image buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error serving walkout image:", error);
    res.status(500).json({
      success: false,
      message: "Error serving image from S3",
      error: error.message,
    });
  }
};

// ============================================
// Get Presigned URL for S3 Image (OPTIONAL - for better performance)
// ============================================
exports.getImagePresignedUrl = async (req, res) => {
  try {
    const { imageId } = req.params;
    const { getPresignedUrl } = require("../utils/s3Upload");

    console.log(`🔗 Generating presigned URL for S3 key: ${imageId}`);

    // Generate presigned URL valid for 1 hour
    const url = await getPresignedUrl(imageId, 3600);

    res.status(200).json({
      success: true,
      url: url,
      expiresIn: 3600, // seconds
    });

    console.log(`✅ Presigned URL generated successfully`);
  } catch (error) {
    console.error("❌ Error generating presigned URL:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate image URL",
      error: error.message,
    });
  }
};
