# Image Extraction Logging System

## Overview

Comprehensive tracking system for all AI-based walkout image extraction processes (both Office and LC3 sections).

## Features

- ✅ Track all image extraction attempts
- ✅ Monitor success/failure rates
- ✅ Measure processing duration
- ✅ Store error details for debugging
- ✅ Support for retry mechanism
- ✅ Separate tracking for Office vs LC3 extractors
- ✅ Quick lookup by formRefId
- ✅ Statistics and analytics
- ✅ Dashboard summary

---

## Database Schema

### Collection: `image_extraction_logs`

| Field                | Type             | Description                                          |
| -------------------- | ---------------- | ---------------------------------------------------- |
| `formRefId`          | String (Indexed) | Links to walkout document                            |
| `patientId`          | String           | Patient identifier                                   |
| `dateOfService`      | Date             | DOS of the appointment                               |
| `officeName`         | String           | Office name                                          |
| `imageId`            | String           | S3 image ID                                          |
| `fileName`           | String           | Original file name                                   |
| `imageUploadedAt`    | Date             | When image was uploaded                              |
| `extractorType`      | String (enum)    | `"office"` or `"lc3"`                                |
| `requestStartedAt`   | Date             | When extraction started                              |
| `requestCompletedAt` | Date             | When extraction finished                             |
| `processDuration`    | Number           | Duration in milliseconds                             |
| `status`             | String (enum)    | `"pending"`, `"processing"`, `"success"`, `"failed"` |
| `extractedData`      | String           | AI-extracted data (JSON string)                      |
| `errorMessage`       | String           | Error message if failed                              |
| `errorStack`         | String           | Full error stack for debugging                       |
| `triggeredBy`        | ObjectId         | User who triggered extraction                        |
| `promptUsed`         | String           | AI prompt used for extraction                        |
| `retryCount`         | Number           | Number of retries                                    |
| `isRegeneration`     | Boolean          | Whether this is a regeneration                       |

---

## API Endpoints

### 1. Get All Logs (with filters)

```
GET /api/extraction-logs
```

**Query Parameters:**

- `status` - Filter by status (pending/processing/success/failed)
- `extractorType` - Filter by type (office/lc3)
- `formRefId` - Filter by form reference ID
- `patientId` - Filter by patient ID
- `officeName` - Filter by office name (regex search)
- `startDate` - Filter from date
- `endDate` - Filter to date
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)

**Response:**

```json
{
  "success": true,
  "count": 50,
  "total": 500,
  "page": 1,
  "totalPages": 10,
  "data": [...]
}
```

---

### 2. Get Logs by FormRefId

```
GET /api/extraction-logs/form/:formRefId
```

**Use Case:** View all extraction attempts for a specific walkout

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "formRefId": "ABC123",
      "extractorType": "office",
      "status": "success",
      "processDuration": 3456,
      ...
    }
  ]
}
```

---

### 3. Get Statistics

```
GET /api/extraction-logs/stats
```

**Query Parameters:**

- `extractorType` - Optional: filter by office/lc3

**Response:**

```json
{
  "success": true,
  "data": {
    "overall": {
      "total": 1000,
      "pending": 5,
      "processing": 2,
      "success": 950,
      "failed": 43,
      "avgDurationSuccess": 3200,
      "avgDurationFailed": 8500
    },
    "office": { ... },
    "lc3": { ... }
  }
}
```

---

### 4. Get Recent Failures

```
GET /api/extraction-logs/failures?limit=50
```

**Use Case:** Monitor and debug recent extraction failures

**Response:**

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "formRefId": "ABC123",
      "patientId": "12345",
      "officeName": "Downtown Dental",
      "extractorType": "office",
      "errorMessage": "OpenAI API timeout",
      "createdAt": "2026-02-02T10:30:00Z",
      ...
    }
  ]
}
```

---

### 5. Get Dashboard Summary

```
GET /api/extraction-logs/dashboard/summary
```

**Use Case:** Quick overview for admin dashboard

**Response:**

```json
{
  "success": true,
  "data": {
    "last24Hours": [
      {
        "_id": { "status": "success", "extractorType": "office" },
        "count": 150,
        "avgDuration": 3200
      },
      ...
    ],
    "pendingCount": 5,
    "recentFailures": [...]
  }
}
```

---

### 6. Get Single Log

```
GET /api/extraction-logs/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "formRefId": "ABC123",
    "patientId": "12345",
    "dateOfService": "2026-02-01",
    "officeName": "Downtown Dental",
    "extractorType": "office",
    "status": "success",
    "extractedData": "{...}",
    "processDuration": 3456,
    "promptUsed": "...",
    "triggeredBy": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    ...
  }
}
```

---

### 7. Retry Failed Extraction

```
POST /api/extraction-logs/:id/retry
```

**Use Case:** Retry a failed extraction

**Response:**

```json
{
  "success": true,
  "message": "Extraction retry initiated",
  "data": {
    "_id": "...",
    "retryCount": 1,
    "status": "pending",
    ...
  }
}
```

---

### 8. Delete Log (SuperAdmin Only)

```
DELETE /api/extraction-logs/:id
```

