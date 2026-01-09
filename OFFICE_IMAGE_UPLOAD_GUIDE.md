# Office Walkout Image Upload - Complete Implementation Guide

## 📋 Overview

Office section submit karte time ab **appointmentInfo** (mandatory) aur **officeWalkoutSnip** (optional image) bhi send kar sakte ho. Image Google Drive me structured folders me upload hoti hai aur secure access milti hai.

---

## 🔗 API Endpoints

### 1. Submit Office Section (First Time)

```
POST /api/walkouts/submit-office
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### 2. Update Office Section

```
PUT /api/walkouts/:id/office
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### 3. Get Image by ImageId

```
GET /api/walkouts/image/:imageId
Authorization: Bearer <token>
```

---

## 📂 Google Drive Folder Structure (Auto-Created)

```
Root Folder
└── 2026/
    └── January/
        └── Main Dental Office/
            └── Office Walkout/
                └── PAT-12345_1736345600000.jpg
```

**Pattern:** `Root → Year → Month → Office Name → Office Walkout → PatientId_Timestamp.ext`

---

## 📝 Request Format (Submit Office Section)

### Required Fields

#### 1. appointmentInfo (JSON string - REQUIRED)

```javascript
{
  "patientId": "PAT-12345",           // String - Patient identifier
  "dateOfService": "2026-01-15",      // Date (YYYY-MM-DD format)
  "officeName": "Main Dental Office"  // String - Office name for folder structure
}
```

#### 2. All Office Section Fields (REQUIRED)

```javascript
// FormData fields:
formRefId: "FORM-2026-001"; // String
patientCame: 1; // Number (0, 1, 2)
postOpZeroProduction: 2; // Number (0, 1, 2)
// ... ALL other office section fields must be sent
```

### Optional Fields

#### 3. officeWalkoutSnip (File - OPTIONAL)

```javascript
// File object from <input type="file" />
// Accepts: image/* (jpg, png, gif, etc.)
// Max size: 10MB
```

#### 4. extractedData (String - OPTIONAL)

```javascript
// Text extracted from image (OCR, manual entry, etc.)
extractedData: "Patient paid $150 via credit card";
```

#### 5. newOfficeNote (String - OPTIONAL)

```javascript
// Add a note to office historical notes
newOfficeNote: "Image uploaded with payment details";
```

---

## ⚠️ CRITICAL: FormData Value Types

### Backend automatically converts string values to numbers!

Jab tum FormData use karte ho, **sab values strings ban jati hain**. Backend already handle kar leta hai, tumhe kuch karne ki zaroorat nahi!

```javascript
// ✅ CORRECT - FormData se directly bhejo (strings ban jayengi)
formData.append("patientCame", formState.patientCame); // "1" string ban jayega
formData.append("postOpZeroProduction", formState.postOpZeroProduction); // "2" string

// ✅ ALSO CORRECT - Numbers bhi bhej sakte ho
formData.append("patientCame", 1); // Backend "1" string ko 1 number me convert karega

// ❌ WRONG - Manual conversion ki zaroorat nahi
formData.append("patientCame", Number(formState.patientCame)); // Not needed!
```

### appointmentInfo MUST be JSON string:

```javascript
// ✅ CORRECT
formData.append(
  "appointmentInfo",
  JSON.stringify({
    patientId: "PAT-001",
    dateOfService: "2026-01-15",
    officeName: "Main Office",
  })
);

// ❌ WRONG - Separate fields nahi
formData.append("patientId", "PAT-001");
formData.append("dateOfService", "2026-01-15");
```

---

## 🎯 Complete Request Example

### JavaScript/Fetch Example

