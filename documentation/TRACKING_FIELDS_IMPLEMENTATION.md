# Tracking Fields Implementation Summary

## Overview

Added comprehensive timestamp and user tracking fields across Office Section, LC3 Section, Audit Section, and Root Level.

---

## 1. Office Section Fields

### New Fields Added to Model (`models/Walkout.js`)

```javascript
// Office Section Metadata
officeSubmittedBy: ObjectId (ref: User)
officeSubmittedAt: Date
officeFirstSubmittedAt: Date // NEW - Set only once, never updated
officeFirstSubmittedBy: ObjectId (ref: User) // NEW - Set only once, never updated
officeLastUpdatedAt: Date
officeLastUpdatedBy: ObjectId (ref: User) // NEW
```

### Behavior:

- **First Submit**: All fields are set when office section is submitted for the first time
- **Updates**: Only `officeLastUpdatedAt` and `officeLastUpdatedBy` are updated on subsequent updates
- **Preserved**: `officeFirstSubmittedAt` and `officeFirstSubmittedBy` never change after first submit

### API Changes:

- **POST `/api/walkouts/:id/office`** (Submit):
  - Sets all metadata fields on first submission
  - Accepts `currentStatus` and `pendingWith` from frontend (root level)

- **PUT `/api/walkouts/:id/office`** (Update):
  - Updates `officeLastUpdatedAt` and `officeLastUpdatedBy`
  - Preserves `officeFirstSubmittedAt` and `officeFirstSubmittedBy`
  - Updates `currentStatus` and `pendingWith` if provided

---

## 2. LC3 Section Fields

### New Fields Added to Model

```javascript
// LC3 Section Metadata
lc3SubmittedAt: Date
lc3SubmittedBy: ObjectId (ref: User)
lc3LastUpdatedAt: Date
lc3LastUpdatedBy: ObjectId (ref: User)
lc3CompletedAt: Date // NEW - Set only once when marked as completed
lc3CompletedBy: ObjectId (ref: User) // NEW - Set only once when marked as completed
```

### Behavior:

- **First Submit**: `lc3SubmittedAt` and `lc3SubmittedBy` are set
- **Every Update**: `lc3LastUpdatedAt` and `lc3LastUpdatedBy` are updated
- **Completion**: `lc3CompletedAt` and `lc3CompletedBy` are set only once (when `isCompleted` flag is true)

### API Changes:

- **POST `/api/walkouts/:id/lc3`** (Submit/Update):
  - Accepts new parameters:
    - `currentStatus` (string) - Root level field
    - `pendingWith` (string) - Root level field
    - `isCompleted` (boolean/string "true") - Flag to mark LC3 as completed
  - Updates `lc3LastUpdatedAt` and `lc3LastUpdatedBy` every time
  - Sets `lc3CompletedAt` and `lc3CompletedBy` only once if `isCompleted` is true

---

## 3. Audit Section Fields

### New Fields Added to Model

```javascript
// Audit Section Metadata
auditLastUpdatedAt: Date // NEW
auditLastUpdatedBy: ObjectId (ref: User) // NEW
```

### Behavior:

- Will be implemented when audit section is created
- Similar pattern to office and LC3 sections

---

## 4. Root Level Fields

### New Fields Added to Model

```javascript
// Root Level (Main Walkout Schema)
currentStatus: String; // NEW - Updated from frontend
pendingWith: String; // NEW - Updated from frontend
```

### Behavior:

- **Updated By**: Both office section and LC3 section APIs
- **Source**: Frontend sends these values
- **Purpose**: Track overall workflow status and assignment

---

## Usage Examples

### 1. Submit Office Section (First Time)

```javascript
POST /api/walkouts/:id/office
{
  "patientCame": 1,
  "currentStatus": "Pending LC3 Review",
  "pendingWith": "LC3 Team",
  // ... other office fields
}

// Database result:
{
  "officeSection": {
    "officeSubmittedAt": "2026-01-29T10:00:00Z",
    "officeSubmittedBy": "userId123",
    "officeFirstSubmittedAt": "2026-01-29T10:00:00Z", // Set once
    "officeFirstSubmittedBy": "userId123", // Set once
    "officeLastUpdatedAt": "2026-01-29T10:00:00Z",
    "officeLastUpdatedBy": "userId123"
  },
  "currentStatus": "Pending LC3 Review",
  "pendingWith": "LC3 Team"
}
```

### 2. Update Office Section

```javascript
PUT /api/walkouts/:id/office
{
  "patientCame": 1,
  "currentStatus": "Office Data Updated",
  "pendingWith": "LC3 Team",
  // ... other office fields
}

// Database result:
{
  "officeSection": {
    "officeSubmittedAt": "2026-01-29T10:00:00Z",
    "officeSubmittedBy": "userId123",
    "officeFirstSubmittedAt": "2026-01-29T10:00:00Z", // PRESERVED
    "officeFirstSubmittedBy": "userId123", // PRESERVED
    "officeLastUpdatedAt": "2026-01-29T11:00:00Z", // UPDATED
    "officeLastUpdatedBy": "userId456" // UPDATED
  },
  "currentStatus": "Office Data Updated", // UPDATED
  "pendingWith": "LC3 Team" // UPDATED
}
```

### 3. Submit LC3 Section

```javascript
POST /api/walkouts/:id/lc3
{
  "ruleEngine": {...},
  "documentCheck": {...},
  "currentStatus": "LC3 In Progress",
  "pendingWith": "Provider"
}

// Database result:
{
  "lc3Section": {
    "lc3SubmittedAt": "2026-01-29T12:00:00Z",
    "lc3SubmittedBy": "userId789",
    "lc3LastUpdatedAt": "2026-01-29T12:00:00Z",
    "lc3LastUpdatedBy": "userId789"
    // lc3CompletedAt and lc3CompletedBy are null (not completed yet)
  },
  "currentStatus": "LC3 In Progress",
  "pendingWith": "Provider"
}
```

