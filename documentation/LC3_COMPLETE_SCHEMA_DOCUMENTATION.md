# LC3 Section - Complete Schema Documentation

## Last Updated: January 8, 2026

---

## Database Schema Overview

All LC3 section data is stored in the `lc3Section` field of the Walkout model with 6 main fieldsets (A-F) plus remarks section (G).

---

## A. RULE ENGINE CHECK

### Schema Definition

```javascript
ruleEngine: {
  // Fieldset Status
  fieldsetStatus: Number,  // incrementalId from radio buttons (completed/pending)

  // Main Question
  didLc3RunRules: Number,  // incrementalId from radio buttons (Yes/No)

  // Conditional Fields
  ruleEngineUniqueId: String,  // Shows when "Yes" selected - Text input
  reasonForNotRun: Number,     // Shows when "No" selected - incrementalId from dropdown

  // Failed Rules Array (fetched from API when Yes + Unique ID entered)
  failedRules: [
    {
      message: String,    // Rule failure message from API
      resolved: Number    // incrementalId from radio buttons (Yes/No)
    }
  ],
  // Dynamic fields for each failed rule response handled as flexible schema
}
```

### Field Details

| Field                | Type   | Description                                             | Required    |
| -------------------- | ------ | ------------------------------------------------------- | ----------- |
| `fieldsetStatus`     | Number | Radio button incrementalId for completed/pending status | No          |
| `didLc3RunRules`     | Number | Radio button incrementalId (Yes/No)                     | No          |
| `ruleEngineUniqueId` | String | Text input - shows when "Yes" selected                  | Conditional |
| `reasonForNotRun`    | Number | Dropdown incrementalId - shows when "No" selected       | Conditional |
| `failedRules`        | Array  | Array of failed rules with message and resolved status  | No          |

---

## B. DOCUMENT CHECK

### Schema Definition

```javascript
documentCheck: {
  // Fieldset Status
  lc3DocumentCheckStatus: Number,  // incrementalId (completed/pending)

  // Document Availability Dropdowns (all use incrementalId)
  signedTreatmentPlanAvailable: Number,
  prcAvailable: Number,
  signedConsentGeneralAvailable: Number,
  nvdAvailable: Number,
  narrativeAvailable: Number,
  signedConsentTxAvailable: Number,
  preAuthAvailable: Number,
  routeSheetAvailable: Number,

  // Special Question
  orthoQuestionnaireAvailable: Number  // incrementalId from radio buttons (Yes/No/NA)
}
```

### Field Details

| Field                           | Type   | Description                            | Required |
| ------------------------------- | ------ | -------------------------------------- | -------- |
| `lc3DocumentCheckStatus`        | Number | Radio button incrementalId for status  | No       |
| `signedTreatmentPlanAvailable`  | Number | Dropdown incrementalId                 | No       |
| `prcAvailable`                  | Number | Dropdown incrementalId                 | No       |
| `signedConsentGeneralAvailable` | Number | Dropdown incrementalId                 | No       |
| `nvdAvailable`                  | Number | Dropdown incrementalId                 | No       |
| `narrativeAvailable`            | Number | Dropdown incrementalId                 | No       |
| `signedConsentTxAvailable`      | Number | Dropdown incrementalId                 | No       |
| `preAuthAvailable`              | Number | Dropdown incrementalId                 | No       |
| `routeSheetAvailable`           | Number | Dropdown incrementalId                 | No       |
| `orthoQuestionnaireAvailable`   | Number | Radio button incrementalId (Yes/No/NA) | No       |

---

## C. ATTACHMENTS CHECK

### Schema Definition

```javascript
attachmentsCheck: {
  // Fieldset Status
  lc3AttachmentsCheckStatus: Number,  // incrementalId (completed/pending)

  // X-ray Availability Dropdowns (all use incrementalId)
  pano: Number,
  fmx: Number,
  bitewing: Number,
  pa: Number,
  perioChart: Number
}
```

### Field Details

| Field                       | Type   | Description                                | Required |
| --------------------------- | ------ | ------------------------------------------ | -------- |
| `lc3AttachmentsCheckStatus` | Number | Radio button incrementalId for status      | No       |
| `pano`                      | Number | Dropdown incrementalId for Panoramic X-ray | No       |
| `fmx`                       | Number | Dropdown incrementalId for FMX             | No       |
| `bitewing`                  | Number | Dropdown incrementalId for Bitewing        | No       |
| `pa`                        | Number | Dropdown incrementalId for PA              | No       |
| `perioChart`                | Number | Dropdown incrementalId for Perio Chart     | No       |

