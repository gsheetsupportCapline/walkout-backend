# Backend Implementation Guide - Image Extraction Logging

## 📋 Quick Reference

### Extraction Modes

- **automatic**: Background extraction jab image upload ho
- **manual**: User ne regenerate button click kiya

### Key Changes Required

1. ✅ Model updated with `extractionMode` field
2. ✅ Logger utility updated to accept `extractionMode`
3. ✅ Controller me filter added for `extractionMode`
4. ⚠️ **Action Required**: Apne image extraction controllers me integration karna hai

---

## 🔧 Implementation in Your Controllers

### Office Walkout Image AI Controller

File: `controllers/officeWalkoutImageAiController.js`

```javascript
const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

/**
 * Extract data from office walkout image
 * Called on:
 * 1. Image upload (automatic mode)
 * 2. Regenerate button click (manual mode)
 */
exports.extractOfficeWalkoutImage = async (req, res) => {
  let logId = null;

  try {
    const {
      formRefId,
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode = "automatic", // ⭐ NEW FIELD
      patientId,
      dateOfService,
      officeName,
    } = req.body;

    // Validate required fields
    if (!formRefId || !imageId || !patientId || !dateOfService || !officeName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate extractionMode
    if (!["automatic", "manual"].includes(extractionMode)) {
      return res.status(400).json({
        success: false,
        message: 'extractionMode must be "automatic" or "manual"',
      });
    }

    // Step 1: Create extraction log
    const log = await createExtractionLog({
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt: imageUploadedAt || new Date(),
      extractorType: "office",
      extractionMode, // ⭐ Pass the mode
      triggeredBy: req.user._id,
      promptUsed: "Your office walkout extraction prompt here...",
      isRegeneration: extractionMode === "manual",
    });

    logId = log._id;

    // Step 2: Mark as processing
    await markAsProcessing(logId);

    // Step 3: Get image from S3
    const imageData = await getImageFromS3(imageId);

    // Step 4: Call OpenAI for extraction
    const extractedData = await extractDataUsingOpenAI(imageData);

    // Step 5: Save to walkout document
    await updateWalkoutWithExtractedData(formRefId, extractedData, "office");

    // Step 6: Mark as completed
    await markAsCompleted(logId, JSON.stringify(extractedData));

    return res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      logId: logId,
      data: extractedData,
    });
  } catch (error) {
    console.error("Office walkout extraction error:", error);

    // Mark as failed if log was created
    if (logId) {
      await markAsFailed(logId, error);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to extract data",
      error: error.message,
    });
  }
};

/**
 * Regenerate extraction (manual mode)
 */
exports.regenerateOfficeWalkoutImage = async (req, res) => {
  // Call the same function but with extractionMode = 'manual'
  req.body.extractionMode = "manual";
  return exports.extractOfficeWalkoutImage(req, res);
};
```

---

### LC3 Walkout Image AI Controller

File: `controllers/lc3WalkoutImageAiController.js`

```javascript
const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

/**
 * Extract data from LC3 walkout image
 */
exports.extractLC3WalkoutImage = async (req, res) => {
  let logId = null;

  try {
    const {
      formRefId,
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode = "automatic", // ⭐ NEW FIELD
      patientId,
      dateOfService,
      officeName,
    } = req.body;

    // Validate required fields
    if (!formRefId || !imageId || !patientId || !dateOfService || !officeName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate extractionMode
    if (!["automatic", "manual"].includes(extractionMode)) {
      return res.status(400).json({
        success: false,
        message: 'extractionMode must be "automatic" or "manual"',
      });
    }

    // Step 1: Create extraction log
    const log = await createExtractionLog({
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt: imageUploadedAt || new Date(),
      extractorType: "lc3",
      extractionMode, // ⭐ Pass the mode
      triggeredBy: req.user._id,
      promptUsed: "Your LC3 walkout extraction prompt here...",
      isRegeneration: extractionMode === "manual",
    });

    logId = log._id;

    // Step 2: Mark as processing
    await markAsProcessing(logId);

    // Step 3: Get image from S3
    const imageData = await getImageFromS3(imageId);

    // Step 4: Call OpenAI for extraction
    const extractedData = await extractDataUsingOpenAI(imageData);

    // Step 5: Save to walkout document
    await updateWalkoutWithExtractedData(formRefId, extractedData, "lc3");

    // Step 6: Mark as completed
    await markAsCompleted(logId, JSON.stringify(extractedData));

    return res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      logId: logId,
      data: extractedData,
    });
  } catch (error) {
    console.error("LC3 walkout extraction error:", error);

    // Mark as failed if log was created
    if (logId) {
      await markAsFailed(logId, error);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to extract data",
      error: error.message,
    });
  }
};

/**
 * Regenerate extraction (manual mode)
 */
exports.regenerateLC3WalkoutImage = async (req, res) => {
  // Call the same function but with extractionMode = 'manual'
  req.body.extractionMode = "manual";
  return exports.extractLC3WalkoutImage(req, res);
};
```

---

## 📝 Summary of Changes

### 1. Model Changes

✅ Already done in `models/ImageExtractionLog.js`:

- Added `extractionMode` field (enum: automatic/manual)
- Added index on `extractionMode`

### 2. Utility Changes

✅ Already done in `utils/imageExtractionLogger.js`:

- `createExtractionLog()` now accepts `extractionMode` parameter
- `retryExtraction()` automatically sets mode to 'manual'

### 3. Controller Changes

✅ Already done in `controllers/imageExtractionLogController.js`:

- Added `extractionMode` filter in `getExtractionLogs()`

### 4. Required Actions

⚠️ **YOU NEED TO UPDATE:**

1. **Office Walkout Image AI Controller**
   - Accept `extractionMode` in request body
   - Pass it to `createExtractionLog()`
   - Default to 'automatic' if not provided

2. **LC3 Walkout Image AI Controller**
   - Accept `extractionMode` in request body
   - Pass it to `createExtractionLog()`
   - Default to 'automatic' if not provided

3. **Routes (if separate regenerate endpoints exist)**

   ```javascript
   // If you have separate routes
   router.post("/office-walkout-ai/extract", extractOfficeWalkoutImage);
   router.post("/office-walkout-ai/regenerate", regenerateOfficeWalkoutImage);

   router.post("/lc3-walkout-ai/extract", extractLC3WalkoutImage);
   router.post("/lc3-walkout-ai/regenerate", regenerateLC3WalkoutImage);
   ```

---

## 🧪 Testing

### Test Automatic Extraction

```bash
curl -X POST http://localhost:5000/api/office-walkout-ai/extract \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formRefId": "ABC123",
    "imageId": "s3-image-123",
    "fileName": "walkout.jpg",
    "imageUploadedAt": "2026-02-02T10:00:00Z",
    "extractionMode": "automatic",
    "patientId": "12345",
    "dateOfService": "2026-02-01",
    "officeName": "Downtown Dental"
  }'
```

### Test Manual Extraction (Regenerate)

```bash
curl -X POST http://localhost:5000/api/office-walkout-ai/regenerate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formRefId": "ABC123",
    "imageId": "s3-image-123",
    "fileName": "walkout.jpg",
    "patientId": "12345",
    "dateOfService": "2026-02-01",
    "officeName": "Downtown Dental"
  }'
```

### Verify Logs

```bash
# Get logs for a specific walkout
curl -X GET http://localhost:5000/api/extraction-logs/form/ABC123 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by extraction mode
curl -X GET "http://localhost:5000/api/extraction-logs?extractionMode=manual" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Database Queries for Analysis

### Count automatic vs manual extractions

```javascript
db.image_extraction_logs.aggregate([
  {
    $group: {
      _id: "$extractionMode",
      count: { $sum: 1 },
    },
  },
]);
```

### Success rate by extraction mode

```javascript
db.image_extraction_logs.aggregate([
  {
    $group: {
      _id: {
        mode: "$extractionMode",
        status: "$status",
      },
      count: { $sum: 1 },
    },
  },
]);
```

### Average duration by mode

```javascript
db.image_extraction_logs.aggregate([
  {
    $match: { status: "success" },
  },
  {
    $group: {
      _id: "$extractionMode",
      avgDuration: { $avg: "$processDuration" },
      count: { $sum: 1 },
    },
  },
]);
```

---

## ⚠️ Important Notes

1. **extractionMode is required** - Frontend must send it in every request
2. **Default to 'automatic'** - If not provided, assume automatic
3. **Regenerate = manual** - Always set extractionMode to 'manual' for regenerate
4. **Log everything** - Even failed attempts should be logged
5. **Don't skip logging** - Har extraction attempt track honi chahiye

---

## 🔍 Debugging

### Check if logs are being created

```javascript
// In your controller
console.log('📝 Creating extraction log with mode:', extractionMode);
const log = await createExtractionLog({...});
console.log('✅ Log created:', log._id);
```

### Verify extraction mode in logs

```javascript
// After creating log
const createdLog = await ImageExtractionLog.findById(logId);
console.log("Extraction mode:", createdLog.extractionMode);
```

### Check failed extractions

```javascript
const failedLogs = await ImageExtractionLog.find({
  status: "failed",
  extractionMode: "automatic",
})
  .sort({ createdAt: -1 })
  .limit(10);

console.log("Recent failures:", failedLogs);
```

---

## ✅ Checklist

Before deploying, make sure:

- [ ] `extractionMode` field added to model (✅ Done)
- [ ] Logger utility accepts `extractionMode` (✅ Done)
- [ ] Controller filters support `extractionMode` (✅ Done)
- [ ] Office AI controller updated to use `extractionMode`
- [ ] LC3 AI controller updated to use `extractionMode`
- [ ] Regenerate endpoints set mode to 'manual'
- [ ] Frontend sends `extractionMode` in requests
- [ ] Testing done for both automatic and manual modes
- [ ] Logs are visible in admin panel
- [ ] Error handling works properly

---

## 📞 Questions?

If you need help integrating this, check:

1. Example code in this file
2. `utils/imageExtractionExamples.js`
3. `documentation/FRONTEND_IMAGE_EXTRACTION_INTEGRATION.md`

Happy coding! 🚀
