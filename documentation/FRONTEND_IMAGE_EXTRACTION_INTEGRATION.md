# Frontend Integration Guide - Image Extraction Logging

## 📋 Overview

Ye guide frontend developers ke liye hai jo walkout image extraction logging system ko integrate karna chahte hain. Is system se aap track kar sakte ho ki kab kab images upload hui, kab AI ne data extract kiya, aur success/failure status kya hai.

---

## 🎯 Key Concepts

### Extraction Types

- **Office Walkout Image**: Office section me upload hone wali walkout image
- **LC3 Walkout Image**: LC3 section me upload hone wali walkout image

### Extraction Modes

- **Automatic**: Jab image upload hoti hai aur background me automatically data extract hota hai
- **Manual**: Jab user manually "Regenerate" button click karke data ko re-extract karta hai

### Extraction Status

- **pending**: Extraction request created but not started yet
- **processing**: AI currently extracting data
- **success**: Data successfully extracted
- **failed**: Extraction failed with error

---

## 🔧 Implementation Steps

### 1. Automatic Extraction (Image Upload pe)

Jab user office ya LC3 section me image upload kare, tab ye process follow karo:

#### A. Office Section - Image Upload

```javascript
// Example: Office Walkout Image Upload Handler
async function handleOfficeWalkoutImageUpload(formRefId, imageFile, userId) {
  try {
    // Step 1: Upload image to S3
    const uploadedImage = await uploadImageToS3(imageFile);

    // Step 2: Start automatic extraction in background
    const response = await fetch("/api/office-walkout-ai/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        formRefId: formRefId,
        imageId: uploadedImage.imageId,
        fileName: uploadedImage.fileName,
        imageUploadedAt: new Date().toISOString(),
        extractionMode: "automatic", // ⭐ Important: automatic mode

        // Appointment details (from walkout data)
        patientId: walkoutData.appointmentInfo.patientId,
        dateOfService: walkoutData.appointmentInfo.dateOfService,
        officeName: walkoutData.appointmentInfo.officeName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Show notification
      showNotification(
        "Image uploaded. Extracting data in background...",
        "info",
      );

      // Optional: Poll for completion or use WebSocket
      pollForExtractionStatus(result.logId);
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    showNotification("Failed to upload image", "error");
  }
}
```

#### B. LC3 Section - Image Upload

```javascript
// Example: LC3 Walkout Image Upload Handler
async function handleLC3WalkoutImageUpload(formRefId, imageFile, userId) {
  try {
    // Step 1: Upload image to S3
    const uploadedImage = await uploadImageToS3(imageFile);

    // Step 2: Start automatic extraction in background
    const response = await fetch("/api/lc3-walkout-ai/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        formRefId: formRefId,
        imageId: uploadedImage.imageId,
        fileName: uploadedImage.fileName,
        imageUploadedAt: new Date().toISOString(),
        extractionMode: "automatic", // ⭐ Important: automatic mode

        // Appointment details
        patientId: walkoutData.appointmentInfo.patientId,
        dateOfService: walkoutData.appointmentInfo.dateOfService,
        officeName: walkoutData.appointmentInfo.officeName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        "Image uploaded. Extracting data in background...",
        "info",
      );
      pollForExtractionStatus(result.logId);
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    showNotification("Failed to upload image", "error");
  }
}
```

---

### 2. Manual Extraction (Regenerate Button pe)

Jab user "Regenerate" button click kare to ye process follow karo:

#### Office/LC3 Regenerate Handler

```javascript
// Example: Regenerate Button Click Handler
async function handleRegenerateExtraction(formRefId, extractorType, userId) {
  try {
    // Show loading state
    setRegenerateLoading(true);

    const endpoint =
      extractorType === "office"
        ? "/api/office-walkout-ai/regenerate"
        : "/api/lc3-walkout-ai/regenerate";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        formRefId: formRefId,
        extractionMode: "manual", // ⭐ Important: manual mode

        // Appointment details
        patientId: walkoutData.appointmentInfo.patientId,
        dateOfService: walkoutData.appointmentInfo.dateOfService,
        officeName: walkoutData.appointmentInfo.officeName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Regenerating data...", "info");

      // Wait for completion
      await pollForExtractionStatus(result.logId);

      // Reload walkout data
      await reloadWalkoutData(formRefId);

      showNotification("Data regenerated successfully!", "success");
    }
  } catch (error) {
    console.error("Error regenerating:", error);
    showNotification("Failed to regenerate data", "error");
  } finally {
    setRegenerateLoading(false);
  }
}
```