---

## D. PATIENT PORTION CHECK

### Schema Definition

```javascript
patientPortionCheck: {
  // Fieldset Status
  lc3PatientPortionStatus: Number,  // incrementalId (completed/pending)

  // ========== Patient Portion Calculations by Office ==========
  expectedPPOffice: Number,           // Expected PP per Office (amount)
  ppCollectedOffice: Number,          // PP Collected by Office per Eaglesoft
  ppDifferenceOffice: Number,         // Difference (auto-calculated or manual)

  // NVD Question
  signedNVDForDifference: Number,     // incrementalId from radio buttons (Yes/No)

  // ========== Patient Portion Calculations by LC3 ==========
  expectedPPLC3: Number,              // Expected PP per LC3 (amount)
  ppDifferenceLC3: Number,            // Difference in Expected PP [LC3 vs. Office]

  // ========== Verification - Primary Mode ==========
  ppPrimaryMode: Number,              // incrementalId from dropdown
  amountPrimaryMode: Number,          // Amount collected
  paymentVerifiedFromPrimary: Number, // incrementalId from dropdown

  // ========== Verification - Secondary Mode ==========
  ppSecondaryMode: Number,            // incrementalId from dropdown
  amountSecondaryMode: Number,        // Amount collected
  paymentVerifiedFromSecondary: Number, // incrementalId from dropdown

  // ========== Bottom Questions ==========
  verifyCheckMatchesES: Number,       // incrementalId from radio buttons (Yes/No)
  forteCheckAvailable: Number         // incrementalId from radio buttons (Yes/No)
}
```

### Field Details

**Patient Portion Calculations by Office:**

| Field                     | Type   | Description                            | Required |
| ------------------------- | ------ | -------------------------------------- | -------- |
| `lc3PatientPortionStatus` | Number | Radio button incrementalId for status  | No       |
| `expectedPPOffice`        | Number | Expected PP per Office (amount field)  | No       |
| `ppCollectedOffice`       | Number | PP Collected by Office per Eaglesoft   | No       |
| `ppDifferenceOffice`      | Number | Difference (auto-calculated or manual) | No       |
| `signedNVDForDifference`  | Number | Radio button incrementalId (Yes/No)    | No       |

**Patient Portion Calculations by LC3:**

| Field             | Type   | Description                                | Required |
| ----------------- | ------ | ------------------------------------------ | -------- |
| `expectedPPLC3`   | Number | Expected PP per LC3 (amount field)         | No       |
| `ppDifferenceLC3` | Number | Difference in Expected PP [LC3 vs. Office] | No       |

**Verification of Payment - Primary Mode:**

| Field                        | Type   | Description                                  | Required |
| ---------------------------- | ------ | -------------------------------------------- | -------- |
| `ppPrimaryMode`              | Number | Dropdown incrementalId (Payment Mode)        | No       |
| `amountPrimaryMode`          | Number | Amount Collected Using Primary Mode          | No       |
| `paymentVerifiedFromPrimary` | Number | Dropdown incrementalId (Verification Source) | No       |

**Verification of Payment - Secondary Mode:**

| Field                          | Type   | Description                                  | Required |
| ------------------------------ | ------ | -------------------------------------------- | -------- |
| `ppSecondaryMode`              | Number | Dropdown incrementalId (Payment Mode)        | No       |
| `amountSecondaryMode`          | Number | Amount Collected Using Secondary Mode        | No       |
| `paymentVerifiedFromSecondary` | Number | Dropdown incrementalId (Verification Source) | No       |

**Bottom Questions:**

| Field                  | Type   | Description                         | Question Text                                                                                         | Required |
| ---------------------- | ------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- |
| `verifyCheckMatchesES` | Number | Radio button incrementalId (Yes/No) | _Did you verify if the attached check matches the payment posted in ES?_                              | No       |
| `forteCheckAvailable`  | Number | Radio button incrementalId (Yes/No) | _Do we have the uploaded Forte check available in SD, and does the entered ref# by the office match?_ | No       |

---

## E. PRODUCTION DETAILS AND WALKOUT SUBMISSION/HOLD

### Schema Definition

