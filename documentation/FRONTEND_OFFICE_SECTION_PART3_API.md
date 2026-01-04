# Walkout Form - Office Section Frontend Implementation Guide

## Part 3: Complete API Documentation

---

## 📋 Table of Contents

1. [API Endpoints Overview](#api-endpoints-overview)
2. [API 1: Submit Office Section (POST)](#api-1-submit-office-section-post)
3. [API 2: Get All Walkouts (GET)](#api-2-get-all-walkouts-get)
4. [API 3: Get Walkout by ID (GET)](#api-3-get-walkout-by-id-get)
5. [API 4: Update Office Section (PUT)](#api-4-update-office-section-put)
6. [API 5: Delete Walkout (DELETE)](#api-5-delete-walkout-delete)
7. [Response Schemas](#response-schemas)
8. [Error Handling](#error-handling)

---

## 1. API Endpoints Overview

### Base URL

```
{{base_url}}/api/walkouts
```

### Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your_auth_token>
```

### Available Endpoints

| Method | Endpoint         | Description                        | Auth Required | Role Required     |
| ------ | ---------------- | ---------------------------------- | ------------- | ----------------- |
| POST   | `/submit-office` | Submit office section (first time) | ✅ Yes        | Any authenticated |
| GET    | `/`              | Get all walkouts with filters      | ✅ Yes        | Any authenticated |
| GET    | `/:id`           | Get specific walkout by ID         | ✅ Yes        | Any authenticated |
| PUT    | `/:id/office`    | Update office section              | ✅ Yes        | Any authenticated |
| DELETE | `/:id`           | Delete walkout (soft delete)       | ✅ Yes        | Admin/SuperAdmin  |

---

## 2. API 1: Submit Office Section (POST)

### Endpoint

```
POST {{base_url}}/api/walkouts/submit-office
```

### Description

Submit the office section data for the first time. This creates a new walkout document in the database.

### Authentication

Required: Bearer Token

### Headers

```http
Content-Type: application/json
Authorization: Bearer <auth_token>
```

### Request Body - Scenario 1: Patient Didn't Come

```json
{
  "appointmentId": "67890appointment123",
  "openTime": "2026-01-01T09:00:00.000Z",
  "patientCame": 2
}
```

**Note**: When `patientCame = 2`, ONLY send these 3 fields. All other fields should NOT be included.

### Request Body - Scenario 2: Patient Came, Post-Op Zero Production

```json
{
  "appointmentId": "67890appointment123",
  "openTime": "2026-01-01T09:00:00.000Z",
  "patientCame": 1,
  "postOpZeroProduction": 1,
  "patientType": 3,
  "hasInsurance": 1,
  "insuranceType": 4,
  "googleReviewRequest": 1,
  "newOfficeNote": "Patient came for post-op check. Zero production visit."
}
```

**Note**: When `postOpZeroProduction = 1`, don't send payment, document, or rule engine fields.

### Request Body - Scenario 3: Patient Came, Normal Production (Complete Form)

```json
{
  "appointmentId": "67890appointment123",
  "openTime": "2026-01-01T09:00:00.000Z",
  "patientCame": 1,
  "postOpZeroProduction": 2,
  "patientType": 2,
  "hasInsurance": 1,
  "insuranceType": 2,
  "insurance": 5,
  "googleReviewRequest": 1,
  "expectedPatientPortionOfficeWO": 150.0,
  "patientPortionCollected": 150.0,
  "differenceInPatientPortion": 0.0,
  "patientPortionPrimaryMode": 1,
  "amountCollectedPrimaryMode": 100.0,
  "patientPortionSecondaryMode": 2,
  "amountCollectedSecondaryMode": 50.0,
  "ruleEngineRun": 1,
  "ruleEngineError": 2,
  "signedGeneralConsent": true,
  "signedTreatmentConsent": true,
  "preAuthAvailable": false,
  "signedTxPlan": true,
  "perioChart": false,
  "nvd": false,
  "xRayPanoAttached": true,
  "majorServiceForm": false,
  "routeSheet": true,
  "prcUpdatedInRouteSheet": true,
  "narrative": false,
  "newOfficeNote": "Regular visit. All documents collected. Payment received in full."
}
```

### Request Body - Scenario 4: Rule Engine Error with Fixes

```json
{
  "appointmentId": "67890appointment123",
  "openTime": "2026-01-01T09:00:00.000Z",
  "patientCame": 1,
  "postOpZeroProduction": 2,
  "patientType": 2,
  "hasInsurance": 2,
  "googleReviewRequest": 1,
  "expectedPatientPortionOfficeWO": 200.0,
  "patientPortionCollected": 150.0,
  "differenceInPatientPortion": -50.0,
  "patientPortionPrimaryMode": 4,
  "amountCollectedPrimaryMode": 150.0,
  "lastFourDigitsCheckForte": 5678,
  "reasonLessCollection": 3,
  "ruleEngineRun": 1,
  "ruleEngineError": 1,
  "errorFixRemarks": "Fixed the insurance verification issue and updated patient records in system.",
  "issuesFixed": 1,
  "signedGeneralConsent": true,
  "signedTxPlan": true,
  "xRayPanoAttached": true,
  "routeSheet": true,
  "prcUpdatedInRouteSheet": true,
  "newOfficeNote": "Patient paid $50 less. Rule engine error occurred but fixed."
}
```

### Request Body - Scenario 5: Rule Engine Didn't Run

```json
{
  "appointmentId": "67890appointment123",
  "openTime": "2026-01-01T09:00:00.000Z",
  "patientCame": 1,
  "postOpZeroProduction": 2,
  "patientType": 1,
  "hasInsurance": 1,
  "insuranceType": 6,
  "insurance": 8,
  "googleReviewRequest": 1,
  "expectedPatientPortionOfficeWO": 0.0,
  "ruleEngineRun": 2,
  "ruleEngineNotRunReason": 2,
  "signedGeneralConsent": true,
  "signedTxPlan": true,
  "xRayPanoAttached": true,
  "routeSheet": true,
  "prcUpdatedInRouteSheet": true,
  "newOfficeNote": "System was down, rule engine could not run."
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Office section submitted successfully",
  "data": {
    "_id": "abc123walkout456",
    "userId": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "appointmentId": "67890appointment123",
    "openTime": "2026-01-01T09:00:00.000Z",
    "submitToLC3": "2026-01-01T10:30:00.000Z",
    "lastUpdateOn": "2026-01-01T10:30:00.000Z",
    "walkoutStatus": "office_submitted",
    "isActive": true,
    "officeSection": {
      "patientCame": 1,
      "postOpZeroProduction": 2,
      "patientType": 2,
      "hasInsurance": 1,
      "insuranceType": 2,
      "insurance": 5,
      "googleReviewRequest": 1,
      "expectedPatientPortionOfficeWO": 150.0,
      "patientPortionCollected": 150.0,
      "differenceInPatientPortion": 0.0,
      "patientPortionPrimaryMode": 1,
      "amountCollectedPrimaryMode": 100.0,
      "patientPortionSecondaryMode": 2,
      "amountCollectedSecondaryMode": 50.0,
      "ruleEngineRun": 1,
      "ruleEngineError": 2,
      "signedGeneralConsent": true,
      "signedTreatmentConsent": true,
      "preAuthAvailable": false,
      "signedTxPlan": true,
      "perioChart": false,
      "nvd": false,
      "xRayPanoAttached": true,
      "majorServiceForm": false,
      "routeSheet": true,
      "prcUpdatedInRouteSheet": true,
      "narrative": false,
      "officeHistoricalNotes": [
        {
          "_id": "note123",
          "note": "Regular visit. All documents collected. Payment received in full.",
          "addedBy": {
            "_id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "addedAt": "2026-01-01T10:30:00.000Z"
        }
      ],
      "officeSubmittedBy": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "officeSubmittedAt": "2026-01-01T10:30:00.000Z",
      "officeLastUpdatedAt": "2026-01-01T10:30:00.000Z"
    },
    "lc3Section": {},
    "auditSection": {},
    "createdAt": "2026-01-01T10:30:00.000Z",
    "updatedAt": "2026-01-01T10:30:00.000Z"
  }
}
```

### Success Response - Patient Didn't Come

```json
{
  "success": true,
  "message": "Office section submitted successfully",
  "data": {
    "_id": "xyz789walkout012",
    "userId": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "appointmentId": "67890appointment123",
    "openTime": "2026-01-01T09:00:00.000Z",
    "submitToLC3": null,
    "lastUpdateOn": "2026-01-01T09:05:00.000Z",
    "walkoutStatus": "patient_not_came",
    "isActive": true,
    "officeSection": {
      "patientCame": 2,
      "officeHistoricalNotes": [],
      "officeSubmittedBy": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "officeSubmittedAt": "2026-01-01T09:05:00.000Z",
      "officeLastUpdatedAt": "2026-01-01T09:05:00.000Z"
    },
    "lc3Section": {},
    "auditSection": {},
    "createdAt": "2026-01-01T09:05:00.000Z",
    "updatedAt": "2026-01-01T09:05:00.000Z"
  }
}
```

**IMPORTANT**: Save the `_id` field from the response. This is the `walkoutId` that you'll need for updates and future operations.

```javascript
// After successful submit
const walkoutId = response.data._id;
localStorage.setItem(`walkout_${appointmentId}`, walkoutId);
```

### Error Responses

#### 400 Bad Request - Missing Required Field

```json
{
  "success": false,
  "message": "patientCame is required"
}
```

#### 400 Bad Request - Conditional Field Missing

```json
{
  "success": false,
  "message": "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided"
}
```

#### 401 Unauthorized - Missing/Invalid Token

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error submitting office section",
  "error": "Detailed error message"
}
```

---

## 3. API 2: Get All Walkouts (GET)

### Endpoint

```
GET {{base_url}}/api/walkouts
```

### Description

Retrieve all walkouts with optional filtering and pagination.

### Authentication

Required: Bearer Token

### Headers

```http
Authorization: Bearer <auth_token>
```

### Query Parameters

| Parameter       | Type   | Required | Description                | Example            |
| --------------- | ------ | -------- | -------------------------- | ------------------ |
| `walkoutStatus` | String | ❌ No    | Filter by status           | `office_submitted` |
| `userId`        | String | ❌ No    | Filter by user who created | `user123`          |
| `appointmentId` | String | ❌ No    | Filter by appointment      | `appt456`          |
| `limit`         | Number | ❌ No    | Limit results              | `10`               |
| `skip`          | Number | ❌ No    | Skip results (pagination)  | `0`                |

### Example Requests

#### Get All Active Walkouts

```
GET {{base_url}}/api/walkouts
```

#### Get Walkouts by Status

```
GET {{base_url}}/api/walkouts?walkoutStatus=office_submitted
```

#### Get Walkouts for Specific User

```
GET {{base_url}}/api/walkouts?userId=user123
```

#### Get Walkouts with Pagination

```
GET {{base_url}}/api/walkouts?limit=10&skip=0
```

#### Find Walkout for Specific Appointment

```
GET {{base_url}}/api/walkouts?appointmentId=67890appointment123
```

**Use Case**: When user clicks an appointment, first check if walkout already exists by searching with appointmentId.

### Success Response (200 OK)

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "abc123walkout456",
      "userId": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "appointmentId": "67890appointment123",
      "openTime": "2026-01-01T09:00:00.000Z",
      "submitToLC3": "2026-01-01T10:30:00.000Z",
      "lastUpdateOn": "2026-01-01T10:30:00.000Z",
      "walkoutStatus": "office_submitted",
      "isActive": true,
      "officeSection": {
        "patientCame": 1,
        "postOpZeroProduction": 2,
        "patientType": 2,
        "hasInsurance": 1,
        "insuranceType": 2,
        "insurance": 5,
        "googleReviewRequest": 1,
        "expectedPatientPortionOfficeWO": 150.0,
        "patientPortionCollected": 150.0,
        "differenceInPatientPortion": 0.0,
        "patientPortionPrimaryMode": 1,
        "amountCollectedPrimaryMode": 100.0,
        "patientPortionSecondaryMode": 2,
        "amountCollectedSecondaryMode": 50.0,
        "ruleEngineRun": 1,
        "ruleEngineError": 2,
        "signedGeneralConsent": true,
        "signedTreatmentConsent": true,
        "preAuthAvailable": false,
        "signedTxPlan": true,
        "perioChart": false,
        "nvd": false,
        "xRayPanoAttached": true,
        "majorServiceForm": false,
        "routeSheet": true,
        "prcUpdatedInRouteSheet": true,
        "narrative": false,
        "officeHistoricalNotes": [
          {
            "_id": "note123",
            "note": "Regular visit. All documents collected.",
            "addedBy": {
              "_id": "user123",
              "name": "John Doe",
              "email": "john@example.com"
            },
            "addedAt": "2026-01-01T10:30:00.000Z"
          }
        ],
        "officeSubmittedBy": {
          "_id": "user123",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "officeSubmittedAt": "2026-01-01T10:30:00.000Z",
        "officeLastUpdatedAt": "2026-01-01T10:30:00.000Z"
      },
      "lc3Section": {},
      "auditSection": {},
      "createdAt": "2026-01-01T10:30:00.000Z",
      "updatedAt": "2026-01-01T10:30:00.000Z"
    },
    {
      "_id": "xyz789walkout012",
      "userId": {
        "_id": "user456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "appointmentId": "appt999",
      "openTime": "2026-01-01T08:00:00.000Z",
      "submitToLC3": null,
      "lastUpdateOn": "2026-01-01T08:10:00.000Z",
      "walkoutStatus": "patient_not_came",
      "isActive": true,
      "officeSection": {
        "patientCame": 2,
        "officeHistoricalNotes": [],
        "officeSubmittedBy": {
          "_id": "user456",
          "name": "Jane Smith",
          "email": "jane@example.com"
        },
        "officeSubmittedAt": "2026-01-01T08:10:00.000Z",
        "officeLastUpdatedAt": "2026-01-01T08:10:00.000Z"
      },
      "lc3Section": {},
      "auditSection": {},
      "createdAt": "2026-01-01T08:10:00.000Z",
      "updatedAt": "2026-01-01T08:10:00.000Z"
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error fetching walkouts",
  "error": "Detailed error message"
}
```

---

## 4. API 3: Get Walkout by ID (GET)

### Endpoint

```
GET {{base_url}}/api/walkouts/:id
```

### Description

Retrieve a specific walkout by its ID.

### Authentication

Required: Bearer Token

### Headers

```http
Authorization: Bearer <auth_token>
```

### Path Parameters

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| `id`      | String | ✅ Yes   | The walkout ID (\_id field) |

### Example Request

```
GET {{base_url}}/api/walkouts/abc123walkout456
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "_id": "abc123walkout456",
    "userId": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "appointmentId": "67890appointment123",
    "openTime": "2026-01-01T09:00:00.000Z",
    "submitToLC3": "2026-01-01T10:30:00.000Z",
    "lastUpdateOn": "2026-01-01T10:30:00.000Z",
    "walkoutStatus": "office_submitted",
    "isActive": true,
    "officeSection": {
      "patientCame": 1,
      "postOpZeroProduction": 2,
      "patientType": 2,
      "hasInsurance": 1,
      "insuranceType": 2,
      "insurance": 5,
      "googleReviewRequest": 1,
      "expectedPatientPortionOfficeWO": 150.0,
      "patientPortionCollected": 150.0,
      "differenceInPatientPortion": 0.0,
      "patientPortionPrimaryMode": 1,
      "amountCollectedPrimaryMode": 100.0,
      "patientPortionSecondaryMode": 2,
      "amountCollectedSecondaryMode": 50.0,
      "ruleEngineRun": 1,
      "ruleEngineError": 2,
      "signedGeneralConsent": true,
      "signedTreatmentConsent": true,
      "preAuthAvailable": false,
      "signedTxPlan": true,
      "perioChart": false,
      "nvd": false,
      "xRayPanoAttached": true,
      "majorServiceForm": false,
      "routeSheet": true,
      "prcUpdatedInRouteSheet": true,
      "narrative": false,
      "officeHistoricalNotes": [
        {
          "_id": "note123",
          "note": "Regular visit. All documents collected.",
          "addedBy": {
            "_id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "addedAt": "2026-01-01T10:30:00.000Z"
        }
      ],
      "officeSubmittedBy": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "officeSubmittedAt": "2026-01-01T10:30:00.000Z",
      "officeLastUpdatedAt": "2026-01-01T10:30:00.000Z"
    },
    "lc3Section": {},
    "auditSection": {},
    "createdAt": "2026-01-01T10:30:00.000Z",
    "updatedAt": "2026-01-01T10:30:00.000Z"
  }
}
```

### Error Responses

#### 404 Not Found

```json
{
  "success": false,
  "message": "Walkout not found"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error fetching walkout",
  "error": "Detailed error message"
}
```

---

## 5. API 4: Update Office Section (PUT)

### Endpoint

```
PUT {{base_url}}/api/walkouts/:id/office
```

### Description

Update an existing walkout's office section. This is used when user re-opens and modifies an existing walkout.

### Authentication

Required: Bearer Token

### Headers

```http
Content-Type: application/json
Authorization: Bearer <auth_token>
```

### Path Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `id`      | String | ✅ Yes   | The walkout ID to update |

### Request Body

Same structure as submit API, but for updating existing data.

```json
{
  "patientCame": 1,
  "postOpZeroProduction": 2,
  "patientType": 2,
  "hasInsurance": 1,
  "insuranceType": 2,
  "insurance": 5,
  "googleReviewRequest": 1,
  "expectedPatientPortionOfficeWO": 150.0,
  "patientPortionCollected": 175.0,
  "differenceInPatientPortion": 25.0,
  "patientPortionPrimaryMode": 1,
  "amountCollectedPrimaryMode": 100.0,
  "patientPortionSecondaryMode": 2,
  "amountCollectedSecondaryMode": 75.0,
  "ruleEngineRun": 1,
  "ruleEngineError": 2,
  "signedGeneralConsent": true,
  "signedTreatmentConsent": true,
  "preAuthAvailable": false,
  "signedTxPlan": true,
  "perioChart": false,
  "nvd": false,
  "xRayPanoAttached": true,
  "majorServiceForm": false,
  "routeSheet": true,
  "prcUpdatedInRouteSheet": true,
  "narrative": false,
  "newOfficeNote": "Updated: Patient paid additional $25. Total collected increased."
}
```

### Example Request

```
PUT {{base_url}}/api/walkouts/abc123walkout456/office
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Office section updated successfully",
  "data": {
    "_id": "abc123walkout456",
    "userId": {
      "_id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "appointmentId": "67890appointment123",
    "openTime": "2026-01-01T09:00:00.000Z",
    "submitToLC3": "2026-01-01T10:30:00.000Z",
    "lastUpdateOn": "2026-01-01T14:00:00.000Z",
    "walkoutStatus": "office_submitted",
    "isActive": true,
    "officeSection": {
      "patientCame": 1,
      "postOpZeroProduction": 2,
      "patientType": 2,
      "hasInsurance": 1,
      "insuranceType": 2,
      "insurance": 5,
      "googleReviewRequest": 1,
      "expectedPatientPortionOfficeWO": 150.0,
      "patientPortionCollected": 175.0,
      "differenceInPatientPortion": 25.0,
      "patientPortionPrimaryMode": 1,
      "amountCollectedPrimaryMode": 100.0,
      "patientPortionSecondaryMode": 2,
      "amountCollectedSecondaryMode": 75.0,
      "ruleEngineRun": 1,
      "ruleEngineError": 2,
      "signedGeneralConsent": true,
      "signedTreatmentConsent": true,
      "preAuthAvailable": false,
      "signedTxPlan": true,
      "perioChart": false,
      "nvd": false,
      "xRayPanoAttached": true,
      "majorServiceForm": false,
      "routeSheet": true,
      "prcUpdatedInRouteSheet": true,
      "narrative": false,
      "officeHistoricalNotes": [
        {
          "_id": "note123",
          "note": "Regular visit. All documents collected.",
          "addedBy": {
            "_id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "addedAt": "2026-01-01T10:30:00.000Z"
        },
        {
          "_id": "note456",
          "note": "Updated: Patient paid additional $25. Total collected increased.",
          "addedBy": {
            "_id": "user123",
            "name": "John Doe",
            "email": "john@example.com"
          },
          "addedAt": "2026-01-01T14:00:00.000Z"
        }
      ],
      "officeSubmittedBy": {
        "_id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "officeSubmittedAt": "2026-01-01T10:30:00.000Z",
      "officeLastUpdatedAt": "2026-01-01T14:00:00.000Z"
    },
    "lc3Section": {},
    "auditSection": {},
    "createdAt": "2026-01-01T10:30:00.000Z",
    "updatedAt": "2026-01-01T14:00:00.000Z"
  }
}
```

### CRITICAL NOTES About Update:

1. **submitToLC3 Does NOT Change**: Notice in the response that `submitToLC3` remains `"2026-01-01T10:30:00.000Z"` (original submission time), even though `lastUpdateOn` changed to `"2026-01-01T14:00:00.000Z"`.

2. **Historical Notes Accumulate**: Each update with `newOfficeNote` adds a new entry to the `officeHistoricalNotes` array. Previous notes are preserved.

3. **officeLastUpdatedAt Changes**: This timestamp updates every time the office section is modified.

4. **Same Validation Rules Apply**: Update endpoint follows the same conditional validation logic as submit.

### Error Responses

#### 404 Not Found

```json
{
  "success": false,
  "message": "Walkout not found"
}
```

#### 400 Bad Request - Validation Error

```json
{
  "success": false,
  "message": "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error updating office section",
  "error": "Detailed error message"
}
```

---

## 6. API 5: Delete Walkout (DELETE)

### Endpoint

```
DELETE {{base_url}}/api/walkouts/:id
```

### Description

Soft delete a walkout (sets `isActive` to false). Only Admin and SuperAdmin can delete walkouts.

### Authentication

Required: Bearer Token + Admin/SuperAdmin Role

### Headers

```http
Authorization: Bearer <auth_token>
```

### Path Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `id`      | String | ✅ Yes   | The walkout ID to delete |

### Example Request

```
DELETE {{base_url}}/api/walkouts/abc123walkout456
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Walkout deleted successfully"
}
```

### Error Responses

#### 404 Not Found

```json
{
  "success": false,
  "message": "Walkout not found"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

#### 403 Forbidden - Insufficient Permissions

```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Error deleting walkout",
  "error": "Detailed error message"
}
```

---

## 7. Response Schemas

### Walkout Object Structure

```typescript
interface Walkout {
  _id: string; // Walkout ID (MongoDB ObjectId)
  userId: User; // User who created (populated)
  appointmentId: string; // Appointment ID reference
  openTime: string; // ISO date when form opened
  submitToLC3: string | null; // First submission time (null if patient_not_came)
  lastUpdateOn: string; // Last update time
  walkoutStatus: WalkoutStatus; // Current status
  isActive: boolean; // Soft delete flag
  officeSection: OfficeSection; // Office section data
  lc3Section: object; // LC3 section (placeholder)
  auditSection: object; // Audit section (placeholder)
  createdAt: string; // Auto-generated (MongoDB)
  updatedAt: string; // Auto-generated (MongoDB)
}

type WalkoutStatus =
  | "draft"
  | "office_submitted"
  | "patient_not_came"
  | "lc3_pending"
  | "lc3_submitted"
  | "audit_pending"
  | "completed";

interface OfficeSection {
  // Radio button fields (numbers)
  patientCame: number;
  postOpZeroProduction?: number;
  patientType?: number;
  hasInsurance?: number;
  insuranceType?: number;
  insurance?: number;
  googleReviewRequest?: number;
  ruleEngineRun?: number;
  ruleEngineError?: number;
  issuesFixed?: number;

  // Dropdown fields (numbers)
  patientPortionPrimaryMode?: number;
  patientPortionSecondaryMode?: number;
  reasonLessCollection?: number;
  ruleEngineNotRunReason?: number;

  // Number fields (decimal)
  expectedPatientPortionOfficeWO?: number;
  patientPortionCollected?: number;
  differenceInPatientPortion?: number;
  amountCollectedPrimaryMode?: number;
  amountCollectedSecondaryMode?: number;
  lastFourDigitsCheckForte?: number;

  // Text fields
  errorFixRemarks?: string;

  // Boolean fields
  signedGeneralConsent?: boolean;
  signedTreatmentConsent?: boolean;
  preAuthAvailable?: boolean;
  signedTxPlan?: boolean;
  perioChart?: boolean;
  nvd?: boolean;
  xRayPanoAttached?: boolean;
  majorServiceForm?: boolean;
  routeSheet?: boolean;
  prcUpdatedInRouteSheet?: boolean;
  narrative?: boolean;

  // Historical notes
  officeHistoricalNotes: HistoricalNote[];

  // Metadata
  officeSubmittedBy: User;
  officeSubmittedAt: string;
  officeLastUpdatedAt: string;
}

interface HistoricalNote {
  _id: string;
  note: string;
  addedBy: User;
  addedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
}
```

---

## 8. Error Handling

### Error Response Structure

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  message: string; // Human-readable error message
  error?: string; // Detailed error (only in 500 errors)
}
```

### HTTP Status Codes

| Code | Meaning               | When It Occurs                             |
| ---- | --------------------- | ------------------------------------------ |
| 200  | OK                    | Successful GET, PUT, DELETE                |
| 201  | Created               | Successful POST (new walkout created)      |
| 400  | Bad Request           | Validation error, missing required field   |
| 401  | Unauthorized          | Missing or invalid auth token              |
| 403  | Forbidden             | User doesn't have required role/permission |
| 404  | Not Found             | Walkout ID doesn't exist                   |
| 500  | Internal Server Error | Server/database error                      |

### Common Validation Errors

```javascript
// Missing mandatory field
{
  "success": false,
  "message": "patientCame is required"
}

// Conditional field missing
{
  "success": false,
  "message": "insuranceType is required when patient has insurance"
}

// Payment mode amount missing
{
  "success": false,
  "message": "amountCollectedPrimaryMode is required when patientPortionPrimaryMode is provided"
}

// Check digits missing
{
  "success": false,
  "message": "lastFourDigitsCheckForte is required when payment mode is 4"
}

// Negative difference reason missing
{
  "success": false,
  "message": "reasonLessCollection is required when differenceInPatientPortion is negative"
}

// Rule engine error details missing
{
  "success": false,
  "message": "errorFixRemarks is required when ruleEngineError is 1"
}

// Document field missing
{
  "success": false,
  "message": "signedGeneralConsent is required"
}
```

### Frontend Error Handling Best Practices

```javascript
async function submitOfficeSection(formData) {
  try {
    const response = await fetch(`${baseUrl}/api/walkouts/submit-office`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle error based on status code
      if (response.status === 400) {
        // Validation error - show message to user
        showErrorMessage(result.message);
        highlightInvalidField(result.message);
      } else if (response.status === 401) {
        // Unauthorized - redirect to login
        redirectToLogin();
      } else if (response.status === 500) {
        // Server error - show generic message
        showErrorMessage("Server error. Please try again later.");
        console.error("Server error:", result.error);
      }
      return null;
    }

    // Success
    const walkoutId = result.data._id;
    localStorage.setItem(`walkout_${formData.appointmentId}`, walkoutId);
    showSuccessMessage("Office section submitted successfully!");
    return result.data;
  } catch (error) {
    // Network error
    console.error("Network error:", error);
    showErrorMessage("Network error. Please check your connection.");
    return null;
  }
}
```

---

## Summary - Part 3

✅ Learned all 5 API endpoints with complete examples  
✅ Understood request/response structures for all scenarios  
✅ Reviewed success and error responses  
✅ Learned how to handle appointmentId and walkoutId  
✅ Understood critical notes about submitToLC3 (set once, never changes)  
✅ Learned error handling best practices

**Next**: Part 4 will cover implementation guide, code examples, and best practices.

---

_Document Created: January 1, 2026_  
_For: Frontend Developer Implementation_  
_Backend API Version: 1.0_
