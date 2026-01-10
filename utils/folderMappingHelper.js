const FolderMapping = require("../models/FolderMapping");
const initializeDrive = require("../config/googleDrive");
const initializeDriveWithOAuth = require("../config/googleDriveOAuth");

/**
 * Get Drive instance (OAuth preferred, fallback to Service Account)
 */
const getDriveInstance = () => {
  try {
    if (
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN
    ) {
      return initializeDriveWithOAuth();
    }
    return initializeDrive();
  } catch (error) {
    console.error("❌ Error getting Drive instance:", error);
    throw error;
  }
};

/**
 * Search for folder by name in parent folder
 * @param {String} folderName - Folder name to search
 * @param {String} parentFolderId - Parent folder ID
 * @returns {Promise<String|null>} - Folder ID or null if not found
 */
const searchFolderInDrive = async (folderName, parentFolderId) => {
  try {
    const drive = getDriveInstance();

    const response = await drive.files.list({
      q: `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log(
        `✅ Found existing folder: ${folderName} (${response.data.files[0].id})`
      );
      return response.data.files[0].id;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error searching folder ${folderName}:`, error);
    throw error;
  }
};

/**
 * Create folder in Google Drive
 * @param {String} folderName - Folder name
 * @param {String} parentFolderId - Parent folder ID
 * @returns {Promise<String>} - Created folder ID
 */
const createFolderInDrive = async (folderName, parentFolderId) => {
  try {
    const drive = getDriveInstance();

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
      supportsAllDrives: true,
    });

    console.log(`✅ Created new folder: ${folderName} (${response.data.id})`);
    return response.data.id;
  } catch (error) {
    console.error(`❌ Error creating folder ${folderName}:`, error);
    throw error;
  }
};

/**
 * Get or create folder (search first, then create if not found)
 * @param {String} folderName - Folder name
 * @param {String} parentFolderId - Parent folder ID
 * @returns {Promise<String>} - Folder ID
 */
const getOrCreateFolder = async (folderName, parentFolderId) => {
  // First, search for existing folder
  let folderId = await searchFolderInDrive(folderName, parentFolderId);

  // If not found, create new folder
  if (!folderId) {
    folderId = await createFolderInDrive(folderName, parentFolderId);
  }

  return folderId;
};

/**
 * Get folder IDs from mapping with Drive fallback
 * @param {String} year - Year (e.g., "2026")
 * @param {String} month - Month (e.g., "January")
 * @param {String} officeName - Office name
 * @param {String} subFolderType - SubFolder type ("officeWalkoutSnip", "checkImage", "lc3WalkoutImage")
 * @returns {Promise<String>} - Final folder ID for upload
 */
const getFolderIdWithMapping = async (
  year,
  month,
  officeName,
  subFolderType = "officeWalkoutSnip"
) => {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Step 1: Check MongoDB for existing mapping
    let mapping = await FolderMapping.findOne({ year });

    // Step 2: If year not in DB, search/create in Drive and save
    if (!mapping) {
      console.log(`📂 Year ${year} not in DB. Searching in Drive...`);
      const yearFolderId = await getOrCreateFolder(year, rootFolderId);

      mapping = new FolderMapping({
        year: year,
        folderId: yearFolderId,
        months: new Map(),
      });
      await mapping.save();
      console.log(`✅ Year ${year} mapping saved to DB`);
    }

    // Step 3: Check for month in mapping
    let monthData = mapping.months.get(month);
    if (!monthData) {
      console.log(`📂 Month ${month} not in DB. Searching in Drive...`);
      const monthFolderId = await getOrCreateFolder(month, mapping.folderId);

      monthData = {
        folderId: monthFolderId,
        offices: new Map(),
      };
      mapping.months.set(month, monthData);
      mapping.markModified("months"); // Important: Tell Mongoose about nested change
      await mapping.save();
      console.log(`✅ Month ${month} mapping saved to DB`);
    }

    // Step 4: Check for office in mapping
    let officeData = monthData.offices.get(officeName);
    if (!officeData) {
      console.log(`📂 Office ${officeName} not in DB. Searching in Drive...`);
      const officeFolderId = await getOrCreateFolder(
        officeName,
        monthData.folderId
      );

      officeData = {
        folderId: officeFolderId,
        subFolders: {},
      };
      monthData.offices.set(officeName, officeData);
      mapping.markModified("months"); // Important: Tell Mongoose about nested change
      await mapping.save();
      console.log(`✅ Office ${officeName} mapping saved to DB`);
    }

    // Step 5: Check for subfolder in mapping
    let subFolderId = officeData.subFolders[subFolderType];
    if (!subFolderId) {
      console.log(
        `📂 SubFolder ${subFolderType} not in DB. Searching in Drive...`
      );

      // SubFolder names mapping (CORRECT NAMES)
      const subFolderNames = {
        officeWalkoutSnip: "Office Walkout", // ✅ Correct name
        checkImage: "Check Image", // ✅ Correct name
        lc3WalkoutImage: "LC3 Walkout", // ✅ Correct name
      };

      const subFolderName = subFolderNames[subFolderType];
      subFolderId = await getOrCreateFolder(subFolderName, officeData.folderId);

      // FIX: Create new object to trigger Mongoose change detection
      officeData.subFolders = {
        ...officeData.subFolders,
        [subFolderType]: subFolderId,
      };

      // Update in Map
      monthData.offices.set(officeName, officeData);
      mapping.months.set(month, monthData);
      mapping.markModified("months");
      await mapping.save();

      // Verify save
      const verifyMapping = await FolderMapping.findOne({ year });
      const verifySubFolder = verifyMapping.months
        .get(month)
        .offices.get(officeName).subFolders[subFolderType];
      console.log(
        `✅ SubFolder ${subFolderType} saved to DB. Verified: ${
          verifySubFolder === subFolderId ? "YES ✓" : "NO ✗"
        }`
      );
    }

    console.log(
      `🎯 Final folder ID for upload: ${subFolderId} (Retrieved from ${
        officeData.subFolders[subFolderType] ? "DB cache ⚡" : "Drive search 🔍"
      })`
    );

    return subFolderId;
  } catch (error) {
    console.error("❌ Error in getFolderIdWithMapping:", error);
    throw error;
  }
};

/**
 * Clear folder mappings (for testing/reset)
 * @param {String} year - Optional year to clear (if not provided, clears all)
 */
const clearFolderMappings = async (year = null) => {
  try {
    if (year) {
      await FolderMapping.deleteOne({ year });
      console.log(`✅ Cleared folder mapping for year ${year}`);
    } else {
      await FolderMapping.deleteMany({});
      console.log(`✅ Cleared all folder mappings`);
    }
  } catch (error) {
    console.error("❌ Error clearing folder mappings:", error);
    throw error;
  }
};

module.exports = {
  getFolderIdWithMapping,
  clearFolderMappings,
  searchFolderInDrive,
  createFolderInDrive,
  getOrCreateFolder,
};