```javascript
productionDetails: {
  // Fieldset Status
  lc3ProductionStatus: Number,  // incrementalId (completed/pending)

  // ========== Production Calculations per Office Walkout ==========
  totalProductionOffice: Number,       // Amount field
  estInsuranceOffice: Number,          // Amount field
  expectedPPOfficeProduction: Number,  // Amount field (auto-calculated or manual)

  // ========== Production Calculations per LC3 Walkout ==========
  totalProductionLC3: Number,          // Amount field
  estInsuranceLC3: Number,             // Amount field
  expectedPPLC3Production: Number,     // Amount field (auto-calculated or manual)

  // ========== Difference [LC3 - Office] ==========
  totalProductionDifference: Number,   // Amount field (auto-calculated or manual)
  estInsuranceDifference: Number,      // Amount field (auto-calculated or manual)
  expectedPPDifference: Number,        // Amount field (auto-calculated or manual)

  // ========== Reason Fields ==========
  reasonTotalProductionDiff: Number,      // Dropdown incrementalId
  reasonEstInsuranceDiff: Number,         // Dropdown incrementalId

  // ========== Explanation Fields ==========
  explanationTotalProductionDiff: String, // Text field
  explanationEstInsuranceDiff: String,    // Text field

  // ========== Walkout Questions ==========
  informedOfficeManager: Number,          // Radio incrementalId (Yes/No/Pending)
  googleReviewSent: Number,               // Radio incrementalId (Yes/No/Pending)
  containsCrownDentureImplant: Number,    // Radio incrementalId (Yes/No/Pending)
  crownPaidOn: Number,                    // Radio incrementalId (Seat/Prep/NA etc.)
  deliveredAsPerNotes: Number,            // Radio incrementalId (Yes/No/Pending)
  walkoutOnHold: Number,                  // Radio incrementalId (Yes/No/Pending)
  onHoldReasons: [Number],                // Array of dropdown incrementalIds
  otherReasonNotes: String,               // Text field

  // ========== Final Question ==========
  completingWithDeficiency: Number        // Radio incrementalId (Yes/No/Pending)
}
```

### Field Details

**Production Calculations per Office Walkout:**

| Field                        | Type   | Description                              | Required |
| ---------------------------- | ------ | ---------------------------------------- | -------- |
| `lc3ProductionStatus`        | Number | Radio button incrementalId for status    | No       |
| `totalProductionOffice`      | Number | Total Production (Office) - Amount field | No       |
| `estInsuranceOffice`         | Number | Est. Insurance (Office) - Amount field   | No       |
| `expectedPPOfficeProduction` | Number | Expected PP (Office) - Amount field      | No       |

**Production Calculations per LC3 Walkout:**

| Field                     | Type   | Description                           | Required |
| ------------------------- | ------ | ------------------------------------- | -------- |
| `totalProductionLC3`      | Number | Total Production (LC3) - Amount field | No       |
| `estInsuranceLC3`         | Number | Est. Insurance (LC3) - Amount field   | No       |
| `expectedPPLC3Production` | Number | Expected PP (LC3) - Amount field      | No       |

**Difference between LC3 and Office [LC3 - Office]:**

| Field                       | Type   | Description                                | Required |
| --------------------------- | ------ | ------------------------------------------ | -------- |
| `totalProductionDifference` | Number | Total Production Difference - Amount field | No       |
| `estInsuranceDifference`    | Number | Est Insurance Difference - Amount field    | No       |
| `expectedPPDifference`      | Number | Expected PP Difference - Amount field      | No       |

**Reason and Explanation Fields:**

| Field                            | Type   | Description                       | Required |
| -------------------------------- | ------ | --------------------------------- | -------- |
| `reasonTotalProductionDiff`      | Number | Dropdown incrementalId for reason | No       |
| `reasonEstInsuranceDiff`         | Number | Dropdown incrementalId for reason | No       |
| `explanationTotalProductionDiff` | String | Explanation text field            | No       |
| `explanationEstInsuranceDiff`    | String | Explanation text field            | No       |

**Walkout Questions:**

| Field                         | Type          | Description                             | Question Text                                                            | Required |
| ----------------------------- | ------------- | --------------------------------------- | ------------------------------------------------------------------------ | -------- |
| `informedOfficeManager`       | Number        | Radio incrementalId (Yes/No/Pending)    | _Have we informed office manager on HQ for changes made in the walkout?_ | No       |
| `googleReviewSent`            | Number        | Radio incrementalId (Yes/No/Pending)    | _Has the request for a Google review been sent?_                         | No       |
| `containsCrownDentureImplant` | Number        | Radio incrementalId (Yes/No/Pending)    | _Does walkout contains Crown/Denture/Implant with Prep/Imp?_             | No       |
| `crownPaidOn`                 | Number        | Radio incrementalId (Seat/Prep/NA etc.) | _As per IV crown paid on -_                                              | No       |
| `deliveredAsPerNotes`         | Number        | Radio incrementalId (Yes/No/Pending)    | _Does crown/Denture/Implants delivered as per provider notes?_           | No       |
| `walkoutOnHold`               | Number        | Radio incrementalId (Yes/No/Pending)    | _Is Walkout getting on Hold?_                                            | No       |
| `onHoldReasons`               | Array[Number] | Multi-select dropdown incrementalIds    | _On Hold Reasons_                                                        | No       |
| `otherReasonNotes`            | String        | Text field                              | _Other Reason/Notes_                                                     | No       |
| `completingWithDeficiency`    | Number        | Radio incrementalId (Yes/No/Pending)    | _Is walkout completing with deficiency?_                                 | No       |