---

## Integration Guide

### Step 1: Import the logger

```javascript
const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");
```

### Step 2: Create log when starting extraction

```javascript
const log = await createExtractionLog({
  formRefId: walkout.formRefId,
  patientId: walkout.appointmentInfo.patientId,
  dateOfService: walkout.appointmentInfo.dateOfService,
  officeName: walkout.appointmentInfo.officeName,
  imageId: imageData.imageId,
  fileName: imageData.fileName,
  imageUploadedAt: imageData.uploadedAt,
  extractorType: "office", // or "lc3"
  triggeredBy: req.user._id,
  promptUsed: yourPromptString,
  isRegeneration: false,
});

const logId = log._id;
```

### Step 3: Mark as processing

```javascript
await markAsProcessing(logId);
```

### Step 4: Perform extraction

```javascript
try {
  const extractedData = await callOpenAI(imageData);

  // Mark as completed
  await markAsCompleted(logId, extractedData);
} catch (error) {
  // Mark as failed
  await markAsFailed(logId, error);
  throw error;
}
```

---

## Background Processing Example

```javascript
async function processImageInBackground(walkoutData, imageData, userId) {
  let logId = null;

  try {
    // Create log
    const log = await createExtractionLog({
      formRefId: walkoutData.formRefId,
      patientId: walkoutData.appointmentInfo.patientId,
      dateOfService: walkoutData.appointmentInfo.dateOfService,
      officeName: walkoutData.appointmentInfo.officeName,
      imageId: imageData.imageId,
      fileName: imageData.fileName,
      imageUploadedAt: new Date(),
      extractorType: "office",
      triggeredBy: userId,
      promptUsed: "...",
      isRegeneration: false,
    });

    logId = log._id;

    // Don't await - run in background
    performExtractionAsync(logId, imageData);

    // Return immediately
    return { success: true, logId };
  } catch (error) {
    console.error("Error starting background process:", error);
    throw error;
  }
}

async function performExtractionAsync(logId, imageData) {
  try {
    await markAsProcessing(logId);

    const extractedData = await callOpenAI(imageData);

    // Save to walkout
    await saveToWalkout(logId, extractedData);

    await markAsCompleted(logId, extractedData);
  } catch (error) {
    await markAsFailed(logId, error);
  }
}
```

---

## Monitoring & Analytics

### Success Rate

```javascript
const stats = await getExtractionStats("office");
const successRate = (stats.success / stats.total) * 100;
console.log(`Success Rate: ${successRate}%`);
```

### Average Processing Time

```javascript
const stats = await getExtractionStats("lc3");
console.log(`Avg Duration: ${stats.avgDurationSuccess}ms`);
```

### Failed Extractions

```javascript
const failures = await getRecentFailures(100);
console.log(`Recent failures: ${failures.length}`);
```

---

## Access Control

| Endpoint               | User | Admin | SuperAdmin |
| ---------------------- | ---- | ----- | ---------- |
| GET /form/:formRefId   | ✅   | ✅    | ✅         |
| GET /                  | ❌   | ✅    | ✅         |
| GET /stats             | ❌   | ✅    | ✅         |
| GET /failures          | ❌   | ✅    | ✅         |
| GET /dashboard/summary | ❌   | ✅    | ✅         |
| GET /:id               | ❌   | ✅    | ✅         |
| POST /:id/retry        | ❌   | ✅    | ✅         |
| DELETE /:id            | ❌   | ❌    | ✅         |

---

## Indexes

The following indexes are automatically created for optimal performance:

1. `formRefId` (single field)
2. `{ formRefId: 1, extractorType: 1 }` (compound)
3. `{ status: 1, createdAt: -1 }` (compound)
4. `{ patientId: 1, dateOfService: -1 }` (compound)
5. `{ officeName: 1, createdAt: -1 }` (compound)

---

## Best Practices

1. **Always create log entry** before starting extraction
2. **Mark as processing** when AI call begins
3. **Mark as completed** immediately after success
4. **Mark as failed** in catch block with error details
5. **Use meaningful prompt descriptions** for debugging
6. **Set isRegeneration flag** when user manually regenerates
7. **Monitor failed extractions** regularly
8. **Review avg processing times** to optimize performance

---

## Common Queries

### Get all failed office extractions from last week

```javascript
GET /api/extraction-logs?status=failed&extractorType=office&startDate=2026-01-26
```

### Get extraction history for specific patient

```javascript
GET /api/extraction-logs?patientId=12345
```

### Get slow extractions (process duration > 10 seconds)

Use aggregation in MongoDB:

```javascript
db.image_extraction_logs
  .find({
    processDuration: { $gt: 10000 },
  })
  .sort({ processDuration: -1 });
```

---

## Future Enhancements

- [ ] Email alerts for consecutive failures
- [ ] Automatic retry mechanism for failed extractions
- [ ] Performance benchmarking dashboard
- [ ] Export logs to CSV
- [ ] Webhook notifications
- [ ] Rate limiting tracking
- [ ] Cost tracking (OpenAI API usage)

---

## Support

For issues or questions, contact the development team.