```javascript
// Step 1: Prepare FormData
const formData = new FormData();

// Step 2: Add appointmentInfo (REQUIRED - JSON string)
const appointmentInfo = {
  patientId: formState.patientId,
  dateOfService: formState.dateOfService, // "2026-01-15"
  officeName: formState.officeName,
};
formData.append("appointmentInfo", JSON.stringify(appointmentInfo));

// Step 3: Add image file (OPTIONAL)
if (imageFile) {
  formData.append("officeWalkoutSnip", imageFile);
}

// Step 4: Add extracted data (OPTIONAL)
if (extractedData) {
  formData.append("extractedData", extractedData);
}

// Step 5: Add office note (OPTIONAL)
if (note) {
  formData.append("newOfficeNote", note);
}

// Step 6: Add ALL office section fields (REQUIRED)
formData.append("formRefId", formState.formRefId);
formData.append("patientCame", formState.patientCame);
formData.append("postOpZeroProduction", formState.postOpZeroProduction);
formData.append(
  "lastFourDigitsCreditCardPatientCharge",
  formState.lastFourDigitsCreditCardPatientCharge
);
formData.append(
  "lastFourDigitsCheckPatientCharge",
  formState.lastFourDigitsCheckPatientCharge
);
formData.append("patientPaidAnyAtOffice", formState.patientPaidAnyAtOffice);
formData.append("ifPaidHowMuchPatient", formState.ifPaidHowMuchPatient);
formData.append(
  "lastFourDigitsCreditCardForte",
  formState.lastFourDigitsCreditCardForte
);
formData.append("lastFourDigitsCheckForte", formState.lastFourDigitsCheckForte);
formData.append("reasonLessCollection", formState.reasonLessCollection);
formData.append("ruleEngineRun", formState.ruleEngineRun);
formData.append("ruleEngineNotRunReason", formState.ruleEngineNotRunReason);
formData.append("ruleEngineError", formState.ruleEngineError);
formData.append("errorFixRemarks", formState.errorFixRemarks);
formData.append("issuesFixed", formState.issuesFixed);
formData.append("signedGeneralConsent", formState.signedGeneralConsent);
formData.append("signedTreatmentConsent", formState.signedTreatmentConsent);
formData.append("preAuthAvailable", formState.preAuthAvailable);
formData.append("signedTxPlan", formState.signedTxPlan);
formData.append("perioChart", formState.perioChart);
formData.append("nvd", formState.nvd);
formData.append("xRayPanoAttached", formState.xRayPanoAttached);
formData.append("majorServiceForm", formState.majorServiceForm);
formData.append("routeSheet", formState.routeSheet);
formData.append("prcUpdatedInRouteSheet", formState.prcUpdatedInRouteSheet);
formData.append("narrative", formState.narrative);

// Step 7: Send request
const token = localStorage.getItem("authToken");

const response = await fetch(
  "http://localhost:5000/api/walkouts/submit-office",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // DO NOT set Content-Type - browser will set it automatically
    },
    body: formData,
  }
);

const result = await response.json();

if (result.success) {
  console.log("✅ Submitted successfully!");
  console.log("Walkout ID:", result.data._id);
  console.log("Image ID:", result.data.officeWalkoutSnip?.imageId);

  // Save walkout ID for future updates
  setWalkoutId(result.data._id);

  // Save image ID to display image
  if (result.data.officeWalkoutSnip?.imageId) {
    setImageId(result.data.officeWalkoutSnip.imageId);
  }
} else {
  console.error("❌ Error:", result.message);
  if (result.errors) {
    result.errors.forEach((err) => {
      console.error(`- ${err.field}: ${err.message}`);
    });
  }
}
```

---

## 📤 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Office section submitted successfully",
  "data": {
    "_id": "67890abcdef1234567890abc",
    "userId": "user_id_here",
    "formRefId": "FORM-2026-001",
    "submitToLC3": 0,

    "appointmentInfo": {
      "patientId": "PAT-12345",
      "dateOfService": "2026-01-15T00:00:00.000Z",
      "officeName": "Main Dental Office"
    },

    "officeWalkoutSnip": {
      "imageId": "1abc123xyz456_google_drive_file_id",
      "fileName": "PAT-12345_1736345600000.jpg",
      "uploadedAt": "2026-01-09T10:30:00.000Z",
      "extractedData": "Patient paid $150 via credit card"
    },

    "officeSection": {
      "patientCame": 1,
      "postOpZeroProduction": 2,
      "lastFourDigitsCreditCardPatientCharge": "1234",
      "lastFourDigitsCheckPatientCharge": "",
      "patientPaidAnyAtOffice": 1,
      "ifPaidHowMuchPatient": "150.00",
      "lastFourDigitsCreditCardForte": "",
      "lastFourDigitsCheckForte": "",
      "reasonLessCollection": "",
      "ruleEngineRun": 1,
      "ruleEngineNotRunReason": "",
      "ruleEngineError": "",
      "errorFixRemarks": "",
      "issuesFixed": 1,
      "signedGeneralConsent": 1,
      "signedTreatmentConsent": 1,
      "preAuthAvailable": 0,
      "signedTxPlan": 1,
      "perioChart": 1,
      "nvd": 0,
      "xRayPanoAttached": 1,
      "majorServiceForm": 0,
      "routeSheet": 1,
      "prcUpdatedInRouteSheet": 1,
      "narrative": "",
      "officeSubmittedBy": "user_id_here",
      "officeSubmittedAt": "2026-01-09T10:30:00.000Z",
      "officeLastUpdatedAt": "2026-01-09T10:30:00.000Z",
      "officeHistoricalNotes": [
        {
          "note": "Image uploaded with payment details",
          "addedBy": "user_id_here",
          "addedAt": "2026-01-09T10:30:00.000Z"
        }
      ]
    },

    "createdAt": "2026-01-09T10:30:00.000Z",
    "lastUpdateOn": "2026-01-09T10:30:00.000Z"
  }
}
```

### Error Response (Validation Failed)

```json
{
  "success": false,
  "message": "Validation failed. Please fix the following errors:",
  "errorCount": 3,
  "errors": [
    {
      "field": "patientCame",
      "label": "Patient Came",
      "message": "Patient Came is required"
    },
    {
      "field": "appointmentInfo",
      "label": "Appointment Information",
      "message": "Appointment information is required"
    },
    {
      "field": "lastFourDigitsCreditCardPatientCharge",
      "label": "Last 4 Digits Credit Card (Patient Charge)",
      "message": "Last 4 digits are required when patient paid via credit card"
    }
  ]
}
```

---

## 🔄 Update Office Section

### Same as Submit - Send ALL Fields Again

Update endpoint bhi **same validation** use karta hai. Tumhe **saare office section fields** bhejne padenge with updated values.

```javascript
const formData = new FormData();

