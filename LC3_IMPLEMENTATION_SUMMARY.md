# LC3 Section Implementation Summary

## Overview

Complete LC3 (Level 3) section implementation for walkout forms with 6 main fieldsets (A-F) plus remarks (G), flexible status flow, and comprehensive data tracking with **ALL FIELDS** as per requirements.

## Implementation Date

December 2024 - January 2026 (Updated)

## ⚠️ IMPORTANT: Complete Schema Documentation

**For complete field-by-field documentation with all details, please refer to:**
📄 **[LC3_COMPLETE_SCHEMA_DOCUMENTATION.md](./LC3_COMPLETE_SCHEMA_DOCUMENTATION.md)**

This summary provides an overview. The complete documentation includes:

- Detailed field descriptions for all 6 sections
- Complete field lists with types and purposes
- API request/response examples
- Question texts for each field
- Complete schema definitions

---

## 1. Database Schema Overview (Walkout Model)

### New Schemas Added to `models/Walkout.js`:

#### a) `lc3FailedRuleSchema`

- **Purpose**: Track failed rules from rule engine
- **Fields**:
  - `message` (String): Rule failure message
  - `resolved` (Number): Radio button incrementalId (Yes/No)

#### b) `lc3HistoricalNoteSchema`

- **Purpose**: Track historical on-hold notes with audit trail
- **Fields**:
  - `note` (String, required): The note content
  - `addedBy` (ObjectId, ref: User): User who added the note
  - `addedAt` (Date): When the note was added

#### c) `lc3SectionSchema` - Complete 6 Section Implementation

**See [LC3_COMPLETE_SCHEMA_DOCUMENTATION.md](./LC3_COMPLETE_SCHEMA_DOCUMENTATION.md) for complete field lists**

**Section Summary:**

##### A. Rule Engine Check (`ruleEngine`) - 5+ fields

- Fieldset status, rule execution tracking, unique IDs, failed rules array, dynamic responses

##### B. Document Check (`documentCheck`) - 10 fields

- Fieldset status, 8 document availability dropdowns, ortho questionnaire

##### C. Attachments Check (`attachmentsCheck`) - 6 fields

- Fieldset status, 5 X-ray/attachment availability fields

##### D. Patient Portion Check (`patientPortionCheck`) - 15 fields

- Fieldset status
- Office calculations (3 fields): expectedPPOffice, ppCollectedOffice, ppDifferenceOffice
- NVD question
- LC3 calculations (2 fields): expectedPPLC3, ppDifferenceLC3
- Primary payment verification (3 fields): mode, amount, verification source
- Secondary payment verification (3 fields): mode, amount, verification source
- Bottom questions (2 fields): check verification, Forte check availability

##### E. Production Details (`productionDetails`) - 24 fields

- Fieldset status
- Office production calculations (3 fields): total, est insurance, expected PP
- LC3 production calculations (3 fields): total, est insurance, expected PP
- Differences [LC3 - Office] (3 fields): total, insurance, PP
- Reason fields (2 fields): total production, est insurance
- Explanation fields (2 fields): total production, est insurance
- Walkout questions (9 fields): office manager informed, google review, crown/denture/implant questions, hold status, hold reasons array, other notes, deficiency completion

##### F. Provider Notes (`providerNotes`) - 10 fields

- Fieldset status
- 3 main questions: doctor note completed, notes updated on DOS, four elements check
- 4 element checkboxes: noteElement1-4
- 2 text areas: providerNotes, hygienistNotes

##### G. Remarks - 1 field

- `lc3Remarks`: String - Additional remarks text area

**Additional System Fields:**

- `lc3HistoricalNotes`: Array of Strings
- `onHoldNotes`: Array of lc3HistoricalNoteSchema
- `lc3SubmittedAt`, `lc3SubmittedBy`: First submission tracking
- `lc3LastUpdatedAt`, `lc3LastUpdatedBy`: Last update tracking

---

- `onHoldNotes`: Array of lc3HistoricalNoteSchema - Historical notes
- `lc3SubmittedAt`: Date - First submission timestamp
- `lc3SubmittedBy`: ObjectId (ref: User) - First submission user
- `lc3LastUpdatedAt`: Date - Last update timestamp
- `lc3LastUpdatedBy`: ObjectId (ref: User) - Last update user

---

## 2. API Endpoints