---

## F. PROVIDER NOTES

### Schema Definition

```javascript
providerNotes: {
  // Fieldset Status
  lc3ProviderNotesStatus: Number,  // incrementalId (completed/pending)

  // Provider Notes Questions (all radio buttons)
  doctorNoteCompleted: Number,           // incrementalId (Yes/No/Pending)
  notesUpdatedOnDOS: Number,             // incrementalId (Yes/No/Pending)
  noteIncludesFourElements: Number,      // incrementalId (Yes/No/Pending)

  // ========== 4 Required Elements Checkboxes ==========
  noteElement1: Boolean,                 // Checkbox - Element 1 present
  noteElement2: Boolean,                 // Checkbox - Element 2 present
  noteElement3: Boolean,                 // Checkbox - Element 3 present
  noteElement4: Boolean,                 // Checkbox - Element 4 present

  // ========== AI Check Status ==========
  checkedByAi: Boolean,                  // Checkbox - Notes verified using AI

  // ========== Notes Textareas ==========
  providerNotes: String,                 // Text area - Provider's notes
  hygienistNotes: String                 // Text area - Hygienist's notes
}
```

### Field Details

**Provider Notes Questions:**

| Field                      | Type   | Description                           | Question Text                               | Required |
| -------------------------- | ------ | ------------------------------------- | ------------------------------------------- | -------- |
| `lc3ProviderNotesStatus`   | Number | Radio button incrementalId for status | -                                           | No       |
| `doctorNoteCompleted`      | Number | Radio incrementalId (Yes/No/Pending)  | _Doctor Note Completed?_                    | No       |
| `notesUpdatedOnDOS`        | Number | Radio incrementalId (Yes/No/Pending)  | _Notes updated on DOS?_                     | No       |
| `noteIncludesFourElements` | Number | Radio incrementalId (Yes/No/Pending)  | _Does the Note include following 4 things?_ | No       |

**4 Required Elements Checkboxes:**

| Field          | Type    | Description                            | Required |
| -------------- | ------- | -------------------------------------- | -------- |
| `noteElement1` | Boolean | Checkbox - Element 1 present/validated | No       |
| `noteElement2` | Boolean | Checkbox - Element 2 present/validated | No       |
| `noteElement3` | Boolean | Checkbox - Element 3 present/validated | No       |
| `noteElement4` | Boolean | Checkbox - Element 4 present/validated | No       |

**AI Check Status:**

| Field         | Type    | Description                             | Required |
| ------------- | ------- | --------------------------------------- | -------- |
| `checkedByAi` | Boolean | Checkbox - Notes verified/checked by AI | No       |

**Provider and Hygienist Notes Textareas:**

| Field            | Type   | Description                            | Required |
| ---------------- | ------ | -------------------------------------- | -------- |
| `providerNotes`  | String | Text area - Provider's detailed notes  | No       |
| `hygienistNotes` | String | Text area - Hygienist's detailed notes | No       |

---

## G. REMARKS

### Schema Definition

```javascript
// G. REMARKS
lc3Remarks: String; // Text area - Long text field for any additional remarks
```

### Field Details

| Field        | Type   | Description                                            | Required |
| ------------ | ------ | ------------------------------------------------------ | -------- |
| `lc3Remarks` | String | Text area - Long text field for any additional remarks | No       |

---

## Additional Fields (System/Tracking)

### Historical Notes

```javascript
lc3HistoricalNotes: [String]; // Array of historical notes

onHoldNotes: [
  {
    note: String,
    addedBy: ObjectId, // Reference to User
    addedAt: Date,
  },
];
```

### Submission Metadata

```javascript
lc3SubmittedAt: Date; // First submission timestamp
lc3SubmittedBy: ObjectId; // Reference to User who first submitted
lc3LastUpdatedAt: Date; // Last update timestamp
lc3LastUpdatedBy: ObjectId; // Reference to User who last updated
```

---

## API Endpoint

### Submit/Update LC3 Section

