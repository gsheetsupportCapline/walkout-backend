# Walkout Form - Office Section Frontend Implementation Guide

## Part 1: Overview, Architecture & Field Definitions

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [AppointmentId Integration](#appointmentid-integration)
4. [Complete Field Definitions](#complete-field-definitions)
5. [Data Types & Storage Format](#data-types--storage-format)

---

## 1. Overview

### Purpose

The Office Section is the first step of the Walkout Form workflow where the office team collects patient visit data, payment information, and required documentation details.

### Key Characteristics

- **Conditional Validation**: Fields are required or hidden based on previous field values
- **Multi-level Logic**: 16 levels of validation cascade
- **Dynamic UI**: Elements show/hide based on user selections
- **Number-based Storage**: All radio buttons and dropdowns store incremental ID numbers (not text)
- **Real-time Calculations**: Some fields are calculated on frontend (e.g., difference)
- **Historical Notes**: Track all notes with timestamps and user info

### Workflow States

```
Form Open (draft)
    → Patient Didn't Come (patient_not_came) [END]
    → Patient Came → Office Submit (office_submitted)
        → LC3 Section (pending implementation)
```

---

## 2. Architecture & Data Flow

### Backend Base URL

```
{{base_url}}/api/walkouts
```

### Authentication

**Required**: All endpoints require JWT authentication

```javascript
Headers: {
  "Authorization": "Bearer <auth_token>",
  "Content-Type": "application/json"
}
```

### Data Flow Diagram

```
User Opens Form (Click Appointment)
    ↓
Set appointmentId (to map form with appointment)
    ↓
Set openTime (when form opened)
    ↓
User Fills Form Fields (conditional logic applies)
    ↓
Frontend Validates Required Fields
    ↓
Submit to Backend API
    ↓
Backend Re-validates & Saves
    ↓
Returns Complete Walkout Document
    ↓
Save walkoutId for Future Updates
```

### State Management Flow

```javascript
// Initial State
{
  walkoutId: null,        // After submit, save this
  appointmentId: "xyz123", // From clicked appointment
  openTime: new Date(),    // When form opened
  formData: { ... },       // All form fields
  isDraft: true            // Until submitted
}

// After First Submit
{
  walkoutId: "abc456",     // SAVE THIS - returned from API
  appointmentId: "xyz123", // Already saved
  submitToLC3: "2026-01-01T10:30:00Z", // First submit time
  walkoutStatus: "office_submitted"    // or "patient_not_came"
}

// On Re-open Same Appointment
{
  // Search by appointmentId to find existing walkout
  // Load walkoutId and all existing data
  // submitToLC3 will NOT change on updates
}
```

---

## 3. AppointmentId Integration

### What is appointmentId?

`appointmentId` is the unique identifier of the appointment that the user clicked to open the walkout form. This creates a mapping between the appointment and the walkout document.

### Why Do We Need It?

1. **Form Persistence**: When user clicks the same appointment again, load the existing walkout data
2. **One-to-One Mapping**: One appointment = One walkout document
3. **Easy Retrieval**: Search walkouts by appointmentId to find the right document
4. **Audit Trail**: Track which appointment generated which walkout

### Implementation Steps

#### Step 1: Capture appointmentId on Form Open

```javascript
// When user clicks an appointment to open walkout form
function openWalkoutForm(appointment) {
  const appointmentId = appointment._id; // or appointment.id

  // Store in form state
  setFormState({
    appointmentId: appointmentId,
    openTime: new Date(),
    // ... other initial state
  });

  // Check if walkout already exists for this appointment
  checkExistingWalkout(appointmentId);
}
```

#### Step 2: Check for Existing Walkout

```javascript
async function checkExistingWalkout(appointmentId) {
  try {
    // Search for walkout with this appointmentId
    const response = await fetch(
      `${baseUrl}/api/walkouts?appointmentId=${appointmentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const result = await response.json();

    if (result.data && result.data.length > 0) {
      // Walkout exists - load existing data
      const existingWalkout = result.data[0];
      loadExistingWalkoutData(existingWalkout);
    } else {
      // New walkout - show empty form
      initializeNewForm();
    }
  } catch (error) {
    console.error("Error checking existing walkout:", error);
  }
}
```

#### Step 3: Include appointmentId in Submit Payload

```javascript
async function submitOfficeSection(formData) {
  const payload = {
    appointmentId: formData.appointmentId, // IMPORTANT: Include this
    openTime: formData.openTime,
    patientCame: formData.patientCame,
    // ... all other fields
  };

  const response = await fetch(`${baseUrl}/api/walkouts/submit-office`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (result.success) {
    // SAVE walkoutId for future updates
    const walkoutId = result.data._id;
    localStorage.setItem(`walkout_${formData.appointmentId}`, walkoutId);
  }
}
```

#### Step 4: Update Existing Walkout

```javascript
async function updateOfficeSection(walkoutId, formData) {
  const payload = {
    // appointmentId is already in the document, no need to send again
    patientCame: formData.patientCame,
    // ... all other updated fields
  };

  const response = await fetch(`${baseUrl}/api/walkouts/${walkoutId}/office`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
```

### appointmentId Best Practices

✅ **DO**:

- Save appointmentId immediately when form opens
- Use appointmentId to check for existing walkout before showing form
- Store mapping between appointmentId and walkoutId locally
- Include appointmentId in initial submit (first time)

❌ **DON'T**:

- Don't send appointmentId in update requests (already in DB)
- Don't allow multiple walkouts for same appointment
- Don't lose appointmentId reference after form submission

---

## 4. Complete Field Definitions

### 4.1 Radio Button Fields

**Storage Format**: Number (incremental ID from radio button set)

| Field Name             | Type   | Description                       | Possible Values        |
| ---------------------- | ------ | --------------------------------- | ---------------------- |
| `patientCame`          | Number | Did patient come for appointment? | 1 = Yes, 2 = No        |
| `postOpZeroProduction` | Number | Is this post-op zero production?  | 1 = Yes, 2 = No        |
| `patientType`          | Number | Type of patient                   | Numbers from radio set |
| `hasInsurance`         | Number | Does patient have insurance?      | 1 = Yes, 2 = No        |
| `insuranceType`        | Number | Type of insurance                 | 2, 6, or other numbers |
| `insurance`            | Number | Specific insurance                | Numbers from radio set |
| `googleReviewRequest`  | Number | Google review requested?          | Numbers from radio set |
| `ruleEngineRun`        | Number | Did rule engine run?              | 1 = Yes, 2 = No        |
| `ruleEngineError`      | Number | Rule engine error?                | 1 = Yes, 2 = No        |
| `issuesFixed`          | Number | Issues fixed?                     | 1 = Yes, 2 = No        |

### 4.2 Dropdown Fields

**Storage Format**: Number (incremental ID from dropdown set)

| Field Name                    | Type   | Description                | Values                  |
| ----------------------------- | ------ | -------------------------- | ----------------------- |
| `patientPortionPrimaryMode`   | Number | Primary payment mode       | 4 = Check/Forte, others |
| `patientPortionSecondaryMode` | Number | Secondary payment mode     | 4 = Check/Forte, others |
| `reasonLessCollection`        | Number | Reason for less collection | Numbers from dropdown   |
| `ruleEngineNotRunReason`      | Number | Why rule engine didn't run | Numbers from dropdown   |

### 4.3 Number Fields (Decimal Allowed)

**Storage Format**: Number (can be negative, can have decimals)

| Field Name                       | Type   | Description               | Can Be Zero? | Can Be Negative? |
| -------------------------------- | ------ | ------------------------- | ------------ | ---------------- |
| `expectedPatientPortionOfficeWO` | Number | Expected patient portion  | ✅ Yes       | ❌ No            |
| `patientPortionCollected`        | Number | Actual amount collected   | ✅ Yes       | ❌ No            |
| `differenceInPatientPortion`     | Number | Expected - Collected      | ✅ Yes       | ✅ Yes           |
| `amountCollectedPrimaryMode`     | Number | Amount via primary mode   | ✅ Yes       | ❌ No            |
| `amountCollectedSecondaryMode`   | Number | Amount via secondary mode | ✅ Yes       | ❌ No            |
| `lastFourDigitsCheckForte`       | Number | Last 4 digits of check    | ❌ No        | ❌ No            |

### 4.4 Text Fields

| Field Name        | Type   | Description                      | Max Length |
| ----------------- | ------ | -------------------------------- | ---------- |
| `errorFixRemarks` | String | Remarks on how errors were fixed | 1000 chars |
| `newOfficeNote`   | String | New note to add to history       | 500 chars  |

### 4.5 Boolean Fields (Checkboxes)

**Storage Format**: Boolean (true/false)

| Field Name               | Type    | Description                | Mandatory? |
| ------------------------ | ------- | -------------------------- | ---------- |
| `signedGeneralConsent`   | Boolean | General consent signed     | ✅ Yes     |
| `signedTreatmentConsent` | Boolean | Treatment consent signed   | ❌ No      |
| `preAuthAvailable`       | Boolean | Pre-auth available         | ❌ No      |
| `signedTxPlan`           | Boolean | Treatment plan signed      | ✅ Yes     |
| `perioChart`             | Boolean | Perio chart completed      | ❌ No      |
| `nvd`                    | Boolean | NVD completed              | ❌ No      |
| `xRayPanoAttached`       | Boolean | X-ray/Pano attached        | ✅ Yes     |
| `majorServiceForm`       | Boolean | Major service form         | ❌ No      |
| `routeSheet`             | Boolean | Route sheet                | ✅ Yes     |
| `prcUpdatedInRouteSheet` | Boolean | PRC updated in route sheet | ✅ Yes     |
| `narrative`              | Boolean | Narrative completed        | ❌ No      |

### 4.6 Special Fields

| Field Name            | Type     | Description               | Set By                 |
| --------------------- | -------- | ------------------------- | ---------------------- |
| `openTime`            | Date     | When form was opened      | Frontend               |
| `appointmentId`       | String   | ID of clicked appointment | Frontend               |
| `userId`              | ObjectId | User who created walkout  | Backend (auto)         |
| `submitToLC3`         | Date     | First submission time     | Backend (auto, once)   |
| `lastUpdateOn`        | Date     | Last update time          | Backend (auto, always) |
| `walkoutStatus`       | String   | Current status            | Backend (auto)         |
| `officeSubmittedBy`   | ObjectId | User who submitted        | Backend (auto)         |
| `officeSubmittedAt`   | Date     | Office submission time    | Backend (auto)         |
| `officeLastUpdatedAt` | Date     | Last office update        | Backend (auto)         |

---

## 5. Data Types & Storage Format

### Why Numbers for Radio/Dropdown?

Radio buttons and dropdowns store **incremental ID numbers** instead of text. This provides:

1. **Flexibility**: Change display text without database migration
2. **Efficiency**: Numbers are smaller and faster to query
3. **Consistency**: Same format across all radio/dropdown fields
4. **Backend Integration**: Direct mapping to button/dropdown sets

### Example Radio Button Set

```json
{
  "_id": "set123",
  "setName": "Patient Came",
  "buttons": [
    { "id": 1, "label": "Yes, Patient Came", "order": 1 },
    { "id": 2, "label": "No, Patient Did Not Come", "order": 2 }
  ]
}
```

### Frontend Implementation

```javascript
// Fetch radio button set
const patientCameSet = await fetchRadioSet("patient-came-set-id");

// Display in UI
patientCameSet.buttons.map((button) => (
  <input
    type="radio"
    name="patientCame"
    value={button.id} // Store the NUMBER
    label={button.label} // Display the TEXT
  />
));

// On submit
const formData = {
  patientCame: 1, // Send NUMBER, not "Yes"
};
```

### Number Field Format

```javascript
// Correct formats
expectedPatientPortionOfficeWO: 150.5; // ✅ Decimal allowed
differenceInPatientPortion: -25.0; // ✅ Negative allowed
lastFourDigitsCheckForte: 1234; // ✅ Integer

// Wrong formats
expectedPatientPortionOfficeWO: "150.50"; // ❌ String
differenceInPatientPortion: null; // ❌ Use 0 instead
lastFourDigitsCheckForte: "1234"; // ❌ String
```

### Boolean Field Format

```javascript
// Correct formats
signedGeneralConsent: true; // ✅
xRayPanoAttached: false; // ✅

// Wrong formats
signedGeneralConsent: "true"; // ❌ String
xRayPanoAttached: 1; // ❌ Number
routeSheet: null; // ❌ Use false instead
```

### Date Field Format

```javascript
// Correct formats
openTime: "2026-01-01T10:30:00.000Z"; // ✅ ISO 8601
openTime: new Date().toISOString(); // ✅

// Wrong formats
openTime: "2026-01-01"; // ❌ No time
openTime: "01/01/2026"; // ❌ Wrong format
openTime: 1704105000000; // ❌ Timestamp number
```

---

## Summary - Part 1

✅ Understood overall architecture and data flow  
✅ Learned appointmentId integration (CRITICAL for form persistence)  
✅ Reviewed all field definitions with data types  
✅ Understood why numbers are used for radio/dropdown  
✅ Learned correct data formats for all field types

**Next**: Part 2 will cover the complete conditional logic and validation rules (all 16 levels).

---

_Document Created: January 1, 2026_  
_For: Frontend Developer Implementation_  
_Backend API Version: 1.0_