### A. Submit/Update LC3 Section

**Endpoint**: `PUT /api/walkouts/:id/lc3`  
**Authentication**: Required (Bearer token)  
**Access**: All authenticated users

#### Request Body:

```json
{
  "ruleEngine": {
    "fieldsetStatus": "complete",
    "didLc3RunRules": 1,
    "ruleEngineUniqueId": "RE-2026-12345",
    "failedRules": [
      {
        "message": "Missing pre-authorization",
        "resolved": false
      }
    ]
  },
  "documentCheck": {
    "fieldsetStatus": "complete",
    "signedGeneralConsent": 1,
    "signedTreatmentConsent": 1
    // ... other fields
  },
  "attachmentsCheck": {
    /* ... */
  },
  "patientPortionCheck": {
    /* ... */
  },
  "productionDetails": {
    /* ... */
  },
  "providerNotes": {
    /* ... */
  },
  "lc3Remarks": "All documents verified",
  "onHoldNote": "Waiting for insurance confirmation"
}
```

#### Features:

- ✅ Validates that office section is submitted first
- ✅ Merges updates with existing LC3 data (partial updates supported)
- ✅ All fieldsets are optional
- ✅ Adds `onHoldNote` to `onHoldNotes` array if provided
- ✅ Tracks first submission and subsequent updates
- ✅ Updates `walkoutStatus` to "lc3_submitted" on first submit

#### Response:

```json
{
  "success": true,
  "message": "LC3 section submitted successfully",
  "data": {
    /* complete walkout object */
  }
}
```

### B. Get Walkout with LC3 Data

**Endpoint**: `GET /api/walkouts/:id`  
**Authentication**: Required  
**Description**: Returns complete walkout including LC3 section (if exists)

---

## 3. Controller Functions

### `submitLc3Section` (walkoutController.js)

**Location**: `controllers/walkoutController.js`  
**Exported**: Yes

**Logic Flow**:

1. Find walkout by ID
2. Validate office section is submitted
3. Initialize `lc3Section` if not exists
4. Merge each fieldset update with existing data
5. Add on-hold note if provided
6. Update submission metadata
7. Set status to "lc3_submitted" on first submit
8. Save and return complete walkout

**Error Handling**:

- 404: Walkout not found
- 400: Office section not submitted
- 500: Server error

---

## 4. Routes Configuration

### Updated `routes/walkoutRoutes.js`:

```javascript
const {
  submitOfficeSection,
  getAllWalkouts,
  getWalkoutById,
  updateOfficeSection,
  submitLc3Section, // ✅ NEW
  deleteWalkout,
} = require("../controllers/walkoutController");

// ✅ NEW ROUTE
router.put("/:id/lc3", protect, submitLc3Section);
```

---

## 5. Postman Collections

### Updated Collections:

1. ✅ `postman/walkouts.postman_collection.json`
2. ✅ `postman/Walkout-Complete.postman_collection.json`

### New API Added:

**Name**: "Submit LC3 Section"  
**Method**: PUT  
**URL**: `{{base_url}}/api/walkouts/{{walkout_id}}/lc3`  
**Auth**: Bearer Token  
**Features**:

- Auto-saves success responses
- Comprehensive example body with all 6 fieldsets
- Includes test script for logging

---

## 6. Status Flow

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

**Note**: Status flow is flexible and primarily frontend-managed. Backend only auto-updates to `lc3_submitted` on first LC3 submission.

---

## 7. Key Design Decisions

### ✅ Single GET API Approach

- No separate LC3 GET endpoint needed
- `GET /api/walkouts/:id` returns complete walkout including LC3 section
- Simplifies frontend data management

### ✅ Frontend Calculations

- `differenceInPPWalkoutVsLC3`: Calculated in frontend
- `differenceInProdWalkoutVsLC3`: Calculated in frontend
- Backend only stores values, no validation logic

### ✅ Flexible Status Management

- Status transitions primarily managed by frontend
- Backend auto-updates only for critical state changes
- Allows for future status refinement without backend changes

### ✅ Partial Updates Support

- All fieldsets are optional in PUT request
- Merges updates with existing data
- Supports incremental form filling

### ✅ Historical Note Tracking

- `onHoldNotes` array with timestamps and user references
- Audit trail for all on-hold decisions
- Add new notes via `onHoldNote` field in request body

---

## 8. Testing Instructions

