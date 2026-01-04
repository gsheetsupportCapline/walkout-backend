# Walkout Form - Office Section Frontend Implementation Guide

## Part 4: Implementation Guide & Code Examples

---

## 📋 Table of Contents

1. [Step-by-Step Implementation](#step-by-step-implementation)
2. [Complete Code Examples](#complete-code-examples)
3. [State Management](#state-management)
4. [Form Validation Logic](#form-validation-logic)
5. [UI/UX Best Practices](#uiux-best-practices)
6. [Testing Checklist](#testing-checklist)
7. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## 1. Step-by-Step Implementation

### Phase 1: Setup & Initial State

#### Step 1.1: Create Form Component

```javascript
// WalkoutOfficeForm.js or WalkoutOfficeForm.tsx

import React, { useState, useEffect } from "react";

const WalkoutOfficeForm = ({ appointment, authToken, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    appointmentId: appointment._id,
    openTime: new Date().toISOString(),
    patientCame: null,
    // ... all other fields
  });

  const [walkoutId, setWalkoutId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [visibleFields, setVisibleFields] = useState({
    patientCame: true,
  });

  useEffect(() => {
    checkExistingWalkout();
  }, [appointment._id]);

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
};
```

#### Step 1.2: Check for Existing Walkout

```javascript
async function checkExistingWalkout() {
  setIsLoading(true);
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/walkouts?appointmentId=${appointment._id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const result = await response.json();

    if (result.success && result.data && result.data.length > 0) {
      // Existing walkout found
      const existingWalkout = result.data[0];
      setWalkoutId(existingWalkout._id);
      loadExistingData(existingWalkout);
    } else {
      // New walkout
      initializeNewForm();
    }
  } catch (error) {
    console.error("Error checking walkout:", error);
    showNotification("Error loading form data", "error");
  } finally {
    setIsLoading(false);
  }
}
```

#### Step 1.3: Load Existing Data

```javascript
function loadExistingData(walkout) {
  const officeData = walkout.officeSection;

  setFormData({
    appointmentId: walkout.appointmentId,
    openTime: walkout.openTime,
    patientCame: officeData.patientCame,
    postOpZeroProduction: officeData.postOpZeroProduction,
    patientType: officeData.patientType,
    hasInsurance: officeData.hasInsurance,
    insuranceType: officeData.insuranceType,
    insurance: officeData.insurance,
    googleReviewRequest: officeData.googleReviewRequest,
    expectedPatientPortionOfficeWO: officeData.expectedPatientPortionOfficeWO,
    patientPortionCollected: officeData.patientPortionCollected,
    differenceInPatientPortion: officeData.differenceInPatientPortion,
    patientPortionPrimaryMode: officeData.patientPortionPrimaryMode,
    amountCollectedPrimaryMode: officeData.amountCollectedPrimaryMode,
    patientPortionSecondaryMode: officeData.patientPortionSecondaryMode,
    amountCollectedSecondaryMode: officeData.amountCollectedSecondaryMode,
    lastFourDigitsCheckForte: officeData.lastFourDigitsCheckForte,
    reasonLessCollection: officeData.reasonLessCollection,
    ruleEngineRun: officeData.ruleEngineRun,
    ruleEngineError: officeData.ruleEngineError,
    ruleEngineNotRunReason: officeData.ruleEngineNotRunReason,
    errorFixRemarks: officeData.errorFixRemarks,
    issuesFixed: officeData.issuesFixed,
    signedGeneralConsent: officeData.signedGeneralConsent,
    signedTreatmentConsent: officeData.signedTreatmentConsent,
    preAuthAvailable: officeData.preAuthAvailable,
    signedTxPlan: officeData.signedTxPlan,
    perioChart: officeData.perioChart,
    nvd: officeData.nvd,
    xRayPanoAttached: officeData.xRayPanoAttached,
    majorServiceForm: officeData.majorServiceForm,
    routeSheet: officeData.routeSheet,
    prcUpdatedInRouteSheet: officeData.prcUpdatedInRouteSheet,
    narrative: officeData.narrative,
    newOfficeNote: "", // Always empty for new note
  });

  // Update visible fields based on loaded data
  updateFieldVisibility(officeData);

  showNotification("Existing walkout data loaded", "info");
}
```

---

### Phase 2: Field Visibility Logic

#### Step 2.1: Visibility Update Function

```javascript
function updateFieldVisibility(data) {
  const visible = {
    // Level 1 - Always visible
    patientCame: true,

    // Level 2+ - Conditional
    postOpZeroProduction: data.patientCame === 1,
    patientType: data.patientCame === 1,
    hasInsurance: data.patientCame === 1,
    googleReviewRequest: data.patientCame === 1,

    // Insurance chain
    insuranceType: data.patientCame === 1 && data.hasInsurance === 1,
    insurance:
      data.patientCame === 1 &&
      data.hasInsurance === 1 &&
      (data.insuranceType === 2 || data.insuranceType === 6),

    // Payment section (if not post-op zero production)
    paymentSection: data.patientCame === 1 && data.postOpZeroProduction !== 1,
    expectedPatientPortionOfficeWO:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,
    patientPortionCollected:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,
    differenceInPatientPortion:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,
    patientPortionPrimaryMode:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,
    patientPortionSecondaryMode:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,

    // Payment amounts (only if mode selected)
    amountCollectedPrimaryMode:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.patientPortionPrimaryMode,
    amountCollectedSecondaryMode:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.patientPortionSecondaryMode,

    // Check/Forte digits
    lastFourDigitsCheckForte:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      (data.patientPortionPrimaryMode === 4 ||
        data.patientPortionSecondaryMode === 4),

    // Reason for less collection
    reasonLessCollection:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.differenceInPatientPortion < 0,

    // Rule engine section
    ruleEngineSection:
      data.patientCame === 1 && data.postOpZeroProduction !== 1,
    ruleEngineRun: data.patientCame === 1 && data.postOpZeroProduction !== 1,
    ruleEngineError:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.ruleEngineRun === 1,
    ruleEngineNotRunReason:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.ruleEngineRun === 2,
    errorFixRemarks:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.ruleEngineRun === 1 &&
      data.ruleEngineError === 1,
    issuesFixed:
      data.patientCame === 1 &&
      data.postOpZeroProduction !== 1 &&
      data.ruleEngineRun === 1 &&
      data.ruleEngineError === 1,

    // Document section
    documentSection: data.patientCame === 1 && data.postOpZeroProduction !== 1,

    // Note field - always visible
    newOfficeNote: true,
  };

  setVisibleFields(visible);
}
```

#### Step 2.2: Field Change Handler

```javascript
function handleFieldChange(fieldName, value) {
  const updatedData = {
    ...formData,
    [fieldName]: value,
  };

  // Auto-calculations
  if (
    fieldName === "amountCollectedPrimaryMode" ||
    fieldName === "amountCollectedSecondaryMode"
  ) {
    const primary =
      fieldName === "amountCollectedPrimaryMode"
        ? value
        : updatedData.amountCollectedPrimaryMode || 0;
    const secondary =
      fieldName === "amountCollectedSecondaryMode"
        ? value
        : updatedData.amountCollectedSecondaryMode || 0;

    updatedData.patientPortionCollected =
      parseFloat(primary) + parseFloat(secondary);
  }

  if (
    fieldName === "expectedPatientPortionOfficeWO" ||
    fieldName === "patientPortionCollected"
  ) {
    const expected =
      fieldName === "expectedPatientPortionOfficeWO"
        ? value
        : updatedData.expectedPatientPortionOfficeWO || 0;
    const collected =
      fieldName === "patientPortionCollected"
        ? value
        : updatedData.patientPortionCollected || 0;

    updatedData.differenceInPatientPortion =
      parseFloat(expected) - parseFloat(collected);
  }

  setFormData(updatedData);
  updateFieldVisibility(updatedData);

  // Clear error for this field
  if (errors[fieldName]) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }
}
```

---

### Phase 3: Validation & Submission

#### Step 3.1: Frontend Validation

```javascript
function validateForm() {
  const errors = {};

  // Level 1: patientCame always mandatory
  if (formData.patientCame === undefined || formData.patientCame === null) {
    errors.patientCame = "Please select whether the patient came or not";
    return { isValid: false, errors };
  }

  // If patient didn't come, no further validation needed
  if (formData.patientCame === 2) {
    return { isValid: true, errors: {} };
  }

  // Level 2: postOpZeroProduction
  if (
    formData.postOpZeroProduction === undefined ||
    formData.postOpZeroProduction === null
  ) {
    errors.postOpZeroProduction = "Post-op zero production status is required";
  }

  // Level 3: patientType
  if (formData.patientType === undefined || formData.patientType === null) {
    errors.patientType = "Patient type is required";
  }

  // Level 4: hasInsurance
  if (formData.hasInsurance === undefined || formData.hasInsurance === null) {
    errors.hasInsurance = "Insurance status is required";
  }

  // Level 5: insuranceType (conditional)
  if (formData.hasInsurance === 1) {
    if (
      formData.insuranceType === undefined ||
      formData.insuranceType === null
    ) {
      errors.insuranceType =
        "Insurance type is required when patient has insurance";
    }

    // Level 5b: insurance (conditional)
    if (formData.insuranceType === 2 || formData.insuranceType === 6) {
      if (formData.insurance === undefined || formData.insurance === null) {
        errors.insurance = "Specific insurance is required for selected type";
      }
    }
  }

  // Level 6: googleReviewRequest
  if (
    formData.googleReviewRequest === undefined ||
    formData.googleReviewRequest === null
  ) {
    errors.googleReviewRequest = "Google review request status is required";
  }

  // If post-op zero production, skip payment/document validation
  if (formData.postOpZeroProduction === 1) {
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  // Level 7: expectedPatientPortionOfficeWO
  if (
    formData.expectedPatientPortionOfficeWO === undefined ||
    formData.expectedPatientPortionOfficeWO === null ||
    formData.expectedPatientPortionOfficeWO === ""
  ) {
    errors.expectedPatientPortionOfficeWO =
      "Expected patient portion is required (can be 0)";
  }

  // Level 10: Primary mode amount
  if (formData.patientPortionPrimaryMode) {
    if (
      !formData.amountCollectedPrimaryMode &&
      formData.amountCollectedPrimaryMode !== 0
    ) {
      errors.amountCollectedPrimaryMode =
        "Amount is required for primary payment mode";
    }
  }

  // Level 11: Secondary mode amount
  if (formData.patientPortionSecondaryMode) {
    if (
      !formData.amountCollectedSecondaryMode &&
      formData.amountCollectedSecondaryMode !== 0
    ) {
      errors.amountCollectedSecondaryMode =
        "Amount is required for secondary payment mode";
    }
  }

  // Level 12: Check/Forte digits
  if (
    formData.patientPortionPrimaryMode === 4 ||
    formData.patientPortionSecondaryMode === 4
  ) {
    if (!formData.lastFourDigitsCheckForte) {
      errors.lastFourDigitsCheckForte =
        "Last 4 digits required for Check/Forte payment";
    } else if (formData.lastFourDigitsCheckForte.toString().length !== 4) {
      errors.lastFourDigitsCheckForte = "Please enter exactly 4 digits";
    }
  }

  // Level 13: Reason for less collection
  if (formData.differenceInPatientPortion < 0) {
    if (!formData.reasonLessCollection) {
      errors.reasonLessCollection =
        "Reason required when collected less than expected";
    }
  }

  // Level 14: ruleEngineRun
  if (formData.ruleEngineRun === undefined || formData.ruleEngineRun === null) {
    errors.ruleEngineRun = "Rule engine run status is required";
  }

  // Level 15: Rule engine conditional
  if (formData.ruleEngineRun === 1) {
    if (
      formData.ruleEngineError === undefined ||
      formData.ruleEngineError === null
    ) {
      errors.ruleEngineError = "Rule engine error status is required";
    }

    if (formData.ruleEngineError === 1) {
      if (!formData.errorFixRemarks || formData.errorFixRemarks.trim() === "") {
        errors.errorFixRemarks = "Error fix remarks are required";
      }
      if (formData.issuesFixed === undefined || formData.issuesFixed === null) {
        errors.issuesFixed = "Issues fixed status is required";
      }
    }
  } else if (formData.ruleEngineRun === 2) {
    if (!formData.ruleEngineNotRunReason) {
      errors.ruleEngineNotRunReason =
        "Reason required when rule engine didn't run";
    }
  }

  // Level 16: Mandatory boolean fields
  const mandatoryBooleans = [
    "signedGeneralConsent",
    "signedTxPlan",
    "xRayPanoAttached",
    "prcUpdatedInRouteSheet",
    "routeSheet",
  ];

  mandatoryBooleans.forEach((field) => {
    if (formData[field] === undefined || formData[field] === null) {
      errors[field] = `${field
        .replace(/([A-Z])/g, " $1")
        .trim()} status is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
```

#### Step 3.2: Clean Payload Before Submit

```javascript
function prepareSubmitPayload() {
  const payload = {
    appointmentId: formData.appointmentId,
    openTime: formData.openTime,
    patientCame: formData.patientCame,
  };

  // If patient didn't come, return minimal payload
  if (formData.patientCame === 2) {
    return payload;
  }

  // Add basic fields
  payload.postOpZeroProduction = formData.postOpZeroProduction;
  payload.patientType = formData.patientType;
  payload.hasInsurance = formData.hasInsurance;
  payload.googleReviewRequest = formData.googleReviewRequest;

  // Insurance chain
  if (formData.hasInsurance === 1) {
    payload.insuranceType = formData.insuranceType;

    if (formData.insuranceType === 2 || formData.insuranceType === 6) {
      payload.insurance = formData.insurance;
    }
  }

  // If post-op zero production, return without payment/document fields
  if (formData.postOpZeroProduction === 1) {
    if (formData.newOfficeNote && formData.newOfficeNote.trim()) {
      payload.newOfficeNote = formData.newOfficeNote.trim();
    }
    return payload;
  }

  // Add payment fields
  payload.expectedPatientPortionOfficeWO =
    formData.expectedPatientPortionOfficeWO;

  if (formData.patientPortionCollected !== undefined) {
    payload.patientPortionCollected = formData.patientPortionCollected;
  }

  if (formData.differenceInPatientPortion !== undefined) {
    payload.differenceInPatientPortion = formData.differenceInPatientPortion;
  }

  if (formData.patientPortionPrimaryMode) {
    payload.patientPortionPrimaryMode = formData.patientPortionPrimaryMode;
    payload.amountCollectedPrimaryMode = formData.amountCollectedPrimaryMode;
  }

  if (formData.patientPortionSecondaryMode) {
    payload.patientPortionSecondaryMode = formData.patientPortionSecondaryMode;
    payload.amountCollectedSecondaryMode =
      formData.amountCollectedSecondaryMode;
  }

  if (
    formData.patientPortionPrimaryMode === 4 ||
    formData.patientPortionSecondaryMode === 4
  ) {
    payload.lastFourDigitsCheckForte = formData.lastFourDigitsCheckForte;
  }

  if (formData.differenceInPatientPortion < 0) {
    payload.reasonLessCollection = formData.reasonLessCollection;
  }

  // Rule engine
  payload.ruleEngineRun = formData.ruleEngineRun;

  if (formData.ruleEngineRun === 1) {
    payload.ruleEngineError = formData.ruleEngineError;

    if (formData.ruleEngineError === 1) {
      payload.errorFixRemarks = formData.errorFixRemarks;
      payload.issuesFixed = formData.issuesFixed;
    }
  } else if (formData.ruleEngineRun === 2) {
    payload.ruleEngineNotRunReason = formData.ruleEngineNotRunReason;
  }

  // Boolean fields
  payload.signedGeneralConsent = formData.signedGeneralConsent;
  payload.signedTxPlan = formData.signedTxPlan;
  payload.xRayPanoAttached = formData.xRayPanoAttached;
  payload.prcUpdatedInRouteSheet = formData.prcUpdatedInRouteSheet;
  payload.routeSheet = formData.routeSheet;

  // Optional booleans
  if (formData.signedTreatmentConsent !== undefined) {
    payload.signedTreatmentConsent = formData.signedTreatmentConsent;
  }
  if (formData.preAuthAvailable !== undefined) {
    payload.preAuthAvailable = formData.preAuthAvailable;
  }
  if (formData.perioChart !== undefined) {
    payload.perioChart = formData.perioChart;
  }
  if (formData.nvd !== undefined) {
    payload.nvd = formData.nvd;
  }
  if (formData.majorServiceForm !== undefined) {
    payload.majorServiceForm = formData.majorServiceForm;
  }
  if (formData.narrative !== undefined) {
    payload.narrative = formData.narrative;
  }

  // New note
  if (formData.newOfficeNote && formData.newOfficeNote.trim()) {
    payload.newOfficeNote = formData.newOfficeNote.trim();
  }

  return payload;
}
```

#### Step 3.3: Submit Handler

```javascript
async function handleSubmit(e) {
  e.preventDefault();

  // Frontend validation
  const validation = validateForm();

  if (!validation.isValid) {
    setErrors(validation.errors);

    // Scroll to first error
    const firstErrorField = Object.keys(validation.errors)[0];
    document.getElementById(firstErrorField)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    showNotification("Please fix validation errors", "error");
    return;
  }

  setIsLoading(true);

  try {
    const payload = prepareSubmitPayload();
    const url = walkoutId
      ? `${process.env.REACT_APP_API_URL}/api/walkouts/${walkoutId}/office`
      : `${process.env.REACT_APP_API_URL}/api/walkouts/submit-office`;

    const method = walkoutId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      // Backend validation error
      if (response.status === 400) {
        showNotification(result.message, "error");
      } else if (response.status === 401) {
        showNotification("Session expired. Please login again.", "error");
        // Redirect to login
      } else {
        showNotification("Server error. Please try again.", "error");
      }
      return;
    }

    // Success
    if (!walkoutId) {
      setWalkoutId(result.data._id);
    }

    showNotification(
      walkoutId
        ? "Office section updated successfully!"
        : "Office section submitted successfully!",
      "success"
    );

    // Call parent callback
    if (onSubmitSuccess) {
      onSubmitSuccess(result.data);
    }

    // Clear new note field
    setFormData((prev) => ({ ...prev, newOfficeNote: "" }));
  } catch (error) {
    console.error("Submit error:", error);
    showNotification("Network error. Please check your connection.", "error");
  } finally {
    setIsLoading(false);
  }
}
```

---

## 2. Complete Code Examples

### Example 1: Radio Button Field Component

```jsx
function RadioField({
  label,
  name,
  value,
  options,
  onChange,
  error,
  required,
  visible,
}) {
  if (!visible) return null;

  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <div className="radio-group">
        {options.map((option) => (
          <label key={option.id} className="radio-option">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={(e) => onChange(name, parseInt(e.target.value))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// Usage
<RadioField
  label="Did patient come?"
  name="patientCame"
  value={formData.patientCame}
  options={[
    { id: 1, label: "Yes, Patient Came" },
    { id: 2, label: "No, Patient Did Not Come" },
  ]}
  onChange={handleFieldChange}
  error={errors.patientCame}
  required={true}
  visible={visibleFields.patientCame}
/>;
```

### Example 2: Dropdown Field Component

```jsx
function DropdownField({
  label,
  name,
  value,
  options,
  onChange,
  error,
  required,
  visible,
  placeholder = "Select...",
}) {
  if (!visible) return null;

  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={(e) =>
          onChange(name, e.target.value ? parseInt(e.target.value) : null)
        }
        className={error ? "error" : ""}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// Usage
<DropdownField
  label="Primary Payment Mode"
  name="patientPortionPrimaryMode"
  value={formData.patientPortionPrimaryMode}
  options={paymentModeOptions}
  onChange={handleFieldChange}
  error={errors.patientPortionPrimaryMode}
  required={false}
  visible={visibleFields.patientPortionPrimaryMode}
  placeholder="Select payment mode"
/>;
```

### Example 3: Number Input with Auto-calculation

```jsx
function NumberField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  visible,
  min,
  max,
  step = '0.01',
  prefix = '$',
  readonly = false
}) {
  if (!visible) return null;

  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <div className="input-with-prefix">
        {prefix && <span className="prefix">{prefix}</span>}
        <input
          type="number"
          id={name}
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          readOnly={readonly}
          className={`${error ? 'error' : ''} ${readonly ? 'readonly' : ''}`}
        />
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// Usage - Expected Amount
<NumberField
  label="Expected Patient Portion"
  name="expectedPatientPortionOfficeWO"
  value={formData.expectedPatientPortionOfficeWO}
  onChange={handleFieldChange}
  error={errors.expectedPatientPortionOfficeWO}
  required={true}
  visible={visibleFields.expectedPatientPortionOfficeWO}
  min={0}
  prefix="$"
/>

// Usage - Difference (readonly, auto-calculated)
<NumberField
  label="Difference"
  name="differenceInPatientPortion"
  value={formData.differenceInPatientPortion}
  onChange={() => {}} // No-op, readonly
  error={errors.differenceInPatientPortion}
  required={false}
  visible={visibleFields.differenceInPatientPortion}
  prefix="$"
  readonly={true}
/>
```

### Example 4: Checkbox (Boolean) Field

```jsx
function CheckboxField({
  label,
  name,
  checked,
  onChange,
  error,
  required,
  visible,
}) {
  if (!visible) return null;

  return (
    <div className={`form-field checkbox-field ${error ? "has-error" : ""}`}>
      <label>
        <input
          type="checkbox"
          id={name}
          name={name}
          checked={checked || false}
          onChange={(e) => onChange(name, e.target.checked)}
        />
        <span>
          {label}
          {required && <span className="required">*</span>}
        </span>
      </label>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// Usage
<CheckboxField
  label="Signed General Consent"
  name="signedGeneralConsent"
  checked={formData.signedGeneralConsent}
  onChange={handleFieldChange}
  error={errors.signedGeneralConsent}
  required={true}
  visible={visibleFields.documentSection}
/>;
```

### Example 5: Textarea for Notes

```jsx
function TextareaField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  visible,
  placeholder,
  maxLength = 500,
}) {
  if (!visible) return null;

  return (
    <div className={`form-field ${error ? "has-error" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>

      <textarea
        id={name}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={4}
        className={error ? "error" : ""}
      />

      <div className="field-info">
        <span className="char-count">
          {value?.length || 0}/{maxLength}
        </span>
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// Usage
<TextareaField
  label="Add Note"
  name="newOfficeNote"
  value={formData.newOfficeNote}
  onChange={handleFieldChange}
  error={errors.newOfficeNote}
  required={false}
  visible={visibleFields.newOfficeNote}
  placeholder="Add any notes or comments about this visit..."
  maxLength={500}
/>;
```

---

## 3. State Management

### Using React Context (Recommended for Large Apps)

```jsx
// WalkoutContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const WalkoutContext = createContext();

export function WalkoutProvider({ children, appointment, authToken }) {
  const [formData, setFormData] = useState(initialFormData);
  const [walkoutId, setWalkoutId] = useState(null);
  const [visibleFields, setVisibleFields] = useState({});
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Load existing walkout on mount
  useEffect(() => {
    checkExistingWalkout();
  }, [appointment._id]);

  // Update visibility when form data changes
  useEffect(() => {
    updateFieldVisibility(formData);
  }, [formData]);

  const value = {
    formData,
    setFormData,
    walkoutId,
    setWalkoutId,
    visibleFields,
    errors,
    setErrors,
    isLoading,
    handleFieldChange,
    handleSubmit,
    validateForm,
  };

  return (
    <WalkoutContext.Provider value={value}>{children}</WalkoutContext.Provider>
  );
}

export function useWalkout() {
  const context = useContext(WalkoutContext);
  if (!context) {
    throw new Error("useWalkout must be used within WalkoutProvider");
  }
  return context;
}

// Usage in components
function PatientCameSection() {
  const { formData, visibleFields, errors, handleFieldChange } = useWalkout();

  return (
    <RadioField
      label="Did patient come?"
      name="patientCame"
      value={formData.patientCame}
      options={patientCameOptions}
      onChange={handleFieldChange}
      error={errors.patientCame}
      required={true}
      visible={visibleFields.patientCame}
    />
  );
}
```

---

## 4. Form Validation Logic

### Real-time Validation (As User Types)

```javascript
function useFieldValidation(fieldName, value, formData) {
  const [error, setError] = useState("");

  useEffect(() => {
    // Debounce validation
    const timer = setTimeout(() => {
      const errorMsg = validateField(fieldName, value, formData);
      setError(errorMsg);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, formData]);

  return error;
}

function validateField(fieldName, value, formData) {
  switch (fieldName) {
    case "patientCame":
      if (value === undefined || value === null) {
        return "Please select whether patient came or not";
      }
      break;

    case "lastFourDigitsCheckForte":
      if (
        formData.patientPortionPrimaryMode === 4 ||
        formData.patientPortionSecondaryMode === 4
      ) {
        if (!value) {
          return "Last 4 digits are required for Check/Forte payment";
        }
        if (value.toString().length !== 4) {
          return "Please enter exactly 4 digits";
        }
      }
      break;

    case "errorFixRemarks":
      if (formData.ruleEngineRun === 1 && formData.ruleEngineError === 1) {
        if (!value || value.trim() === "") {
          return "Error fix remarks are required";
        }
      }
      break;

    // Add more field-specific validations
  }

  return "";
}
```

---

## 5. UI/UX Best Practices

### Visual Feedback for Calculated Fields

```jsx
function DifferenceDisplay({ difference }) {
  let statusClass = "neutral";
  let statusText = "Exact Match";
  let statusIcon = "✓";

  if (difference < 0) {
    statusClass = "negative";
    statusText = "Collected Less";
    statusIcon = "⚠";
  } else if (difference > 0) {
    statusClass = "positive";
    statusText = "Collected More";
    statusIcon = "ⓘ";
  }

  return (
    <div className={`difference-display ${statusClass}`}>
      <span className="icon">{statusIcon}</span>
      <span className="amount">${Math.abs(difference).toFixed(2)}</span>
      <span className="status">{statusText}</span>
    </div>
  );
}
```

### Progressive Form Sections

```jsx
function WalkoutForm() {
  return (
    <form onSubmit={handleSubmit}>
      {/* Section 1: Patient Status - Always Visible */}
      <FormSection title="Patient Status" icon="👤" isOpen={true}>
        <RadioField name="patientCame" ... />
      </FormSection>

      {/* Section 2: Basic Info - Visible if patient came */}
      {visibleFields.postOpZeroProduction && (
        <FormSection title="Basic Information" icon="📋">
          <RadioField name="postOpZeroProduction" ... />
          <RadioField name="patientType" ... />
          <RadioField name="hasInsurance" ... />
        </FormSection>
      )}

      {/* Section 3: Payment - Visible if not post-op zero */}
      {visibleFields.paymentSection && (
        <FormSection title="Payment Information" icon="💰">
          <NumberField name="expectedPatientPortionOfficeWO" ... />
          <DropdownField name="patientPortionPrimaryMode" ... />
          {/* More payment fields */}
        </FormSection>
      )}

      {/* Section 4: Rule Engine */}
      {visibleFields.ruleEngineSection && (
        <FormSection title="Rule Engine" icon="⚙️">
          <RadioField name="ruleEngineRun" ... />
          {/* Conditional fields */}
        </FormSection>
      )}

      {/* Section 5: Documents */}
      {visibleFields.documentSection && (
        <FormSection title="Documents & Checkboxes" icon="📄">
          <CheckboxField name="signedGeneralConsent" ... />
          {/* More checkboxes */}
        </FormSection>
      )}

      {/* Section 6: Notes - Always Visible */}
      <FormSection title="Notes" icon="📝">
        <TextareaField name="newOfficeNote" ... />
      </FormSection>

      <div className="form-actions">
        <button type="button" onClick={handleCancel}>
          Cancel
        </button>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : (walkoutId ? 'Update' : 'Submit')}
        </button>
      </div>
    </form>
  );
}
```

### Loading States

```jsx
function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

function WalkoutFormContainer() {
  if (isLoading && !formData.patientCame) {
    return <LoadingOverlay message="Checking for existing walkout..." />;
  }

  return (
    <div className="walkout-form-container">
      {isLoading && <LoadingOverlay message="Submitting form..." />}
      <WalkoutForm />
    </div>
  );
}
```

---

## 6. Testing Checklist

### Manual Testing Scenarios

#### ✅ Scenario 1: Patient Didn't Come

- [ ] Select "Patient Didn't Come"
- [ ] Verify all other fields are hidden
- [ ] Submit form
- [ ] Verify backend receives only: appointmentId, openTime, patientCame=2
- [ ] Verify walkoutStatus = "patient_not_came"
- [ ] Verify submitToLC3 is null

#### ✅ Scenario 2: Post-Op Zero Production

- [ ] Select "Patient Came"
- [ ] Select "Post-Op Zero Production = Yes"
- [ ] Fill basic fields (patientType, hasInsurance, googleReviewRequest)
- [ ] Verify payment section is hidden
- [ ] Verify document section is hidden
- [ ] Submit form
- [ ] Verify walkoutStatus = "office_submitted"
- [ ] Verify submitToLC3 is set

#### ✅ Scenario 3: Insurance Chain

- [ ] Select "Has Insurance = Yes"
- [ ] Verify insuranceType field appears
- [ ] Select insuranceType = 2
- [ ] Verify insurance field appears
- [ ] Select insuranceType = 4 (not 2 or 6)
- [ ] Verify insurance field disappears
- [ ] Submit form
- [ ] Verify insurance field NOT in payload

#### ✅ Scenario 4: Payment Modes

- [ ] Fill expectedPatientPortionOfficeWO = 150
- [ ] Select primary payment mode
- [ ] Verify amount field appears for primary
- [ ] Enter amount for primary = 100
- [ ] Verify patientPortionCollected auto-calculates to 100
- [ ] Verify difference auto-calculates to 50
- [ ] Select secondary payment mode
- [ ] Enter amount for secondary = 50
- [ ] Verify patientPortionCollected updates to 150
- [ ] Verify difference updates to 0

#### ✅ Scenario 5: Check/Forte Validation

- [ ] Select payment mode = 4 (Check/Forte)
- [ ] Verify lastFourDigitsCheckForte field appears
- [ ] Try to submit without entering digits
- [ ] Verify error: "Last 4 digits required"
- [ ] Enter 3 digits
- [ ] Verify error: "Please enter exactly 4 digits"
- [ ] Enter 4 digits
- [ ] Verify validation passes

#### ✅ Scenario 6: Negative Difference

- [ ] Set expected = 100
- [ ] Set collected = 75
- [ ] Verify difference = -25
- [ ] Verify reasonLessCollection dropdown appears
- [ ] Try to submit without selecting reason
- [ ] Verify error message
- [ ] Select reason
- [ ] Verify validation passes

#### ✅ Scenario 7: Rule Engine Error Flow

- [ ] Select ruleEngineRun = Yes
- [ ] Verify ruleEngineError field appears
- [ ] Select ruleEngineError = Yes
- [ ] Verify errorFixRemarks and issuesFixed fields appear
- [ ] Try to submit with empty remarks
- [ ] Verify error message
- [ ] Fill remarks and select issuesFixed
- [ ] Verify validation passes

#### ✅ Scenario 8: Rule Engine Didn't Run

- [ ] Select ruleEngineRun = No
- [ ] Verify ruleEngineError field disappears
- [ ] Verify ruleEngineNotRunReason dropdown appears
- [ ] Try to submit without selecting reason
- [ ] Verify error message
- [ ] Select reason
- [ ] Verify validation passes

#### ✅ Scenario 9: Update Existing Walkout

- [ ] Open form for appointment with existing walkout
- [ ] Verify all existing data is loaded
- [ ] Modify some fields
- [ ] Add new office note
- [ ] Submit update
- [ ] Verify submitToLC3 timestamp DID NOT change
- [ ] Verify lastUpdateOn timestamp DID change
- [ ] Verify new note added to historical notes array

#### ✅ Scenario 10: Complete Happy Path

- [ ] Select patientCame = Yes
- [ ] Select postOpZeroProduction = No
- [ ] Fill all basic info
- [ ] Select hasInsurance = Yes
- [ ] Select insuranceType = 2
- [ ] Select specific insurance
- [ ] Fill expected amount = 200
- [ ] Select primary mode, enter 150
- [ ] Select secondary mode, enter 50
- [ ] Verify collected = 200, difference = 0
- [ ] Select ruleEngineRun = Yes
- [ ] Select ruleEngineError = No
- [ ] Check all 5 mandatory checkboxes
- [ ] Add office note
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify walkoutId is saved

---

## 7. Common Pitfalls & Solutions

### Pitfall 1: Sending Hidden Fields

❌ **Problem**: Sending fields that should be hidden/skipped

```javascript
// WRONG - Sends all fields regardless of visibility
const payload = formData;
```

✅ **Solution**: Clean payload based on visibility rules

```javascript
// CORRECT - Only send relevant fields
const payload = prepareSubmitPayload(); // Function that checks conditions
```

### Pitfall 2: Not Updating Visibility on Field Change

❌ **Problem**: Fields don't hide/show when values change

```javascript
// WRONG - Visibility only set on mount
const [visibleFields, setVisibleFields] = useState(initialVisibility);
```

✅ **Solution**: Update visibility whenever form data changes

```javascript
// CORRECT - Reactive visibility
useEffect(() => {
  updateFieldVisibility(formData);
}, [formData]);
```

### Pitfall 3: Forgetting Auto-calculations

❌ **Problem**: User has to manually calculate difference

✅ **Solution**: Calculate automatically

```javascript
useEffect(() => {
  const expected = parseFloat(formData.expectedPatientPortionOfficeWO) || 0;
  const collected = parseFloat(formData.patientPortionCollected) || 0;
  const diff = expected - collected;

  setFormData((prev) => ({
    ...prev,
    differenceInPatientPortion: diff,
  }));
}, [formData.expectedPatientPortionOfficeWO, formData.patientPortionCollected]);
```

### Pitfall 4: Not Preserving submitToLC3

❌ **Problem**: submitToLC3 changes on update

✅ **Solution**: Backend handles this correctly, don't send it in update

```javascript
// CORRECT - Backend preserves submitToLC3 automatically
// Just send updated fields, backend will handle timestamp logic
```

### Pitfall 5: Not Checking for Existing Walkout

❌ **Problem**: Creating duplicate walkouts for same appointment

✅ **Solution**: Always check on form open

```javascript
useEffect(() => {
  async function init() {
    const existing = await checkExistingWalkout(appointmentId);
    if (existing) {
      loadExistingData(existing);
    }
  }
  init();
}, [appointmentId]);
```

### Pitfall 6: Validating Hidden Fields

❌ **Problem**: Showing errors for fields that aren't visible

```javascript
// WRONG - Validates all fields
if (!formData.insurance) {
  errors.insurance = "Required";
}
```

✅ **Solution**: Only validate visible fields

```javascript
// CORRECT - Conditional validation
if (
  formData.hasInsurance === 1 &&
  (formData.insuranceType === 2 || formData.insuranceType === 6)
) {
  if (!formData.insurance) {
    errors.insurance = "Required";
  }
}
```

### Pitfall 7: Incorrect Data Types

❌ **Problem**: Sending strings instead of numbers

```javascript
// WRONG
patientCame: "1"; // String
lastFourDigitsCheckForte: "1234"; // String
```

✅ **Solution**: Parse to correct data types

```javascript
// CORRECT
patientCame: parseInt(value); // Number
lastFourDigitsCheckForte: parseInt(value); // Number
expectedPatientPortionOfficeWO: parseFloat(value); // Number with decimals
```

---

## Summary - Part 4

✅ Complete implementation guide with step-by-step instructions  
✅ Real code examples for all field types  
✅ State management strategies  
✅ Validation logic with error handling  
✅ UI/UX best practices for progressive disclosure  
✅ Comprehensive testing checklist  
✅ Common pitfalls and their solutions

---

## Final Implementation Checklist

### Before Starting Development

- [ ] Read all 4 parts of documentation
- [ ] Understand conditional validation cascade
- [ ] Understand show/hide element rules
- [ ] Set up API endpoints and authentication

### During Development

- [ ] Implement field visibility logic
- [ ] Implement auto-calculations
- [ ] Implement frontend validation
- [ ] Implement payload cleaning
- [ ] Handle appointmentId properly
- [ ] Check for existing walkout on form open
- [ ] Save walkoutId after first submit
- [ ] Use walkoutId for updates

### Before Deployment

- [ ] Test all 10 scenarios from testing checklist
- [ ] Verify fields hide/show correctly
- [ ] Verify calculations work correctly
- [ ] Verify validation messages are clear
- [ ] Test with existing walkout data
- [ ] Verify submitToLC3 doesn't change on update
- [ ] Test error handling
- [ ] Test on different browsers

### Post-Deployment

- [ ] Monitor API errors
- [ ] Collect user feedback
- [ ] Watch for validation issues
- [ ] Check for performance problems

---

_Document Created: January 1, 2026_  
_For: Frontend Developer Implementation_  
_Backend API Version: 1.0_

**All 4 Parts Complete! You now have everything needed to implement the Office Section successfully.**
