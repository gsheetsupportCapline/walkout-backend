# Walkout Form - Office Section Frontend Implementation Guide

## Part 2: Conditional Logic & Validation Rules

---

## 📋 Table of Contents

1. [Validation Overview](#validation-overview)
2. [16-Level Validation Cascade](#16-level-validation-cascade)
3. [Show/Hide Element Rules](#showhide-element-rules)
4. [Frontend Calculations](#frontend-calculations)
5. [Validation Flow Diagrams](#validation-flow-diagrams)
6. [Error Messages](#error-messages)

---

## 1. Validation Overview

### Validation Philosophy

The office section uses **conditional validation** - fields become required or hidden based on the values of previous fields. This creates a **cascade effect** where each decision impacts what comes next.

### Key Principles

1. **Progressive Disclosure**: Only show fields that are relevant
2. **Smart Hiding**: If data won't be saved, hide the UI element completely
3. **Clear Feedback**: Show specific error messages for each validation failure
4. **Frontend First**: Validate on frontend before API call
5. **Backend Safety**: Backend re-validates everything (never trust frontend alone)

### Validation Levels

```
Level 1: patientCame (ALWAYS mandatory)
    ↓
Level 2-16: Conditional validations (depends on previous values)
```

---

## 2. 16-Level Validation Cascade

### LEVEL 1: Patient Came (ALWAYS MANDATORY)

```javascript
Field: patientCame
Type: Radio Button (Number)
Required: ✅ ALWAYS
Values: 1 = Yes, 2 = No

Validation:
if (patientCame === undefined || patientCame === null) {
  error = "Please select if patient came or not";
}
```

**Decision Point**: This field controls the entire form flow

#### Path A: Patient Didn't Come (patientCame = 2)

```javascript
if (patientCame === 2) {
  // ONLY save patientCame field
  // ALL other fields should be HIDDEN and NOT sent to backend
  // Set walkoutStatus = "patient_not_came"
  // DO NOT set submitToLC3 timestamp

  const payload = {
    appointmentId: appointmentId,
    openTime: openTime,
    patientCame: 2, // ONLY THIS FIELD
  };

  // Submit and END
}
```

**UI Behavior for Path A**:

- ❌ HIDE all other form fields
- ✅ Show only patientCame field
- ✅ Show submit button
- ✅ Show message: "Since patient didn't come, no further information is needed"

#### Path B: Patient Came (patientCame = 1)

```javascript
if (patientCame === 1) {
  // Continue to Level 2
  // Show remaining form fields based on conditional logic
}
```

---

### LEVEL 2: Post-Op Zero Production (Conditional Mandatory)

```javascript
Field: postOpZeroProduction
Type: Radio Button (Number)
Required: ✅ If patientCame = 1
Values: 1 = Yes, 2 = No

Show/Hide Rule:
- Show: if patientCame === 1
- Hide: if patientCame === 2

Validation:
if (patientCame === 1) {
  if (postOpZeroProduction === undefined || postOpZeroProduction === null) {
    error = "Please select post-op zero production status";
  }
}
```

**Decision Point**: This field controls payment and document sections

---

### LEVEL 3: Patient Type (Conditional Mandatory)

```javascript
Field: patientType
Type: Radio Button (Number)
Required: ✅ If patientCame = 1

Show/Hide Rule:
- Show: if patientCame === 1
- Hide: if patientCame === 2

Validation:
if (patientCame === 1) {
  if (patientType === undefined || patientType === null) {
    error = "Please select patient type";
  }
}
```

---

### LEVEL 4: Has Insurance (Conditional Mandatory)

```javascript
Field: hasInsurance
Type: Radio Button (Number)
Required: ✅ If patientCame = 1
Values: 1 = Yes, 2 = No

Show/Hide Rule:
- Show: if patientCame === 1
- Hide: if patientCame === 2

Validation:
if (patientCame === 1) {
  if (hasInsurance === undefined || hasInsurance === null) {
    error = "Please select if patient has insurance";
  }
}
```

---

### LEVEL 5: Insurance Type (Conditional Mandatory)

```javascript
Field: insuranceType
Type: Radio Button (Number)
Required: ✅ If hasInsurance = 1
Values: 2, 6, and others from radio set

Show/Hide Rule:
- Show: if patientCame === 1 AND hasInsurance === 1
- Hide: if patientCame === 2 OR hasInsurance === 2

Validation:
if (patientCame === 1 && hasInsurance === 1) {
  if (insuranceType === undefined || insuranceType === null) {
    error = "Please select insurance type";
  }
}

// If hasInsurance = 2, DO NOT save insuranceType
if (hasInsurance === 2) {
  delete formData.insuranceType;  // Remove from payload
}
```

---

### LEVEL 5b: Specific Insurance (Conditional Mandatory)

```javascript
Field: insurance
Type: Radio Button (Number)
Required: ✅ If insuranceType = 2 OR insuranceType = 6
Values: Numbers from radio set

Show/Hide Rule:
- Show: if patientCame === 1 AND hasInsurance === 1
         AND (insuranceType === 2 OR insuranceType === 6)
- Hide: in all other cases

Validation:
if (patientCame === 1 && hasInsurance === 1) {
  if (insuranceType === 2 || insuranceType === 6) {
    if (insurance === undefined || insurance === null) {
      error = "Please select specific insurance";
    }
  }
}

// If insuranceType is NOT 2 or 6, DO NOT save insurance
if (insuranceType !== 2 && insuranceType !== 6) {
  delete formData.insurance;  // Remove from payload
}
```

**Insurance Chain Summary**:

```
hasInsurance = 2 (No)
  → Hide insuranceType
  → Hide insurance
  → Don't send these fields

hasInsurance = 1 (Yes)
  → Show insuranceType
  → insuranceType = 2 or 6
      → Show insurance (mandatory)
  → insuranceType = other values
      → Hide insurance
      → Don't send insurance field
```

---

### LEVEL 6: Google Review Request (Conditional Mandatory)

```javascript
Field: googleReviewRequest
Type: Radio Button (Number)
Required: ✅ If patientCame = 1

Show/Hide Rule:
- Show: if patientCame === 1
- Hide: if patientCame === 2

Validation:
if (patientCame === 1) {
  if (googleReviewRequest === undefined || googleReviewRequest === null) {
    error = "Please select google review request status";
  }
}
```

---

### MAJOR BRANCH: Post-Op Zero Production Check

```javascript
if (postOpZeroProduction === 1) {
  // SKIP ALL PAYMENT AND DOCUMENT FIELDS
  // These fields should be HIDDEN and NOT sent to backend:
  // - expectedPatientPortionOfficeWO
  // - patientPortionCollected
  // - differenceInPatientPortion
  // - patientPortionPrimaryMode
  // - amountCollectedPrimaryMode
  // - patientPortionSecondaryMode
  // - amountCollectedSecondaryMode
  // - lastFourDigitsCheckForte
  // - reasonLessCollection
  // - ruleEngineRun
  // - ruleEngineError
  // - ruleEngineNotRunReason
  // - errorFixRemarks
  // - issuesFixed
  // - ALL boolean document fields
  // ONLY submit: patientCame, postOpZeroProduction, patientType,
  //              hasInsurance, insuranceType (if applicable),
  //              insurance (if applicable), googleReviewRequest
}

if (postOpZeroProduction !== 1) {
  // CONTINUE to Level 7
  // SHOW all payment and document fields
}
```

**UI Behavior for Post-Op Zero Production**:

```javascript
if (postOpZeroProduction === 1) {
  // Hide entire payment section
  document.getElementById("payment-section").style.display = "none";

  // Hide entire document section
  document.getElementById("document-section").style.display = "none";

  // Hide rule engine section
  document.getElementById("rule-engine-section").style.display = "none";

  // Show submit button directly
  // User can submit with just basic info
}
```

---

### LEVEL 7: Expected Patient Portion (Conditional Mandatory)

```javascript
Field: expectedPatientPortionOfficeWO
Type: Number (Decimal)
Required: ✅ If patientCame = 1 AND postOpZeroProduction ≠ 1
Can Be Zero: ✅ Yes

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (expectedPatientPortionOfficeWO === undefined ||
      expectedPatientPortionOfficeWO === null ||
      expectedPatientPortionOfficeWO === "") {
    error = "Expected patient portion is required (can be 0)";
  }
}
```

---

### LEVEL 8: Patient Portion Collected (NOT Mandatory)

```javascript
Field: patientPortionCollected
Type: Number (Decimal)
Required: ❌ No (calculated on frontend)

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
// No validation - optional field
// Usually calculated automatically:
// patientPortionCollected = amountCollectedPrimaryMode + amountCollectedSecondaryMode
```

---

### LEVEL 9: Difference in Patient Portion (NOT Mandatory)

```javascript
Field: differenceInPatientPortion
Type: Number (Decimal, can be negative)
Required: ❌ No (calculated on frontend)

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Frontend Calculation:
differenceInPatientPortion = expectedPatientPortionOfficeWO - patientPortionCollected

Example:
Expected: $150.00
Collected: $175.00
Difference: -$25.00 (negative means over-collected)
```

---

### LEVEL 10: Primary Payment Mode & Amount

```javascript
Field: patientPortionPrimaryMode
Type: Dropdown (Number)
Required: ❌ No (optional)
Values: 1, 2, 3, 4 = Check/Forte, etc.

Field: amountCollectedPrimaryMode
Type: Number (Decimal)
Required: ✅ If patientPortionPrimaryMode has a value

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (patientPortionPrimaryMode !== undefined &&
      patientPortionPrimaryMode !== null &&
      patientPortionPrimaryMode !== "") {
    // Primary mode is selected, amount becomes mandatory
    if (amountCollectedPrimaryMode === undefined ||
        amountCollectedPrimaryMode === null ||
        amountCollectedPrimaryMode === "") {
      error = "Amount for primary payment mode is required";
    }
  }
}

// If primary mode is NOT selected, don't send amount
if (!patientPortionPrimaryMode) {
  delete formData.amountCollectedPrimaryMode;
}
```

---

### LEVEL 11: Secondary Payment Mode & Amount

```javascript
Field: patientPortionSecondaryMode
Type: Dropdown (Number)
Required: ❌ No (optional)

Field: amountCollectedSecondaryMode
Type: Number (Decimal)
Required: ✅ If patientPortionSecondaryMode has a value

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (patientPortionSecondaryMode !== undefined &&
      patientPortionSecondaryMode !== null &&
      patientPortionSecondaryMode !== "") {
    // Secondary mode is selected, amount becomes mandatory
    if (amountCollectedSecondaryMode === undefined ||
        amountCollectedSecondaryMode === null ||
        amountCollectedSecondaryMode === "") {
      error = "Amount for secondary payment mode is required";
    }
  }
}

// If secondary mode is NOT selected, don't send amount
if (!patientPortionSecondaryMode) {
  delete formData.amountCollectedSecondaryMode;
}
```

---

### LEVEL 12: Check/Forte Last Four Digits

```javascript
Field: lastFourDigitsCheckForte
Type: Number (4 digits)
Required: ✅ If patientPortionPrimaryMode = 4 OR patientPortionSecondaryMode = 4
Values: 0000 to 9999

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
         AND (patientPortionPrimaryMode === 4 OR patientPortionSecondaryMode === 4)
- Hide: in all other cases

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  const isPrimaryMode4 = patientPortionPrimaryMode === 4;
  const isSecondaryMode4 = patientPortionSecondaryMode === 4;

  if (isPrimaryMode4 || isSecondaryMode4) {
    if (lastFourDigitsCheckForte === undefined ||
        lastFourDigitsCheckForte === null ||
        lastFourDigitsCheckForte === "") {
      error = "Last 4 digits of check/Forte is required";
    }

    // Additional frontend validation
    const digits = lastFourDigitsCheckForte.toString();
    if (digits.length !== 4) {
      error = "Please enter exactly 4 digits";
    }
  }
}

// If neither mode is 4, don't send this field
if (patientPortionPrimaryMode !== 4 && patientPortionSecondaryMode !== 4) {
  delete formData.lastFourDigitsCheckForte;
}
```

---

### LEVEL 13: Reason for Less Collection

```javascript
Field: reasonLessCollection
Type: Dropdown (Number)
Required: ✅ If differenceInPatientPortion < 0
Values: Numbers from dropdown set

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
         AND differenceInPatientPortion < 0
- Hide: in all other cases

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (differenceInPatientPortion !== undefined &&
      differenceInPatientPortion < 0) {
    // Negative difference (collected less than expected)
    if (reasonLessCollection === undefined ||
        reasonLessCollection === null ||
        reasonLessCollection === "") {
      error = "Reason for less collection is required when amount collected is less than expected";
    }
  }
}

// If difference is not negative, don't send this field
if (differenceInPatientPortion >= 0) {
  delete formData.reasonLessCollection;
}
```

**UI Tip**: Calculate difference in real-time and show/hide this dropdown dynamically

---

### LEVEL 14: Rule Engine Run Status (Conditional Mandatory)

```javascript
Field: ruleEngineRun
Type: Radio Button (Number)
Required: ✅ If patientCame = 1 AND postOpZeroProduction ≠ 1
Values: 1 = Yes (ran), 2 = No (didn't run)

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (ruleEngineRun === undefined || ruleEngineRun === null) {
    error = "Please select if rule engine ran or not";
  }
}
```

**Decision Point**: This field controls which sub-fields are shown

---

### LEVEL 15a: Rule Engine Error (If Engine Ran)

```javascript
Field: ruleEngineError
Type: Radio Button (Number)
Required: ✅ If ruleEngineRun = 1
Values: 1 = Yes (error occurred), 2 = No (no error)

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1 AND ruleEngineRun === 1
- Hide: if ruleEngineRun === 2 OR other hiding conditions

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1 && ruleEngineRun === 1) {
  if (ruleEngineError === undefined || ruleEngineError === null) {
    error = "Please select if rule engine encountered an error";
  }
}
```

---

### LEVEL 15b: Error Fix Details (If Error Occurred)

```javascript
Field: errorFixRemarks
Type: Text (String)
Required: ✅ If ruleEngineError = 1
Max Length: 1000 characters

Field: issuesFixed
Type: Radio Button (Number)
Required: ✅ If ruleEngineError = 1
Values: 1 = Yes, 2 = No

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
         AND ruleEngineRun === 1 AND ruleEngineError === 1
- Hide: in all other cases

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1 &&
    ruleEngineRun === 1 && ruleEngineError === 1) {

  // errorFixRemarks validation
  if (!errorFixRemarks || errorFixRemarks.trim() === "") {
    error = "Please provide remarks on how errors were fixed";
  }

  // issuesFixed validation
  if (issuesFixed === undefined || issuesFixed === null) {
    error = "Please select if issues were fixed";
  }
}

// If ruleEngineError is NOT 1, don't send these fields
if (ruleEngineError !== 1) {
  delete formData.errorFixRemarks;
  delete formData.issuesFixed;
}
```

---

### LEVEL 15c: Rule Engine Not Run Reason (If Engine Didn't Run)

```javascript
Field: ruleEngineNotRunReason
Type: Dropdown (Number)
Required: ✅ If ruleEngineRun = 2
Values: Numbers from dropdown set

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1 AND ruleEngineRun === 2
- Hide: if ruleEngineRun === 1 OR other hiding conditions

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1 && ruleEngineRun === 2) {
  if (ruleEngineNotRunReason === undefined ||
      ruleEngineNotRunReason === null ||
      ruleEngineNotRunReason === "") {
    error = "Please select reason why rule engine did not run";
  }
}

// If ruleEngineRun is NOT 2, don't send this field
if (ruleEngineRun !== 2) {
  delete formData.ruleEngineNotRunReason;
}
```

**Rule Engine Logic Summary**:

```
ruleEngineRun = 1 (Yes, ran)
  → Show ruleEngineError
  → ruleEngineError = 1 (Yes, error)
      → Show errorFixRemarks (text, mandatory)
      → Show issuesFixed (radio, mandatory)
  → ruleEngineError = 2 (No error)
      → Hide error fix fields
      → Don't send errorFixRemarks, issuesFixed

ruleEngineRun = 2 (No, didn't run)
  → Show ruleEngineNotRunReason (dropdown, mandatory)
  → Hide ruleEngineError and its sub-fields
```

---

### LEVEL 16: Document Boolean Fields (Conditional Mandatory)

#### Mandatory Boolean Fields

```javascript
Fields:
  - signedGeneralConsent
  - signedTxPlan
  - xRayPanoAttached
  - prcUpdatedInRouteSheet
  - routeSheet

Type: Boolean (checkbox)
Required: ✅ If patientCame = 1 AND postOpZeroProduction ≠ 1

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

Validation:
if (patientCame === 1 && postOpZeroProduction !== 1) {
  if (signedGeneralConsent === undefined || signedGeneralConsent === null) {
    error = "Signed general consent status is required";
  }

  if (signedTxPlan === undefined || signedTxPlan === null) {
    error = "Signed treatment plan status is required";
  }

  if (xRayPanoAttached === undefined || xRayPanoAttached === null) {
    error = "X-ray/Pano attachment status is required";
  }

  if (prcUpdatedInRouteSheet === undefined || prcUpdatedInRouteSheet === null) {
    error = "PRC updated in route sheet status is required";
  }

  if (routeSheet === undefined || routeSheet === null) {
    error = "Route sheet status is required";
  }
}
```

#### Optional Boolean Fields

```javascript
Fields:
  - signedTreatmentConsent
  - preAuthAvailable
  - perioChart
  - nvd
  - majorServiceForm
  - narrative

Type: Boolean (checkbox)
Required: ❌ No

Show/Hide Rule:
- Show: if patientCame === 1 AND postOpZeroProduction !== 1
- Hide: if patientCame === 2 OR postOpZeroProduction === 1

// No validation needed - optional
// Send if provided, default to false if not
```

---

## 3. Show/Hide Element Rules

### Complete Show/Hide Logic Table

| Field                              | Show When                                                               | Hide When                                         |
| ---------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `patientCame`                      | ✅ Always                                                               | Never                                             |
| `postOpZeroProduction`             | `patientCame === 1`                                                     | `patientCame === 2`                               |
| `patientType`                      | `patientCame === 1`                                                     | `patientCame === 2`                               |
| `hasInsurance`                     | `patientCame === 1`                                                     | `patientCame === 2`                               |
| `insuranceType`                    | `patientCame === 1 && hasInsurance === 1`                               | `patientCame === 2 OR hasInsurance === 2`         |
| `insurance`                        | `patientCame === 1 && hasInsurance === 1 && (insuranceType === 2 OR 6)` | All other cases                                   |
| `googleReviewRequest`              | `patientCame === 1`                                                     | `patientCame === 2`                               |
| **Payment Section**                | `patientCame === 1 && postOpZeroProduction !== 1`                       | `patientCame === 2 OR postOpZeroProduction === 1` |
| `expectedPatientPortionOfficeWO`   | Same as payment section                                                 | Same as payment section                           |
| `patientPortionCollected`          | Same as payment section                                                 | Same as payment section                           |
| `differenceInPatientPortion`       | Same as payment section                                                 | Same as payment section                           |
| `patientPortionPrimaryMode`        | Same as payment section                                                 | Same as payment section                           |
| `amountCollectedPrimaryMode`       | Same + `patientPortionPrimaryMode` has value                            | When primary mode not selected                    |
| `patientPortionSecondaryMode`      | Same as payment section                                                 | Same as payment section                           |
| `amountCollectedSecondaryMode`     | Same + `patientPortionSecondaryMode` has value                          | When secondary mode not selected                  |
| `lastFourDigitsCheckForte`         | Same + (`primaryMode === 4 OR secondaryMode === 4`)                     | When neither mode is 4                            |
| `reasonLessCollection`             | Same + `differenceInPatientPortion < 0`                                 | When difference >= 0                              |
| `ruleEngineRun`                    | Same as payment section                                                 | Same as payment section                           |
| `ruleEngineError`                  | Same + `ruleEngineRun === 1`                                            | When `ruleEngineRun === 2`                        |
| `errorFixRemarks`                  | Same + `ruleEngineRun === 1 && ruleEngineError === 1`                   | All other cases                                   |
| `issuesFixed`                      | Same + `ruleEngineRun === 1 && ruleEngineError === 1`                   | All other cases                                   |
| `ruleEngineNotRunReason`           | Same + `ruleEngineRun === 2`                                            | When `ruleEngineRun === 1`                        |
| **Document Section (5 mandatory)** | `patientCame === 1 && postOpZeroProduction !== 1`                       | `patientCame === 2 OR postOpZeroProduction === 1` |
| **Document Section (6 optional)**  | Same as mandatory                                                       | Same as mandatory                                 |
| `newOfficeNote`                    | ✅ Always (optional)                                                    | Never                                             |

### Implementation Example

```javascript
function updateFieldVisibility(formData) {
  // Level 1 - Always visible
  show("patientCame");

  // Level 2+ - Conditional
  if (formData.patientCame === 1) {
    show(
      "postOpZeroProduction",
      "patientType",
      "hasInsurance",
      "googleReviewRequest"
    );

    // Insurance chain
    if (formData.hasInsurance === 1) {
      show("insuranceType");

      if (formData.insuranceType === 2 || formData.insuranceType === 6) {
        show("insurance");
      } else {
        hide("insurance");
      }
    } else {
      hide("insuranceType", "insurance");
    }

    // Payment section
    if (formData.postOpZeroProduction !== 1) {
      show("payment-section"); // Entire section
      show("document-section"); // Entire section

      // Payment mode amounts
      if (formData.patientPortionPrimaryMode) {
        show("amountCollectedPrimaryMode");
      } else {
        hide("amountCollectedPrimaryMode");
      }

      // Check/Forte digits
      if (
        formData.patientPortionPrimaryMode === 4 ||
        formData.patientPortionSecondaryMode === 4
      ) {
        show("lastFourDigitsCheckForte");
      } else {
        hide("lastFourDigitsCheckForte");
      }

      // Reason for less collection
      if (formData.differenceInPatientPortion < 0) {
        show("reasonLessCollection");
      } else {
        hide("reasonLessCollection");
      }

      // Rule engine chain
      if (formData.ruleEngineRun === 1) {
        show("ruleEngineError");
        hide("ruleEngineNotRunReason");

        if (formData.ruleEngineError === 1) {
          show("errorFixRemarks", "issuesFixed");
        } else {
          hide("errorFixRemarks", "issuesFixed");
        }
      } else if (formData.ruleEngineRun === 2) {
        show("ruleEngineNotRunReason");
        hide("ruleEngineError", "errorFixRemarks", "issuesFixed");
      }
    } else {
      hide("payment-section");
      hide("document-section");
      hide("rule-engine-section");
    }
  } else {
    // Patient didn't come - hide everything except patientCame
    hide("all-fields-except-patient-came");
  }
}

// Call this function whenever any field value changes
formData.addEventListener("change", () => {
  updateFieldVisibility(formData);
});
```

---

## 4. Frontend Calculations

### Calculation 1: Patient Portion Collected (Auto-calculate)

```javascript
function calculatePatientPortionCollected(primaryAmount, secondaryAmount) {
  const primary = parseFloat(primaryAmount) || 0;
  const secondary = parseFloat(secondaryAmount) || 0;

  const collected = primary + secondary;

  // Update field
  document.getElementById("patientPortionCollected").value =
    collected.toFixed(2);

  return collected;
}

// Trigger calculation when amounts change
document
  .getElementById("amountCollectedPrimaryMode")
  .addEventListener("input", (e) => {
    const primary = e.target.value;
    const secondary = document.getElementById(
      "amountCollectedSecondaryMode"
    ).value;
    calculatePatientPortionCollected(primary, secondary);
  });
```

### Calculation 2: Difference in Patient Portion (Auto-calculate)

```javascript
function calculateDifference(expected, collected) {
  const exp = parseFloat(expected) || 0;
  const coll = parseFloat(collected) || 0;

  const difference = exp - coll;

  // Update field
  document.getElementById("differenceInPatientPortion").value =
    difference.toFixed(2);

  // Show/hide reasonLessCollection dropdown
  if (difference < 0) {
    show("reasonLessCollection");
    markRequired("reasonLessCollection");
  } else {
    hide("reasonLessCollection");
    removeRequired("reasonLessCollection");
  }

  return difference;
}

// Trigger when expected or collected changes
document
  .getElementById("expectedPatientPortionOfficeWO")
  .addEventListener("input", (e) => {
    const expected = e.target.value;
    const collected = document.getElementById("patientPortionCollected").value;
    calculateDifference(expected, collected);
  });
```

### Visual Indicator for Difference

```javascript
function updateDifferenceDisplay(difference) {
  const element = document.getElementById("differenceInPatientPortion");

  if (difference < 0) {
    element.classList.add("negative");
    element.classList.remove("positive", "zero");
    // Show in red - collected less than expected
  } else if (difference > 0) {
    element.classList.add("positive");
    element.classList.remove("negative", "zero");
    // Show in green - collected more than expected
  } else {
    element.classList.add("zero");
    element.classList.remove("positive", "negative");
    // Show in black - exact match
  }
}
```

---

## 5. Validation Flow Diagrams

### Main Flow Diagram

```
START
  ↓
[Patient Came?]
  ├─ No (2) → Save only patientCame → Submit → END
  └─ Yes (1) → Continue
       ↓
  [Post-Op Zero Production?]
       ├─ Yes (1) → Skip payment/docs → Submit basic info → END
       └─ No (2) → Continue
            ↓
       [Fill all fields with validation]
            ↓
       [Submit complete form] → END
```

### Insurance Chain Flow

```
[Has Insurance?]
  ├─ No (2) → Hide insuranceType, Hide insurance
  └─ Yes (1) → Show insuranceType
       ↓
  [Insurance Type?]
       ├─ 2 or 6 → Show insurance (mandatory)
       └─ Other → Hide insurance
```

### Rule Engine Flow

```
[Rule Engine Run?]
  ├─ No (2) → Show ruleEngineNotRunReason (mandatory)
  └─ Yes (1) → Show ruleEngineError
       ↓
  [Rule Engine Error?]
       ├─ No (2) → No additional fields
       └─ Yes (1) → Show errorFixRemarks (mandatory)
                  → Show issuesFixed (mandatory)
```

---

## 6. Error Messages

### Frontend Error Messages (User-Friendly)

```javascript
const errorMessages = {
  // Level 1
  patientCame: {
    required: "Please select whether the patient came or not",
    invalid: "Invalid selection for patient arrival",
  },

  // Level 2-6
  postOpZeroProduction: {
    required: "Please select post-op zero production status",
  },
  patientType: {
    required: "Please select the patient type",
  },
  hasInsurance: {
    required: "Please specify if the patient has insurance",
  },
  insuranceType: {
    required: "Please select the insurance type",
    conditional: "Insurance type is required when patient has insurance",
  },
  insurance: {
    required: "Please select the specific insurance",
    conditional:
      "Specific insurance is required for the selected insurance type",
  },
  googleReviewRequest: {
    required: "Please select google review request status",
  },

  // Level 7-13 (Payment)
  expectedPatientPortionOfficeWO: {
    required: "Expected patient portion is required (can be 0)",
    invalid: "Please enter a valid amount",
  },
  patientPortionPrimaryMode: {
    amountRequired: "Amount is required when primary payment mode is selected",
  },
  patientPortionSecondaryMode: {
    amountRequired:
      "Amount is required when secondary payment mode is selected",
  },
  lastFourDigitsCheckForte: {
    required: "Last 4 digits of check/Forte are required",
    invalid: "Please enter exactly 4 digits",
    conditional: "Required when payment mode is Check/Forte",
  },
  reasonLessCollection: {
    required: "Reason is required when collected amount is less than expected",
    conditional: "Please select a reason for the difference",
  },

  // Level 14-15 (Rule Engine)
  ruleEngineRun: {
    required: "Please select if rule engine ran or not",
  },
  ruleEngineError: {
    required: "Please select if rule engine encountered an error",
    conditional: "Required when rule engine ran",
  },
  ruleEngineNotRunReason: {
    required: "Please select reason why rule engine did not run",
    conditional: "Required when rule engine did not run",
  },
  errorFixRemarks: {
    required: "Please provide remarks on how errors were fixed",
    empty: "Remarks cannot be empty",
    conditional: "Required when rule engine error occurred",
  },
  issuesFixed: {
    required: "Please specify if issues were fixed",
    conditional: "Required when rule engine error occurred",
  },

  // Level 16 (Documents)
  signedGeneralConsent: {
    required: "Signed general consent status is required",
  },
  signedTxPlan: {
    required: "Signed treatment plan status is required",
  },
  xRayPanoAttached: {
    required: "X-ray/Pano attachment status is required",
  },
  prcUpdatedInRouteSheet: {
    required: "PRC updated in route sheet status is required",
  },
  routeSheet: {
    required: "Route sheet status is required",
  },
};
```

### Backend Error Messages (API Returns)

These are the exact error messages you'll receive from the backend API:

```javascript
const backendErrors = {
  patientCame: "patientCame is required",
  postOpZeroProduction: "postOpZeroProduction is required when patient came",
  patientType: "patientType is required when patient came",
  hasInsurance: "hasInsurance is required when patient came",
  insuranceType: "insuranceType is required when patient has insurance",
  insurance: "insurance is required for selected insurance type (2 or 6)",
  googleReviewRequest: "googleReviewRequest is required",
  expectedPatientPortionOfficeWO:
    "expectedPatientPortionOfficeWO is required (can be 0)",
  amountCollectedPrimaryMode:
    "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided",
  amountCollectedSecondaryMode:
    "amountCollectedSecondaryMode is required when patientPortionSecondaryMode is provided",
  lastFourDigitsCheckForte:
    "lastFourDigitsCheckForte is required when payment mode is 4",
  reasonLessCollection:
    "reasonLessCollection is required when differenceInPatientPortion is negative",
  ruleEngineRun: "ruleEngineRun is required",
  ruleEngineError: "ruleEngineError is required when rule engine ran",
  ruleEngineNotRunReason:
    "ruleEngineNotRunReason is required when rule engine did not run",
  errorFixRemarks: "errorFixRemarks is required when ruleEngineError is 1",
  issuesFixed: "issuesFixed is required when ruleEngineError is 1",
  signedGeneralConsent: "signedGeneralConsent is required",
  signedTxPlan: "signedTxPlan is required",
  xRayPanoAttached: "xRayPanoAttached is required",
  prcUpdatedInRouteSheet: "prcUpdatedInRouteSheet is required",
  routeSheet: "routeSheet is required",
};
```

### Error Display Recommendations

```javascript
function displayError(fieldName, message) {
  // 1. Add error class to field
  const field = document.getElementById(fieldName);
  field.classList.add("error");

  // 2. Show error message below field
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  field.parentElement.appendChild(errorDiv);

  // 3. Scroll to first error
  field.scrollIntoView({ behavior: "smooth", block: "center" });

  // 4. Focus on field
  field.focus();
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => {
    el.classList.remove("error");
  });

  document.querySelectorAll(".error-message").forEach((el) => {
    el.remove();
  });
}
```

---

## Summary - Part 2

✅ Understood complete 16-level validation cascade  
✅ Learned all show/hide element rules  
✅ Understood when to skip fields and not send to backend  
✅ Learned frontend calculations (collected amount, difference)  
✅ Reviewed all error messages and validation logic  
✅ Understood major branches (patient didn't come, post-op zero production)

**Next**: Part 3 will cover complete API documentation with request/response examples.

---

_Document Created: January 1, 2026_  
_For: Frontend Developer Implementation_  
_Backend API Version: 1.0_