---

### 3. Polling for Extraction Status

Background extraction complete hone ka wait karne ke liye:

```javascript
// Poll for extraction completion
async function pollForExtractionStatus(logId, maxAttempts = 30) {
  let attempts = 0;

  const checkStatus = async () => {
    try {
      const response = await fetch(`/api/extraction-logs/${logId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.data.status === "success") {
        // Extraction completed successfully
        console.log("✅ Extraction completed:", result.data);

        // Update UI with extracted data
        updateWalkoutWithExtractedData(result.data.extractedData);

        return true;
      } else if (result.data.status === "failed") {
        // Extraction failed
        console.error("❌ Extraction failed:", result.data.errorMessage);
        showNotification("Data extraction failed", "error");

        return false;
      } else if (
        result.data.status === "processing" ||
        result.data.status === "pending"
      ) {
        // Still processing, continue polling
        attempts++;

        if (attempts < maxAttempts) {
          // Wait 2 seconds and check again
          setTimeout(checkStatus, 2000);
        } else {
          showNotification("Extraction taking longer than expected", "warning");
        }
      }
    } catch (error) {
      console.error("Error checking extraction status:", error);
    }
  };

  // Start checking
  checkStatus();
}
```

---

### 4. Display Extraction History

Walkout page pe extraction history dikhane ke liye:

```javascript
// Example: Extraction History Component
function ExtractionHistoryPanel({ formRefId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtractionLogs();
  }, [formRefId]);

  async function loadExtractionLogs() {
    try {
      const response = await fetch(`/api/extraction-logs/form/${formRefId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="extraction-history">
      <h3>Extraction History</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>
                  <span className={`badge badge-${log.extractorType}`}>
                    {log.extractorType === "office" ? "Office" : "LC3"}
                  </span>
                </td>
                <td>
                  <span className={`badge badge-${log.extractionMode}`}>
                    {log.extractionMode === "automatic"
                      ? "🤖 Auto"
                      : "👤 Manual"}
                  </span>
                </td>
                <td>
                  <StatusBadge status={log.status} />
                </td>
                <td>
                  {log.processDuration
                    ? `${(log.processDuration / 1000).toFixed(2)}s`
                    : "-"}
                </td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { icon: "⏳", color: "gray", text: "Pending" },
    processing: { icon: "⚙️", color: "blue", text: "Processing" },
    success: { icon: "✅", color: "green", text: "Success" },
    failed: { icon: "❌", color: "red", text: "Failed" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`status-badge status-${config.color}`}>
      {config.icon} {config.text}
    </span>
  );
}
```

---

### 5. Backend Integration Points

Aapke backend me ye changes zaroor karo:

#### A. Office Walkout Image AI Controller

```javascript
// controllers/officeWalkoutImageAiController.js

const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

exports.extractOfficeWalkoutImage = async (req, res) => {
  let logId = null;

  try {
    const {
      formRefId,
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode, // ⭐ Get from request
      patientId,
      dateOfService,
      officeName,
    } = req.body;

    // Step 1: Create extraction log
    const log = await createExtractionLog({
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt,
      extractorType: "office",
      extractionMode: extractionMode || "automatic", // ⭐ Use provided mode
      triggeredBy: req.user._id,
      isRegeneration: extractionMode === "manual",
    });

    logId = log._id;

    // Step 2: Mark as processing
    await markAsProcessing(logId);

    // Step 3: Extract data using AI
    const extractedData = await callOpenAIForExtraction(imageId);

    // Step 4: Save to walkout
    await saveExtractedDataToWalkout(formRefId, extractedData);

    // Step 5: Mark as completed
    await markAsCompleted(logId, extractedData);

    res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      logId: logId,
      data: extractedData,
    });
  } catch (error) {
    if (logId) {
      await markAsFailed(logId, error);
    }

    res.status(500).json({
      success: false,
      message: "Extraction failed",
      error: error.message,
    });
  }
};
```

#### B. LC3 Walkout Image AI Controller

```javascript
// controllers/lc3WalkoutImageAiController.js

const {
  createExtractionLog,
  markAsProcessing,
  markAsCompleted,
  markAsFailed,
} = require("../utils/imageExtractionLogger");

exports.extractLC3WalkoutImage = async (req, res) => {
  let logId = null;

  try {
    const {
      formRefId,
      imageId,
      fileName,
      imageUploadedAt,
      extractionMode, // ⭐ Get from request
      patientId,
      dateOfService,
      officeName,
    } = req.body;

    // Step 1: Create extraction log
    const log = await createExtractionLog({
      formRefId,
      patientId,
      dateOfService,
      officeName,
      imageId,
      fileName,
      imageUploadedAt,
      extractorType: "lc3",
      extractionMode: extractionMode || "automatic", // ⭐ Use provided mode
      triggeredBy: req.user._id,
      isRegeneration: extractionMode === "manual",
    });

    logId = log._id;

    // Step 2: Mark as processing
    await markAsProcessing(logId);

    // Step 3: Extract data using AI
    const extractedData = await callOpenAIForExtraction(imageId);

    // Step 4: Save to walkout
    await saveExtractedDataToWalkout(formRefId, extractedData);

    // Step 5: Mark as completed
    await markAsCompleted(logId, extractedData);

    res.status(200).json({
      success: true,
      message: "Data extracted successfully",
      logId: logId,
      data: extractedData,
    });
  } catch (error) {
    if (logId) {
      await markAsFailed(logId, error);
    }

    res.status(500).json({
      success: false,
      message: "Extraction failed",
      error: error.message,
    });
  }
};
```

---

## 📊 API Endpoints Reference

### Get Extraction Logs by FormRefId

```
GET /api/extraction-logs/form/:formRefId
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "log123",
      "formRefId": "ABC123",
      "patientId": "12345",
      "officeName": "Downtown Dental",
      "extractorType": "office",
      "extractionMode": "automatic",
      "status": "success",
      "processDuration": 3456,
      "createdAt": "2026-02-02T10:30:00Z",
      "triggeredBy": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

### Get Single Log by ID

```
GET /api/extraction-logs/:logId
```

### Get Statistics (Admin Only)

```
GET /api/extraction-logs/stats?extractorType=office
```

### Retry Failed Extraction (Admin Only)

```
POST /api/extraction-logs/:logId/retry
```

---

## 🎨 UI Components Examples

### Extraction Status Indicator

```javascript
function ExtractionStatusIndicator({ status, duration }) {
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: "⏳",
          text: "Queued for extraction",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
      case "processing":
        return {
          icon: "⚙️",
          text: "Extracting data...",
          color: "text-blue-500",
          bgColor: "bg-blue-100",
        };
      case "success":
        return {
          icon: "✅",
          text: `Completed in ${(duration / 1000).toFixed(2)}s`,
          color: "text-green-500",
          bgColor: "bg-green-100",
        };
      case "failed":
        return {
          icon: "❌",
          text: "Extraction failed",
          color: "text-red-500",
          bgColor: "bg-red-100",
        };
      default:
        return {
          icon: "❓",
          text: "Unknown status",
          color: "text-gray-500",
          bgColor: "bg-gray-100",
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <div
      className={`px-3 py-1 rounded-full ${display.bgColor} ${display.color} flex items-center gap-2`}
    >
      <span>{display.icon}</span>
      <span className="text-sm font-medium">{display.text}</span>
    </div>
  );
}
```

### Extraction Mode Badge

```javascript
function ExtractionModeBadge({ mode }) {
  const isAutomatic = mode === "automatic";

  return (
    <span
      className={`
      px-2 py-1 rounded text-xs font-medium
      ${
        isAutomatic
          ? "bg-purple-100 text-purple-700"
          : "bg-orange-100 text-orange-700"
      }
    `}
    >
      {isAutomatic ? "🤖 Automatic" : "👤 Manual"}
    </span>
  );
}
```

### Regenerate Button with Loading State

```javascript
function RegenerateButton({ formRefId, extractorType, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);

    try {
      await handleRegenerateExtraction(formRefId, extractorType, userId);
      onSuccess?.();
    } catch (error) {
      console.error("Regenerate failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? (
        <>
          <span className="animate-spin">⚙️</span> Regenerating...
        </>
      ) : (
        <>🔄 Regenerate Data</>
      )}
    </button>
  );
}
```

---

## 🔔 Notifications & User Feedback

### Success Notifications

```javascript
// Image upload success
showNotification(
  "Image uploaded successfully. Data extraction in progress...",
  "info",
);

// Extraction completed
showNotification("✅ Data extracted and saved successfully!", "success");

// Manual regeneration success
showNotification("✅ Data regenerated successfully!", "success");
```

### Error Notifications

```javascript
// Upload failed
showNotification("❌ Failed to upload image. Please try again.", "error");

// Extraction failed
showNotification(
  '❌ Data extraction failed. Click "Regenerate" to try again.',
  "error",
);

// Network error
showNotification("❌ Network error. Please check your connection.", "error");
```

### Progress Notifications

```javascript
// Processing
showNotification("⚙️ Processing image... This may take a few moments.", "info");

// Long wait
showNotification(
  "⏳ Extraction taking longer than usual. Please wait...",
  "warning",
);
```

---

## ⚠️ Important Notes

### 1. Extraction Mode Rules

- **Automatic** = Jab image pehli baar upload ho
- **Manual** = Jab user regenerate button click kare
- Yeh field **required** hai aur har extraction request me bhejni hai

### 2. Required Fields in Request

```javascript
{
  formRefId: "ABC123",           // Required
  imageId: "s3-image-id",        // Required
  fileName: "walkout.jpg",       // Required
  imageUploadedAt: "2026-02-02", // Required
  extractionMode: "automatic",   // Required ⭐
  patientId: "12345",            // Required
  dateOfService: "2026-02-01",   // Required
  officeName: "Downtown Dental"  // Required
}
```

### 3. Error Handling

- Har extraction attempt log hoti hai, chahe fail ho
- Failed extractions ko retry kar sakte ho
- Error messages user ko dikhao

### 4. Performance

- Background extraction use karo automatic mode me
- Poll har 2 seconds me status check karne ke liye
- Max 30 attempts ke baad timeout message dikhaao

---

## 📱 Mobile Responsiveness

Mobile devices pe extraction history dikhane ke liye:

```javascript
function MobileExtractionHistory({ logs }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log._id} className="bg-white p-3 rounded shadow">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={`badge-${log.extractorType}`}>
                {log.extractorType.toUpperCase()}
              </span>
              <ExtractionModeBadge mode={log.extractionMode} />
            </div>
            <ExtractionStatusIndicator
              status={log.status}
              duration={log.processDuration}
            />
          </div>

          <div className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleString()}
          </div>

          {log.status === "failed" && (
            <div className="mt-2 text-xs text-red-600">
              Error: {log.errorMessage}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

Frontend integration ke baad ye test karo:

- [ ] Image upload karne pe automatic extraction start hoti hai
- [ ] Background extraction complete hone pe data save hota hai
- [ ] Regenerate button click karne pe manual extraction trigger hoti hai
- [ ] Extraction history properly display hoti hai
- [ ] Success/failure notifications dikhai dete hain
- [ ] Loading states properly work karti hain
- [ ] Mobile view me sab kuch theek dikhta hai
- [ ] Failed extractions retry kar sakte ho
- [ ] Multiple extractions parallel me kaam karti hain
- [ ] Network errors gracefully handle hoti hain

---

## 🆘 Troubleshooting

### Problem: Extraction status "pending" pe stuck hai

**Solution**: Backend logs check karo. Ho sakta hai AI service down ho.

### Problem: extractionMode error aa raha hai

**Solution**: Request me `extractionMode: 'automatic'` ya `'manual'` pass karna zaruri hai.

### Problem: Logs nahi dikh rahe

**Solution**: FormRefId sahi pass ho raha hai check karo.

### Problem: Polling kaam nahi kar rahi

**Solution**: LogId properly store ho raha hai aur API endpoint correct hai verify karo.

---

## 📞 Support

Agar koi problem aaye ya doubt ho to backend team se contact karo.

**Happy Coding! 🚀**
