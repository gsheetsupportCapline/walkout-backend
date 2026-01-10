const initializeDrive = require("../config/googleDrive");
const initializeDriveWithOAuth = require("../config/googleDriveOAuth");
const { getFolderIdWithMapping } = require("./folderMappingHelper");
const stream = require("stream");

// Use OAuth Drive (with user's storage) for file uploads
const getDriveForUpload = () => {
  // Check if OAuth credentials are available
  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    console.log("📤 Using OAuth Drive (User's storage)");
    return initializeDriveWithOAuth();
  } else {
    console.log("📤 Using Service Account Drive (No storage quota)");
    return initializeDrive();
  }
};

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
 * Upload file to Google Drive with folder structure (OPTIMIZED)
 * Uses MongoDB folder mapping for fast access (NO compression)
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name with extension
 * @param {String} mimeType - File MIME type
 * @param {Object} appointmentInfo - { patientId, dateOfService, officeName }
 * @param {String} subFolderType - Type of subfolder (default: "officeWalkoutSnip")
 * @returns {Object} - { fileId, fileName, uploadedAt }
 */
const uploadToGoogleDrive = async (
  fileBuffer,
  fileName,
  mimeType,
  appointmentInfo,
  subFolderType = "officeWalkoutSnip"
) => {
  try {
    const startTime = Date.now();
    const drive = getDriveForUpload();

    const { patientId, dateOfService, officeName } = appointmentInfo;

    // Parse date
    const date = new Date(dateOfService);
    const year = date.getFullYear().toString();
    const month = getMonthName(date);

    console.log(
      `📤 Starting upload for: ${officeName} / ${year} / ${month} / Patient ${patientId}`
    );

    // Step 1: Get folder ID using mapping (MongoDB cache + Drive fallback)
    console.log("🗂️ Getting folder ID from mapping...");
    const targetFolderId = await getFolderIdWithMapping(
      year,
      month,
      officeName,
      subFolderType
    );

    // Step 2: Upload original file (NO compression)
    const timestamp = Date.now();
    const fileExtension = fileName.split(".").pop();
    const finalFileName = `${patientId}_${timestamp}.${fileExtension}`;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: finalFileName,
      parents: [targetFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    console.log(
      `📤 Uploading original file: ${finalFileName} (${(
        fileBuffer.length / 1024
      ).toFixed(2)}KB)`
    );

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name",
      supportsAllDrives: true,
    });

    const uploadTime = Date.now() - startTime;
    console.log(
      `✅ File uploaded successfully in ${uploadTime}ms: ${finalFileName} (ID: ${file.data.id})`
    );

    return {
      fileId: file.data.id,
      fileName: finalFileName,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error("❌ Error uploading to Google Drive:", error);
    throw new Error(`Google Drive upload failed: ${error.message}`);
  }
};

/**
 * Get file from Google Drive as buffer
 * @param {String} fileId - Google Drive file ID
 * @returns {Object} - { buffer, mimeType }
 */
const getFileFromDrive = async (fileId) => {
  try {
    // Use OAuth Drive (same as upload) instead of Service Account
    const drive = getDriveForUpload();

    // Get file metadata first
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: "mimeType, name",
      supportsAllDrives: true,
    });

    // Get file content
    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      {
        responseType: "arraybuffer",
      }
    );

    return {
      buffer: Buffer.from(response.data),
      mimeType: metadata.data.mimeType,
      fileName: metadata.data.name,
    };
  } catch (error) {
    console.error("❌ Error getting file from Google Drive:", error);
    throw new Error(`Failed to retrieve file: ${error.message}`);
  }
};

module.exports = {
  uploadToGoogleDrive,
  getFileFromDrive,
};
