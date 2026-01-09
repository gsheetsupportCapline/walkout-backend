const initializeDrive = require("../config/googleDrive");
const initializeDriveWithOAuth = require("../config/googleDriveOAuth");
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
 * Find or create folder by name in parent folder
 */
const findOrCreateFolder = async (drive, folderName, parentFolderId) => {
  try {
    // Search for existing folder
    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    // If folder exists, return its ID
    if (response.data.files.length > 0) {
      console.log(`📁 Found existing folder: ${folderName}`);
      return response.data.files[0].id;
    }

    // Create new folder
    console.log(`📁 Creating new folder: ${folderName}`);
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(`✅ Created folder: ${folderName} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error(`❌ Error in findOrCreateFolder for ${folderName}:`, error);
    throw error;
  }
};

/**
 * Upload file to Google Drive with folder structure
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name with extension
 * @param {String} mimeType - File MIME type
 * @param {Object} appointmentInfo - { patientId, dateOfService, officeName }
 * @returns {Object} - { fileId, fileName, uploadedAt }
 */
const uploadToGoogleDrive = async (
  fileBuffer,
  fileName,
  mimeType,
  appointmentInfo
) => {
  try {
    const drive = getDriveForUpload(); // Use OAuth drive
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!rootFolderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not found in environment");
    }

    const { patientId, dateOfService, officeName } = appointmentInfo;

    // Parse date
    const date = new Date(dateOfService);
    const year = date.getFullYear().toString();
    const month = getMonthName(date);

    console.log(
      `📤 Uploading file for: ${officeName} / ${year} / ${month} / Patient ${patientId}`
    );

    // Step 1: Find or create Year folder
    const yearFolderId = await findOrCreateFolder(drive, year, rootFolderId);

    // Step 2: Find or create Month folder inside Year
    const monthFolderId = await findOrCreateFolder(drive, month, yearFolderId);

    // Step 3: Find or create Office folder inside Month
    const officeFolderId = await findOrCreateFolder(
      drive,
      officeName,
      monthFolderId
    );

    // Step 4: Find or create "Office Walkout" folder inside Office
    const officeWalkoutFolderId = await findOrCreateFolder(
      drive,
      "Office Walkout",
      officeFolderId
    );

    // Step 5: Upload file to Office Walkout folder
    const timestamp = Date.now();
    const fileExtension = fileName.split(".").pop();
    const finalFileName = `${patientId}_${timestamp}.${fileExtension}`;

    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata = {
      name: finalFileName,
      parents: [officeWalkoutFolderId],
    };

    const media = {
      mimeType: mimeType,
      body: bufferStream,
    };

    console.log(`📤 Uploading file: ${finalFileName}`);

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, name",
      supportsAllDrives: true,
    });

    console.log(
      `✅ File uploaded successfully: ${finalFileName} (ID: ${file.data.id})`
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
