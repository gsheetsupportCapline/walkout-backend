/**
 * Validate Office Section Data with Batch Error Collection
 * Exact same validation as submitOfficeSection but collects all errors
 * Returns: { isValid: boolean, errors: array, cleanData: object }
 */

const validateOfficeSection = (data) => {
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
  } = data;

  const errors = [];
  const cleanData = {};

  // ====================================
  // Level 1: patientCame is always mandatory
  // ====================================
  if (patientCame === undefined || patientCame === null || patientCame === "") {
    errors.push({
      field: "patientCame",
      label: "Patient Came",
      message: "Patient Came is required",
    });
    // Return early as we can't proceed without this
    return { isValid: false, errors, cleanData: null };
  }

  // Validate patientCame is a valid number
  if (
    typeof patientCame !== "number" ||
    (patientCame !== 1 && patientCame !== 2)
  ) {
    errors.push({
      field: "patientCame",
      label: "Patient Came",
      message: "Patient Came must be either 1 (Yes) or 2 (No)",
    });
    return { isValid: false, errors, cleanData: null };
  }

  cleanData.patientCame = patientCame;

  // If patient didn't come (patientCame = 2), only save patientCame
  if (patientCame === 2) {
    return { isValid: true, errors: [], cleanData };
  }

  // ====================================
  // Patient came (patientCame = 1) - validate ALL other fields
  // ====================================

  // Level 2: postOpZeroProduction is mandatory
  if (postOpZeroProduction === undefined || postOpZeroProduction === null) {
    errors.push({
      field: "postOpZeroProduction",
      label: "Post Op Zero Production",
      message: "Post Op Zero Production is required when patient came",
    });
  } else {
    cleanData.postOpZeroProduction = postOpZeroProduction;
  }

  // Level 3: patientType is mandatory
  if (patientType === undefined || patientType === null) {
    errors.push({
      field: "patientType",
      label: "Patient Type",
      message: "Patient Type is required when patient came",
    });
  } else {
    cleanData.patientType = patientType;
  }

  // Level 4: hasInsurance is mandatory
  if (hasInsurance === undefined || hasInsurance === null) {
    errors.push({
      field: "hasInsurance",
      label: "Has Insurance",
      message: "Has Insurance is required when patient came",
    });
  } else {
    cleanData.hasInsurance = hasInsurance;

    // Level 5: insuranceType (conditional on hasInsurance = 1)
    if (hasInsurance === 1) {
      if (insuranceType === undefined || insuranceType === null) {
        errors.push({
          field: "insuranceType",
          label: "Insurance Type",
          message: "Insurance Type is required when patient has insurance",
        });
      } else {
        cleanData.insuranceType = insuranceType;

        // Level 5b: insurance (conditional on insuranceType = 2 or 6)
        if (insuranceType === 2 || insuranceType === 6) {
          if (insurance === undefined || insurance === null) {
            errors.push({
              field: "insurance",
              label: "Insurance",
              message: "Insurance is required for selected insurance type",
            });
          } else {
            cleanData.insurance = insurance;
          }
        }
      }
    }
  }

  // Level 6: googleReviewRequest is mandatory
  if (googleReviewRequest === undefined || googleReviewRequest === null) {
    errors.push({
      field: "googleReviewRequest",
      label: "Google Review Request",
      message: "Google Review Request is required",
    });
  } else {
    cleanData.googleReviewRequest = googleReviewRequest;
  }

  // ====================================
  // Check if postOpZeroProduction = 1 (skip payment/document fields)
  // ====================================
  if (postOpZeroProduction !== 1) {
    // Level 7: expectedPatientPortionOfficeWO is mandatory (can be 0)
    if (
      expectedPatientPortionOfficeWO === undefined ||
      expectedPatientPortionOfficeWO === null ||
      expectedPatientPortionOfficeWO === ""
    ) {
      errors.push({
        field: "expectedPatientPortionOfficeWO",
        label: "Expected Patient Portion as per Office WO",
        message:
          "Expected Patient Portion as per Office WO is required (0 is allowed)",
      });
    } else if (
      typeof expectedPatientPortionOfficeWO !== "number" ||
      isNaN(expectedPatientPortionOfficeWO)
    ) {
      errors.push({
        field: "expectedPatientPortionOfficeWO",
        label: "Expected Patient Portion as per Office WO",
        message: "Expected Patient Portion must be a valid number",
      });
    } else {
      cleanData.expectedPatientPortionOfficeWO = expectedPatientPortionOfficeWO;
    }

    // Level 8: patientPortionCollected (not mandatory but save if provided)
    if (
      patientPortionCollected !== undefined &&
      patientPortionCollected !== null &&
      patientPortionCollected !== ""
    ) {
      cleanData.patientPortionCollected = patientPortionCollected;
    }

    // Level 9: differenceInPatientPortion (not mandatory but save if provided)
    if (
      differenceInPatientPortion !== undefined &&
      differenceInPatientPortion !== null &&
      differenceInPatientPortion !== ""
    ) {
      cleanData.differenceInPatientPortion = differenceInPatientPortion;
    }

    // Level 10: patientPortionPrimaryMode and amount (conditional)
    if (
      patientPortionPrimaryMode !== undefined &&
      patientPortionPrimaryMode !== null &&
      patientPortionPrimaryMode !== ""
    ) {
      cleanData.patientPortionPrimaryMode = patientPortionPrimaryMode;

      // If primary mode has value, amount is mandatory
      if (
        amountCollectedPrimaryMode === undefined ||
        amountCollectedPrimaryMode === null ||
        amountCollectedPrimaryMode === ""
      ) {
        errors.push({
          field: "amountCollectedPrimaryMode",
          label: "Amount Collected (Primary Mode)",
          message:
            "Amount Collected (Primary Mode) is required when payment mode is selected",
        });
      } else {
        cleanData.amountCollectedPrimaryMode = amountCollectedPrimaryMode;
      }
    }

    // Level 11: patientPortionSecondaryMode and amount (conditional)
    if (
      patientPortionSecondaryMode !== undefined &&
      patientPortionSecondaryMode !== null &&
      patientPortionSecondaryMode !== ""
    ) {
      cleanData.patientPortionSecondaryMode = patientPortionSecondaryMode;

      // If secondary mode has value, amount is mandatory
      if (
        amountCollectedSecondaryMode === undefined ||
        amountCollectedSecondaryMode === null ||
        amountCollectedSecondaryMode === ""
      ) {
        errors.push({
          field: "amountCollectedSecondaryMode",
          label: "Amount Collected (Secondary Mode)",
          message:
            "Amount Collected (Secondary Mode) is required when payment mode is selected",
        });
      } else {
        cleanData.amountCollectedSecondaryMode = amountCollectedSecondaryMode;
      }
    }

    // Level 12: lastFourDigitsCheckForte (if mode = 4 - Personal Check)
    const isPrimaryMode4 = patientPortionPrimaryMode === 4;
    const isSecondaryMode4 = patientPortionSecondaryMode === 4;

    if (isPrimaryMode4 || isSecondaryMode4) {
      if (
        lastFourDigitsCheckForte === undefined ||
        lastFourDigitsCheckForte === null ||
        lastFourDigitsCheckForte === ""
      ) {
        errors.push({
          field: "lastFourDigitsCheckForte",
          label: "Last 4 Digits of Check (Forte)",
          message:
            "Last 4 Digits of Check is required when payment mode is Personal Check (4)",
        });
      } else {
        cleanData.lastFourDigitsCheckForte = lastFourDigitsCheckForte;
      }
    }
    // IMPORTANT: If mode is NOT 4, don't save lastFourDigitsCheckForte even if provided

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
        errors.push({
          field: "reasonLessCollection",
          label: "Reason for Less Collection",
          message:
            "Reason for Less Collection is required when collected amount is less than expected",
        });
      } else {
        cleanData.reasonLessCollection = reasonLessCollection;
      }
    }

    // Level 14: ruleEngineRun is mandatory
    if (ruleEngineRun === undefined || ruleEngineRun === null) {
      errors.push({
        field: "ruleEngineRun",
        label: "Rule Engine Run",
        message: "Rule Engine Run is required",
      });
    } else {
      cleanData.ruleEngineRun = ruleEngineRun;

      // Level 15: ruleEngineError or ruleEngineNotRunReason (conditional on ruleEngineRun)
      if (ruleEngineRun === 1) {
        // ruleEngineError is mandatory
        if (ruleEngineError === undefined || ruleEngineError === null) {
          errors.push({
            field: "ruleEngineError",
            label: "Rule Engine Error",
            message: "Rule Engine Error is required when rule engine ran",
          });
        } else {
          cleanData.ruleEngineError = ruleEngineError;

          // Level 15b: If ruleEngineError = 1, errorFixRemarks and issuesFixed mandatory
          if (ruleEngineError === 1) {
            if (!errorFixRemarks || errorFixRemarks.trim() === "") {
              errors.push({
                field: "errorFixRemarks",
                label: "Error Fix Remarks",
                message:
                  "Error Fix Remarks is required when rule engine has error",
              });
            } else {
              cleanData.errorFixRemarks = errorFixRemarks;
            }

            if (issuesFixed === undefined || issuesFixed === null) {
              errors.push({
                field: "issuesFixed",
                label: "Issues Fixed",
                message: "Issues Fixed is required when rule engine has error",
              });
            } else {
              cleanData.issuesFixed = issuesFixed;
            }
          }
        }
      } else if (ruleEngineRun === 2) {
        // ruleEngineNotRunReason is mandatory
        if (
          ruleEngineNotRunReason === undefined ||
          ruleEngineNotRunReason === null
        ) {
          errors.push({
            field: "ruleEngineNotRunReason",
            label: "Rule Engine Not Run Reason",
            message:
              "Rule Engine Not Run Reason is required when rule engine did not run",
          });
        } else {
          cleanData.ruleEngineNotRunReason = ruleEngineNotRunReason;
        }
      }
    }

    // Level 16: Boolean fields - mandatory ones
    if (signedGeneralConsent === undefined || signedGeneralConsent === null) {
      errors.push({
        field: "signedGeneralConsent",
        label: "Signed General Consent",
        message: "Signed General Consent is required",
      });
    } else {
      cleanData.signedGeneralConsent = signedGeneralConsent;
    }

    if (signedTxPlan === undefined || signedTxPlan === null) {
      errors.push({
        field: "signedTxPlan",
        label: "Signed Treatment Plan",
        message: "Signed Treatment Plan is required",
      });
    } else {
      cleanData.signedTxPlan = signedTxPlan;
    }

    if (xRayPanoAttached === undefined || xRayPanoAttached === null) {
      errors.push({
        field: "xRayPanoAttached",
        label: "X-Ray/Pano Attached",
        message: "X-Ray/Pano Attached is required",
      });
    } else {
      cleanData.xRayPanoAttached = xRayPanoAttached;
    }

    if (
      prcUpdatedInRouteSheet === undefined ||
      prcUpdatedInRouteSheet === null
    ) {
      errors.push({
        field: "prcUpdatedInRouteSheet",
        label: "PRC Updated in Route Sheet",
        message: "PRC Updated in Route Sheet is required",
      });
    } else {
      cleanData.prcUpdatedInRouteSheet = prcUpdatedInRouteSheet;
    }

    if (routeSheet === undefined || routeSheet === null) {
      errors.push({
        field: "routeSheet",
        label: "Route Sheet",
        message: "Route Sheet is required",
      });
    } else {
      cleanData.routeSheet = routeSheet;
    }

    // Optional boolean fields - only save if provided
    if (signedTreatmentConsent !== undefined)
      cleanData.signedTreatmentConsent = signedTreatmentConsent;
    if (preAuthAvailable !== undefined)
      cleanData.preAuthAvailable = preAuthAvailable;
    if (perioChart !== undefined) cleanData.perioChart = perioChart;
    if (nvd !== undefined) cleanData.nvd = nvd;
    if (majorServiceForm !== undefined)
      cleanData.majorServiceForm = majorServiceForm;
    if (narrative !== undefined) cleanData.narrative = narrative;
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanData,
  };
};

module.exports = validateOfficeSection;
