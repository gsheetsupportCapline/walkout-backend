# S3 Image Preview Guide

## 📷 Image Access Methods

Ab S3 se images access karne ke **2 methods** hain:

---

## Method 1: Direct Proxy (Current - Working) ✅

Backend se image fetch hoti hai aur serve hoti hai.

### Frontend Code:

```javascript
const imageId =
  "walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_1706234567890_image.jpg";

// Use this URL in <img> tag
const imageUrl = `http://localhost:5000/api/walkouts/image/${encodeURIComponent(imageId)}`;
```

### Complete Example:

```jsx
import { useState } from "react";

function WalkoutImage({ imageId }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (imageId) {
      // Encode the S3 key properly
      const encodedId = encodeURIComponent(imageId);
      setImageUrl(`http://localhost:5000/api/walkouts/image/${encodedId}`);
    }
  }, [imageId]);

  return (
    <div>
      {imageUrl && (
        <img src={imageUrl} alt="Walkout" style={{ maxWidth: "100%" }} />
      )}
    </div>
  );
}
```

### API Endpoint:

```
GET /api/walkouts/image/:imageId
```

**Example:**

```
GET http://localhost:5000/api/walkouts/image/walkout%2F2026%2FJanuary%2FDallas_Office%2FofficeWalkoutSnip%2Fpatient_123_1706234567890_image.jpg
```

**Response:** Image binary data (direct image stream)

---

## Method 2: Presigned URL (OPTIONAL - Better Performance) ⚡

Agar performance important hai to presigned URL use karo. Direct S3 se image load hoti hai.

### Frontend Code:

```javascript
const imageId =
  "walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_1706234567890_image.jpg";

// Step 1: Get presigned URL from backend
const response = await fetch(
  `http://localhost:5000/api/walkouts/image-url/${encodeURIComponent(imageId)}`,
);
const data = await response.json();

// Step 2: Use presigned URL in <img> tag
const imageUrl = data.url; // This is direct S3 URL
```

### Complete Example:

```jsx
import { useState, useEffect } from "react";

function WalkoutImageOptimized({ imageId }) {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPresignedUrl = async () => {
      try {
        const encodedId = encodeURIComponent(imageId);
        const response = await fetch(
          `http://localhost:5000/api/walkouts/image-url/${encodedId}`,
        );
        const data = await response.json();

        if (data.success) {
          setImageUrl(data.url);
        }
      } catch (error) {
        console.error("Error fetching image URL:", error);
      } finally {
        setLoading(false);
      }
    };

    if (imageId) {
      fetchPresignedUrl();
    }
  }, [imageId]);

  if (loading) return <div>Loading image...</div>;

  return (
    <div>
      {imageUrl && (
        <img src={imageUrl} alt="Walkout" style={{ maxWidth: "100%" }} />
      )}
    </div>
  );
}
```

### API Endpoint:

```
GET /api/walkouts/image-url/:imageId
```

**Example:**

```
GET http://localhost:5000/api/walkouts/image-url/walkout%2F2026%2FJanuary%2FDallas_Office%2FofficeWalkoutSnip%2Fpatient_123_1706234567890_image.jpg
```

**Response:**

```json
{
  "success": true,
  "url": "https://your-bucket.s3.ap-south-1.amazonaws.com/walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_1706234567890_image.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
  "expiresIn": 3600
}
```

**Note:** URL expires in 1 hour (3600 seconds)

---

## Comparison

| Feature      | Method 1 (Proxy) | Method 2 (Presigned URL) |
| ------------ | ---------------- | ------------------------ |
| Setup        | Easy             | Medium                   |
| Performance  | Good             | Excellent                |
| Backend Load | High             | Low                      |
| Security     | Backend controls | Time-limited URL         |
| Caching      | 1 hour           | Browser cache            |
| S3 Bandwidth | Backend to S3    | Direct S3 to user        |
| Use Case     | Small traffic    | High traffic             |

---

## Testing

### Test with cURL:

**Method 1 (Proxy):**

```bash
curl http://localhost:5000/api/walkouts/image/walkout%2F2026%2FJanuary%2FDallas_Office%2FofficeWalkoutSnip%2Fpatient_123_1706234567890_image.jpg --output test.jpg
```

**Method 2 (Presigned URL):**

```bash
# Step 1: Get URL
curl http://localhost:5000/api/walkouts/image-url/walkout%2F2026%2FJanuary%2FDallas_Office%2FofficeWalkoutSnip%2Fpatient_123_1706234567890_image.jpg

# Step 2: Copy URL from response and download
curl "https://your-bucket.s3.ap-south-1.amazonaws.com/walkout/...?X-Amz-..." --output test.jpg
```

---

## Important Notes

### URL Encoding

S3 keys me `/` hota hai, so properly encode karo:

```javascript
// ❌ Wrong
const url = `http://localhost:5000/api/walkouts/image/${imageId}`;

// ✅ Correct
const url = `http://localhost:5000/api/walkouts/image/${encodeURIComponent(imageId)}`;
```

### Example Image IDs from Upload Response:

```json
{
  "success": true,
  "data": {
    "officeWalkoutSnip": {
      "imageId": "walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_1706234567890_image.jpg",
      "fileName": "image.jpg",
      "uploadedAt": "2026-01-25T10:30:00.000Z"
    }
  }
}
```

Use the `imageId` directly in both methods!

---

## Recommended Approach

### For Development:

Use **Method 1** (Proxy) - simpler, easier to debug

### For Production:

Use **Method 2** (Presigned URL) - faster, reduces backend load

---

## Troubleshooting

### Image not loading?

1. Check if `imageId` is properly URL encoded
2. Check backend logs for S3 errors
3. Verify S3 credentials in `.env`
4. Check if file exists in S3 bucket

### Console Errors?

```javascript
// Add error handling
<img
  src={imageUrl}
  alt="Walkout"
  onError={(e) => {
    console.error("Image failed to load:", e);
    e.target.src = "/placeholder.jpg"; // Fallback image
  }}
/>
```

### CORS Issues?

S3 bucket CORS configuration (if using presigned URLs in browser):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

---

## Summary

✅ **Upload**: Works with S3  
✅ **Preview**: 2 methods available  
✅ **Same API**: No frontend breaking changes  
✅ **imageId**: Now S3 key instead of Google Drive file ID

Choose the method based on your needs! 🚀