// appointmentInfo IMMUTABLE - DON'T send again (backend ignores)

// Send ALL office section fields (even if not changed)
formData.append("patientCame", updatedFormState.patientCame);
formData.append("postOpZeroProduction", updatedFormState.postOpZeroProduction);
// ... ALL other fields

// Optional: Send NEW image to replace old one
if (newImageFile) {
  formData.append("officeWalkoutSnip", newImageFile);
}

// Optional: Update extracted data
if (updatedExtractedData) {
  formData.append("extractedData", updatedExtractedData);
}

// Optional: Add note
if (note) {
  formData.append("newOfficeNote", note);
}

// Send update request
await fetch(`http://localhost:5000/api/walkouts/${walkoutId}/office`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

### Update Scenarios

#### Scenario 1: Update fields WITHOUT changing image

```javascript
// Just send all fields - DON'T include officeWalkoutSnip
// Backend will preserve existing imageId
```

#### Scenario 2: Update fields AND replace image

```javascript
// Send all fields + new image file
formData.append("officeWalkoutSnip", newImageFile);
// Backend will upload new image and replace imageId
```

#### Scenario 3: Update extracted data only (keep same image)

```javascript
// Send all fields + new extractedData (NO new image file)
formData.append("extractedData", "Updated text from image");
// Backend updates extractedData but keeps same imageId
```

---

## 🖼️ Display Image in Frontend

### Method 1: Direct Image URL (Recommended)

```javascript
const ImageViewer = ({ imageId }) => {
  const imageUrl = `http://localhost:5000/api/walkouts/image/${imageId}`;
  const token = localStorage.getItem("authToken");

  return (
    <img
      src={imageUrl}
      alt="Office Walkout"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};
```

**Note:** Browser automatically sends cookies, but for auth token you might need to fetch blob first.

### Method 2: Fetch with Auth Token (Secure)

```javascript
const ImageViewer = ({ imageId }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `http://localhost:5000/api/walkouts/image/${imageId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        }
      } catch (error) {
        console.error("Error loading image:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    // Cleanup
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageId]);

  if (loading) return <div>Loading image...</div>;
  if (!imageUrl) return <div>No image available</div>;

  return (
    <img
      src={imageUrl}
      alt="Office Walkout"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
};
```

### Method 3: Download Button

```javascript
const downloadImage = async (imageId, fileName) => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(
    `http://localhost:5000/api/walkouts/image/${imageId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

---

## 🧪 Postman Testing

### Submit Office Section with Image

1. **Method:** `POST`
2. **URL:** `http://localhost:5000/api/walkouts/submit-office`
3. **Headers:**
   - `Authorization`: `Bearer <your_token>`
4. **Body:** `form-data`
   - `appointmentInfo` (text): `{"patientId":"PAT-001","dateOfService":"2026-01-15","officeName":"Main Office"}`
   - `officeWalkoutSnip` (file): Select image file
   - `extractedData` (text): `Patient paid $150`
   - `formRefId` (text): `FORM-2026-001`
   - `patientCame` (text): `1`
   - `postOpZeroProduction` (text): `2`
   - ... (all other office section fields)

### Get Image by ImageId

1. **Method:** `GET`
2. **URL:** `http://localhost:5000/api/walkouts/image/1abc123xyz456`
3. **Headers:**
   - `Authorization`: `Bearer <your_token>`
4. **Response:** Image file (displays in Postman or downloads)

---

## ⚠️ Important Points

### 1. Content-Type Header

```javascript
// ❌ DON'T set Content-Type manually
headers: {
  "Content-Type": "multipart/form-data",  // WRONG!
  "Authorization": `Bearer ${token}`
}

// ✅ Let browser set it automatically
headers: {
  "Authorization": `Bearer ${token}`  // CORRECT!
}
// Browser adds proper Content-Type with boundary
```

### 2. appointmentInfo Format

```javascript
// ❌ WRONG - Sending as separate fields
formData.append("patientId", "PAT-001");
formData.append("dateOfService", "2026-01-15");
formData.append("officeName", "Main Office");

// ✅ CORRECT - Send as JSON string
formData.append(
  "appointmentInfo",
  JSON.stringify({
    patientId: "PAT-001",
    dateOfService: "2026-01-15",
    officeName: "Main Office",
  })
);
```

### 3. Image is Optional

```javascript
// Yeh valid hai - without image
formData.append("appointmentInfo", JSON.stringify(...));
formData.append("patientCame", 1);
// ... all other fields (NO image)

// Yeh bhi valid hai - with image
formData.append("appointmentInfo", JSON.stringify(...));
formData.append("officeWalkoutSnip", imageFile);
formData.append("patientCame", 1);
// ... all other fields
```

### 4. Validation Same for Submit & Update

- Dono endpoints me **same validation** hai
- **ALL required fields** bhejne zaruri hain
- Conditional validations same apply hoti hain

### 5. Immutable Fields (Update me change nahi hote)

- `formRefId` - Cannot be changed after submit
- `submitToLC3` - Cannot be changed after submit
- `appointmentInfo` - Cannot be changed after submit (ignored in update)

### 6. Image Update Behavior

```javascript
// If NO new image file sent:
//   - Backend preserves existing imageId
//   - Can still update extractedData

// If new image file sent:
//   - Backend uploads new image to Drive
//   - Replaces old imageId with new one
//   - Updates fileName and uploadedAt
```

---

## 🔐 Security

- Images **NOT publicly accessible** on Google Drive
- Service account has access, end users don't
- Images served through backend with **authentication required**
- Without valid JWT token, **no one can access images**

---

## ✅ Complete React Form Example

```jsx
import React, { useState } from "react";

const OfficeWalkoutForm = () => {
  const [formState, setFormState] = useState({
    // Appointment Info
    patientId: "",
    dateOfService: "",
    officeName: "",

    // Office Section Fields
    formRefId: "",
    patientCame: "",
    postOpZeroProduction: "",
    lastFourDigitsCreditCardPatientCharge: "",
    lastFourDigitsCheckPatientCharge: "",
    patientPaidAnyAtOffice: "",
    ifPaidHowMuchPatient: "",
    lastFourDigitsCreditCardForte: "",
    lastFourDigitsCheckForte: "",
    reasonLessCollection: "",
    ruleEngineRun: "",
    ruleEngineNotRunReason: "",
    ruleEngineError: "",
    errorFixRemarks: "",
    issuesFixed: "",
    signedGeneralConsent: "",
    signedTreatmentConsent: "",
    preAuthAvailable: "",
    signedTxPlan: "",
    perioChart: "",
    nvd: "",
    xRayPanoAttached: "",
    majorServiceForm: "",
    routeSheet: "",
    prcUpdatedInRouteSheet: "",
    narrative: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [extractedData, setExtractedData] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // appointmentInfo
      formData.append(
        "appointmentInfo",
        JSON.stringify({
          patientId: formState.patientId,
          dateOfService: formState.dateOfService,
          officeName: formState.officeName,
        })
      );

      // Image (optional)
      if (imageFile) {
        formData.append("officeWalkoutSnip", imageFile);
      }

      // Extracted data (optional)
      if (extractedData) {
        formData.append("extractedData", extractedData);
      }

      // Note (optional)
      if (note) {
        formData.append("newOfficeNote", note);
      }

      // All office section fields
      Object.keys(formState).forEach((key) => {
        if (!["patientId", "dateOfService", "officeName"].includes(key)) {
          formData.append(key, formState[key]);
        }
      });

      // Send request
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:5000/api/walkouts/submit-office",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        console.log("Walkout ID:", result.data._id);
        console.log("Image ID:", result.data.officeWalkoutSnip?.imageId);
      } else {
        setError(result.message);
        console.error("Validation errors:", result.errors);
      }
    } catch (err) {
      setError("Failed to submit: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields here */}
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Office Section"}
      </button>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">Submitted successfully!</div>}
    </form>
  );
};

export default OfficeWalkoutForm;
```

---

**Implementation Complete!** 🎉

Is guide ko follow karke frontend implement kar sakte ho. Koi issue ho to batao!
"uploadedAt": "2026-01-09T10:00:00.000Z"
}
}
}

```

---

## ⚠️ Key Points

1. **appointmentInfo Required** - First submit pe mandatory
2. **Image Optional** - Submit/update anytime, multiple times
3. **imageId Use Karo** - Response me milti hai, isi se image display karo
4. **Auth Mandatory** - Bearer token har request me
5. **Content-Type Mat Set Karo** - Browser automatically set karega FormData ke liye
6. **Update Flexibility** - Image nahi bheji to purani imageId preserve hoti hai
```