### Using Postman:

1. **Login/Signup** to get auth token (auto-saved)
2. **Submit Office Section** (auto-saves walkout_id)
3. **Submit LC3 Section** using saved walkout_id
   - Can submit all fieldsets at once
   - Or submit fieldsets incrementally
4. **Get Walkout by ID** to verify LC3 data

### Example Test Scenarios:

#### Scenario 1: Complete LC3 Submission

```bash
PUT /api/walkouts/{{walkout_id}}/lc3
# Include all 6 fieldsets in body
# Expected: 200 OK, status → lc3_submitted
```

#### Scenario 2: Partial Update

```bash
PUT /api/walkouts/{{walkout_id}}/lc3
# Include only ruleEngine and documentCheck
# Expected: 200 OK, other fieldsets unchanged
```

#### Scenario 3: Add On-Hold Note

```bash
PUT /api/walkouts/{{walkout_id}}/lc3
{
  "onHoldNote": "Waiting for additional documents"
}
# Expected: Note added to onHoldNotes array
```

---

## 9. Files Modified

### Core Files:

1. ✅ `models/Walkout.js` - Added 3 new schemas (214 lines added)
2. ✅ `controllers/walkoutController.js` - Added submitLc3Section (150 lines added)
3. ✅ `routes/walkoutRoutes.js` - Added LC3 route (2 lines modified)

### Postman Collections:

4. ✅ `postman/walkouts.postman_collection.json` - Added LC3 API
5. ✅ `postman/Walkout-Complete.postman_collection.json` - Added LC3 API

---

## 10. Validation Rules

### Office Section Validation:

- ❌ Cannot submit LC3 if office section not submitted
- ✅ Returns 400 error with clear message

### LC3 Field Validation:

- ✅ All fieldsets optional (for partial updates)
- ✅ Field types validated by Mongoose schema
- ✅ No business logic validation (frontend responsibility)

---

## 11. Future Enhancements (Not Implemented)

- [ ] LC3 fieldset-level validation
- [ ] Auto-calculation of difference fields in backend
- [ ] Status transition validation
- [ ] Audit section implementation
- [ ] LC3 approval workflow
- [ ] Email notifications on LC3 submission

---

## 12. API Response Examples

### Success Response:

```json
{
  "success": true,
  "message": "LC3 section submitted successfully",
  "data": {
    "_id": "abc123",
    "userId": "user123",
    "formRefId": "FORM-2026-001",
    "walkoutStatus": "lc3_submitted",
    "officeSection": {
      /* ... */
    },
    "lc3Section": {
      "ruleEngine": {
        /* ... */
      },
      "documentCheck": {
        /* ... */
      },
      "attachmentsCheck": {
        /* ... */
      },
      "patientPortionCheck": {
        /* ... */
      },
      "productionDetails": {
        /* ... */
      },
      "providerNotes": {
        /* ... */
      },
      "lc3Remarks": "All verified",
      "onHoldNotes": [
        {
          "_id": "note123",
          "note": "Waiting for confirmation",
          "addedBy": "user123",
          "addedAt": "2024-12-15T10:30:00Z"
        }
      ],
      "lc3SubmittedAt": "2024-12-15T10:30:00Z",
      "lc3SubmittedBy": "user123",
      "lc3LastUpdatedAt": "2024-12-15T10:30:00Z",
      "lc3LastUpdatedBy": "user123"
    },
    "createdAt": "2024-12-15T09:00:00Z",
    "updatedAt": "2024-12-15T10:30:00Z"
  }
}
```

### Error Response (Office Not Submitted):

```json
{
  "success": false,
  "message": "Office section must be submitted before LC3 section"
}
```

---

## 13. Notes for Frontend Team

### Key Points:

1. **Calculate Differences**: Frontend must calculate:

   - `differenceInPPWalkoutVsLC3`
   - `differenceInProdWalkoutVsLC3`

2. **Partial Updates**: Can submit any fieldset independently

3. **On-Hold Notes**: Use `onHoldNote` (singular) to add notes, backend manages array

4. **Status Management**: Frontend controls most status transitions

5. **Data Retrieval**: Use existing `GET /api/walkouts/:id` - no separate LC3 endpoint

---

## Implementation Complete ✅

All LC3 section functionality has been implemented, tested, and documented. The system is ready for frontend integration and testing.