**Endpoint:** `PUT /api/walkouts/:id/lc3`  
**Authentication:** Required (Bearer token)  
**Access:** All authenticated users

### Request Body Example

```json
{
  "ruleEngine": {
    "fieldsetStatus": 1,
    "didLc3RunRules": 1,
    "ruleEngineUniqueId": "RE-2026-12345",
    "failedRules": [
      {
        "message": "Missing pre-authorization",
        "resolved": 1
      }
    ]
  },
  "documentCheck": {
    "lc3DocumentCheckStatus": 1,
    "signedTreatmentPlanAvailable": 1,
    "prcAvailable": 2,
    "signedConsentGeneralAvailable": 1
  },
  "attachmentsCheck": {
    "lc3AttachmentsCheckStatus": 1,
    "pano": 1,
    "fmx": 2,
    "bitewing": 1
  },
  "patientPortionCheck": {
    "lc3PatientPortionStatus": 1,
    "expectedPPOffice": 250.5,
    "ppCollectedOffice": 250.0,
    "ppDifferenceOffice": -0.5,
    "signedNVDForDifference": 1,
    "expectedPPLC3": 250.5,
    "ppDifferenceLC3": 0,
    "ppPrimaryMode": 1,
    "amountPrimaryMode": 200.0,
    "paymentVerifiedFromPrimary": 1,
    "ppSecondaryMode": 2,
    "amountSecondaryMode": 50.0,
    "paymentVerifiedFromSecondary": 2,
    "verifyCheckMatchesES": 1,
    "forteCheckAvailable": 2
  },
  "productionDetails": {
    "lc3ProductionStatus": 1,
    "totalProductionOffice": 850.0,
    "estInsuranceOffice": 600.0,
    "expectedPPOfficeProduction": 250.0,
    "totalProductionLC3": 850.0,
    "estInsuranceLC3": 599.5,
    "expectedPPLC3Production": 250.5,
    "totalProductionDifference": 0,
    "estInsuranceDifference": -0.5,
    "expectedPPDifference": 0.5,
    "reasonTotalProductionDiff": 0,
    "reasonEstInsuranceDiff": 1,
    "explanationEstInsuranceDiff": "Minor calculation adjustment",
    "informedOfficeManager": 1,
    "googleReviewSent": 1,
    "containsCrownDentureImplant": 2,
    "walkoutOnHold": 2,
    "completingWithDeficiency": 2
  },
  "providerNotes": {
    "lc3ProviderNotesStatus": 1,
    "doctorNoteCompleted": 1,
    "notesUpdatedOnDOS": 1,
    "noteIncludesFourElements": 1,
    "noteElement1": true,
    "noteElement2": true,
    "noteElement3": true,
    "noteElement4": true,
    "checkedByAi": true,
    "providerNotes": "Patient responded well to treatment.",
    "hygienistNotes": "Oral hygiene improved since last visit."
  },
  "lc3Remarks": "All documents verified and processed."
}
```

### Response Example

```json
{
  "success": true,
  "message": "LC3 section submitted successfully",
  "data": {
    "_id": "walkout_id_here",
    "walkoutStatus": "lc3_submitted",
    "lc3Section": {
      // All LC3 data including metadata
      "lc3SubmittedAt": "2026-01-08T10:30:00Z",
      "lc3SubmittedBy": "user_id_here"
    }
  }
}
```

---

## Key Implementation Notes

1. **All Fields are Optional** - Supports partial updates and incremental form filling
2. **Field Status Fields** - Each fieldset has its own status field (Number type for radio button incrementalId)
3. **Number Fields** - All amount fields can be negative and decimal values
4. **Array Fields** - `failedRules` and `onHoldReasons` support arrays
5. **Flexible Schema** - Dynamic fields for failed rule responses handled flexibly
6. **Frontend Calculations** - Difference fields can be auto-calculated in frontend or manually entered
7. **Validation** - Office section must be submitted before LC3 section can be submitted

---

## Files Modified

1. ✅ `models/Walkout.js` - Complete LC3 schema with all fields
2. ✅ `controllers/walkoutController.js` - submitLc3Section function
3. ✅ `routes/walkoutRoutes.js` - PUT /:id/lc3 route
4. ✅ Postman collections updated with complete LC3 API examples

---

## Status Flow

```
draft
  ↓
office_submitted
  ↓
lc3_pending (optional - frontend managed)
  ↓
lc3_submitted (auto-set on first LC3 submit)
  ↓
audit_pending (future implementation)
  ↓
completed
```

---

**Last Updated:** January 8, 2026  
**Schema Version:** 2.0 - Complete Implementation