### 4. Complete LC3 Section

```javascript
POST /api/walkouts/:id/lc3
{
  "productionDetails": {...},
  "isCompleted": true, // Mark as completed
  "currentStatus": "Completed",
  "pendingWith": "Archive"
}

// Database result:
{
  "lc3Section": {
    "lc3SubmittedAt": "2026-01-29T12:00:00Z",
    "lc3SubmittedBy": "userId789",
    "lc3LastUpdatedAt": "2026-01-29T13:00:00Z", // UPDATED
    "lc3LastUpdatedBy": "userId999", // UPDATED
    "lc3CompletedAt": "2026-01-29T13:00:00Z", // SET ONCE
    "lc3CompletedBy": "userId999" // SET ONCE
  },
  "currentStatus": "Completed",
  "pendingWith": "Archive"
}
```

### 5. Update LC3 After Completion

```javascript
POST /api/walkouts/:id/lc3
{
  "providerNotes": {...},
  "isCompleted": true, // Trying to mark as completed again
  "currentStatus": "Updated After Completion"
}

// Database result:
{
  "lc3Section": {
    "lc3SubmittedAt": "2026-01-29T12:00:00Z",
    "lc3SubmittedBy": "userId789",
    "lc3LastUpdatedAt": "2026-01-29T14:00:00Z", // UPDATED
    "lc3LastUpdatedBy": "userId888", // UPDATED
    "lc3CompletedAt": "2026-01-29T13:00:00Z", // NOT CHANGED (preserved)
    "lc3CompletedBy": "userId999" // NOT CHANGED (preserved)
  },
  "currentStatus": "Updated After Completion"
}
```

---

## Frontend Integration Guidelines

### Office Section APIs

#### First Submit

```javascript
const formData = new FormData();
formData.append("patientCame", "1");
formData.append("currentStatus", "Pending LC3 Review");
formData.append("pendingWith", "LC3 Team");
// ... other fields

await fetch("/api/walkouts/123/office", {
  method: "POST",
  body: formData,
});
```

#### Update

```javascript
const formData = new FormData();
formData.append("patientCame", "1");
formData.append("currentStatus", "Office Updated");
formData.append("pendingWith", "LC3 Team");
// ... other fields

await fetch("/api/walkouts/123/office", {
  method: "PUT",
  body: formData,
});
```

### LC3 Section APIs

#### Submit/Update (Not Completed)

```javascript
const formData = new FormData();
formData.append('ruleEngine', JSON.stringify({...}));
formData.append('currentStatus', 'LC3 In Progress');
formData.append('pendingWith', 'Provider');

await fetch('/api/walkouts/123/lc3', {
  method: 'POST',
  body: formData
});
```

#### Mark as Completed

```javascript
const formData = new FormData();
formData.append('productionDetails', JSON.stringify({...}));
formData.append('isCompleted', 'true'); // IMPORTANT
formData.append('currentStatus', 'Completed');
formData.append('pendingWith', 'Archive');

await fetch('/api/walkouts/123/lc3', {
  method: 'POST',
  body: formData
});
```

---

## Database Queries

### Find Walkouts by First Submission Date

```javascript
const walkouts = await Walkout.find({
  "officeSection.officeFirstSubmittedAt": {
    $gte: new Date("2026-01-01"),
    $lte: new Date("2026-01-31"),
  },
});
```

### Find Completed LC3 Walkouts

```javascript
const completedWalkouts = await Walkout.find({
  "lc3Section.lc3CompletedAt": { $exists: true },
});
```

### Find Walkouts by Current Status

```javascript
const pendingWalkouts = await Walkout.find({
  currentStatus: "Pending LC3 Review",
});
```

### Find Walkouts Pending with Specific Team

```javascript
const lc3Pending = await Walkout.find({
  pendingWith: "LC3 Team",
});
```

---

## Summary of Changes

### Model Changes (`models/Walkout.js`)

✅ Added 4 new fields to Office Section
✅ Added 2 new fields to LC3 Section
✅ Added 2 new fields to Audit Section
✅ Added 2 new root level fields

### Controller Changes (`controllers/walkoutController.js`)

✅ Updated `submitOfficeSection` - handles first submission tracking
✅ Updated `updateOfficeSection` - preserves first submission, updates last updated
✅ Updated `submitLc3Section` - handles completion tracking and root level updates

### Total New Fields: 10

- Office: 4 (officeFirstSubmittedAt, officeFirstSubmittedBy, officeLastUpdatedBy, officeLastUpdatedAt already existed)
- LC3: 2 (lc3CompletedAt, lc3CompletedBy)
- Audit: 2 (auditLastUpdatedAt, auditLastUpdatedBy)
- Root: 2 (currentStatus, pendingWith)

---

## Testing Checklist

- [ ] Test office first submission sets all metadata correctly
- [ ] Test office update preserves first submission data
- [ ] Test office update updates last updated fields
- [ ] Test LC3 first submission sets submitted metadata
- [ ] Test LC3 completion sets completed fields only once
- [ ] Test LC3 update after completion preserves completed fields
- [ ] Test currentStatus updates from office section
- [ ] Test currentStatus updates from LC3 section
- [ ] Test pendingWith updates from office section
- [ ] Test pendingWith updates from LC3 section
- [ ] Test populate queries for new user references
