const { PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const initializeS3 = require("../config/s3");

// Initialize S3 client lazily (when first needed)
let s3Client = null;
const getS3Client = () => {
  if (!s3Client) {
    s3Client = initializeS3();
  }
  return s3Client;
};

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Get month name from date
 */
const getMonthName = (date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[date.getMonth()];
};

/**
 * Upload file to AWS S3 with folder structure
 * Structure: walkout/YEAR/MONTH/OFFICE_NAME/SUBFOLDER_TYPE/filename
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name with extension
 * @param {String} mimeType - File MIME type
 * @param {Object} appointmentInfo - { patientId, dateOfService, officeName }
 * @param {String} subFolderType - Type of subfolder (default: "officeWalkoutSnip")
 * @returns {Object} - { fileKey, fileName, uploadedAt, fileUrl }
 */
const uploadToS3 = async (
  fileBuffer,
  fileName,
  mimeType,
  appointmentInfo,
  subFolderType = "officeWalkoutSnip",
) => {
  try {
    const startTime = Date.now();

    const { patientId, dateOfService, officeName } = appointmentInfo;

    // Parse date
    const date = new Date(dateOfService);
    const year = date.getFullYear().toString();
    const month = getMonthName(date);

    // Clean office name for S3 key (replace spaces with underscores)
    const cleanOfficeName = officeName.replace(/\s+/g, "_");

    // Create S3 key with folder structure
    // Format: walkout/2026/January/Dallas_Office/officeWalkoutSnip/patient_123_filename.jpg
    const s3Key = `walkout/${year}/${month}/${cleanOfficeName}/${subFolderType}/patient_${patientId}_${Date.now()}_${fileName}`;

    console.log(`📤 Uploading to S3: ${s3Key}`);

    // Upload command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        patientId: patientId.toString(),
        dateOfService: dateOfService,
        officeName: officeName,
        uploadedAt: new Date().toISOString(),
      },
    });

    await getS3Client().send(command);

    const uploadTime = Date.now() - startTime;
    console.log(`✅ Upload completed in ${uploadTime}ms`);
    console.log(`📍 S3 Key: ${s3Key}`);

    return {
      fileKey: s3Key, // S3 key (like Google Drive file ID)
      fileName: fileName,
      uploadedAt: new Date(),
      bucket: BUCKET_NAME,
      region: process.env.AWS_REGION || "us-east-1",
    };
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Get file from S3 as buffer
 * @param {String} fileKey - S3 file key
 * @returns {Promise<Buffer>} - File buffer
 */
const getFileFromS3 = async (fileKey) => {
  try {
    console.log(`📥 Fetching file from S3: ${fileKey}`);

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const response = await getS3Client().send(command);

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    console.log(`✅ File fetched successfully (${buffer.length} bytes)`);
    return buffer;
  } catch (error) {
    console.error("❌ Error getting file from S3:", error);
    throw new Error(`Failed to fetch file from S3: ${error.message}`);
  }
};

/**
 * Generate presigned URL for temporary file access
 * @param {String} fileKey - S3 file key
 * @param {Number} expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns {Promise<String>} - Presigned URL
 */
const getPresignedUrl = async (fileKey, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(getS3Client(), command, { expiresIn });
    console.log(`🔗 Generated presigned URL (expires in ${expiresIn}s)`);
    return url;
  } catch (error) {
    console.error("❌ Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  getFileFromS3,
  getPresignedUrl,
};
