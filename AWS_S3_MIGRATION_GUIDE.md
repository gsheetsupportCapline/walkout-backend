# AWS S3 Migration Guide

## 🚀 Migration from Google Drive to AWS S3

This guide explains how to set up and use AWS S3 for image uploads instead of Google Drive.

---

## 📋 Prerequisites

1. **AWS Account** created
2. **S3 Bucket** created
3. **IAM User** with S3 access

---

## Step 1: AWS S3 Bucket Setup

### 1.1 Create S3 Bucket

1. Log in to **AWS Console**
2. Go to **S3** service
3. Click **Create bucket**
4. Configure:
   - **Bucket name**: `your-walkout-images` (must be globally unique)
   - **Region**: `us-east-1` (or your preferred region)
   - **Block Public Access**: Keep **all blocks enabled** (for security)
   - Leave other settings as default
5. Click **Create bucket**

### 1.2 Create IAM User for S3 Access

1. Go to **IAM** service
2. Click **Users** → **Create user**
3. User name: `walkout-s3-user`
4. Click **Next**
5. **Permissions**: Click **Attach policies directly**
6. Search and select: `AmazonS3FullAccess` (or create custom policy below)
7. Click **Next** → **Create user**

### 1.3 Create Access Keys

1. Click on the created user
2. Go to **Security credentials** tab
3. Scroll to **Access keys**
4. Click **Create access key**
5. Select: **Application running outside AWS**
6. Click **Next** → **Create access key**
7. **IMPORTANT**: Save these credentials:
   - `Access key ID`
   - `Secret access key`

---

## Step 2: Environment Configuration

Add these variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=your-walkout-images
```

---

## Step 3: S3 Folder Structure

S3 automatically creates folders when you upload files with `/` in the key.

### Folder Structure (Same as Google Drive):

```
your-walkout-images/
└── walkout/
    └── 2026/
        └── January/
            └── Dallas_Office/
                └── officeWalkoutSnip/
                    ├── patient_123_1234567890_image1.jpg
                    ├── patient_124_1234567891_image2.png
                    └── ...
```

### Key Format:

```
walkout/YEAR/MONTH/OFFICE_NAME/SUBFOLDER_TYPE/patient_PATIENTID_TIMESTAMP_FILENAME
```

**Example:**

```
walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_1706234567890_walkout.jpg
```

---

## Step 4: Features Comparison

| Feature           | Google Drive | AWS S3                 |
| ----------------- | ------------ | ---------------------- |
| Folder Structure  | ✅ Yes       | ✅ Yes (via key paths) |
| Automatic Folders | ✅ Yes       | ✅ Yes (auto-created)  |
| File Upload       | ✅           | ✅                     |
| File Retrieval    | ✅           | ✅                     |
| Presigned URLs    | ❌           | ✅ (temporary access)  |
| Cost              | Free (15GB)  | Pay-as-you-go          |
| Speed             | Medium       | Fast                   |
| Security          | OAuth        | IAM credentials        |

---

## Step 5: API Usage (No Changes Required!)

### Upload Image

**Same API endpoint** - no changes needed:

```javascript
POST /api/walkouts

// FormData
{
  appointmentInfo: JSON.stringify({
    patientId: "123",
    dateOfService: "2026-01-25",
    officeName: "Dallas Office"
  }),
  officeWalkoutSnip: <image_file>
}
```

### Response

```javascript
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

**Note**: `imageId` is now the S3 key instead of Google Drive file ID.

---

## Step 6: Accessing Images

### Option 1: Direct Download (in code)

```javascript
const { getFileFromS3 } = require("./utils/s3Upload");

// Get file as buffer
const buffer = await getFileFromS3(imageKey);
```

### Option 2: Presigned URL (temporary public link)

```javascript
const { getPresignedUrl } = require("./utils/s3Upload");

// Generate URL valid for 1 hour
const url = await getPresignedUrl(imageKey, 3600);

// Use this URL in frontend
<img src={url} alt="Walkout Image" />;
```

---

## Step 7: Custom IAM Policy (Recommended)

Instead of `AmazonS3FullAccess`, create a **custom policy** for better security:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "WalkoutS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-walkout-images/*",
        "arn:aws:s3:::your-walkout-images"
      ]
    }
  ]
}
```

### To apply:

1. Go to **IAM** → **Policies** → **Create policy**
2. Click **JSON** tab
3. Paste above policy (replace bucket name)
4. Click **Review** → Name it `WalkoutS3Policy`
5. Attach to your IAM user

---

## Step 8: Testing

### Test S3 Connection

Create a test script `scripts/testS3.js`:

```javascript
const { uploadToS3 } = require("./utils/s3Upload");
const fs = require("fs");

async function testUpload() {
  try {
    const buffer = fs.readFileSync("./test-image.jpg");

    const result = await uploadToS3(buffer, "test.jpg", "image/jpeg", {
      patientId: "123",
      dateOfService: "2026-01-25",
      officeName: "Test Office",
    });

    console.log("✅ Upload successful:", result);
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

testUpload();
```

Run:

```bash
node scripts/testS3.js
```

---

## Step 9: Migration Checklist

- [x] Install AWS SDK packages
- [x] Create S3 bucket
- [x] Create IAM user with S3 permissions
- [x] Generate access keys
- [x] Add environment variables to `.env`
- [x] Update controller to use S3
- [ ] Test image upload
- [ ] Test image retrieval
- [ ] Update frontend (if needed)
- [ ] Deploy to production

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** to Git
2. **Use IAM roles** in production (EC2/Lambda)
3. **Enable S3 versioning** for file recovery
4. **Enable S3 encryption** at rest
5. **Use presigned URLs** for temporary access
6. **Set bucket policies** to restrict access
7. **Enable CloudTrail** for audit logging
8. **Rotate access keys** periodically

---

## 💰 Cost Estimation

### AWS S3 Pricing (us-east-1):

- **Storage**: $0.023 per GB/month
- **PUT requests**: $0.005 per 1,000 requests
- **GET requests**: $0.0004 per 1,000 requests
- **Data transfer OUT**: $0.09 per GB (first 10TB)

### Example Cost:

- 10,000 images (10GB): ~$0.23/month
- 100,000 uploads: ~$0.50
- 1M downloads: ~$0.40
- **Total**: ~$1.13/month for moderate usage

**Free Tier** (first 12 months):

- 5GB storage
- 20,000 GET requests
- 2,000 PUT requests

---

## 🆚 Why S3 over Google Drive?

1. ✅ **Better for APIs** - designed for programmatic access
2. ✅ **Faster** - lower latency
3. ✅ **Scalable** - unlimited storage
4. ✅ **Presigned URLs** - temporary secure access
5. ✅ **Versioning** - file history
6. ✅ **Integration** - works with AWS services
7. ✅ **No OAuth** - simpler authentication
8. ✅ **Cost-effective** - pay only what you use

---

## 📞 Support

If you encounter issues:

1. Check AWS credentials in `.env`
2. Verify bucket name and region
3. Check IAM permissions
4. Review CloudWatch logs
5. Test with AWS CLI: `aws s3 ls s3://your-bucket-name`

---

## 🔄 Rollback to Google Drive

If needed, revert changes:

```javascript
// In controllers/walkoutController.js
const { uploadToGoogleDrive } = require("../utils/driveUpload");
// const { uploadToS3 } = require("../utils/s3Upload");

// Change uploadToS3 back to uploadToGoogleDrive
```

No database changes needed - `imageId` field works for both!
