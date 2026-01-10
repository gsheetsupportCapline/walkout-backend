const mongoose = require("mongoose");

/**
 * FolderMapping Schema
 * Stores Google Drive folder structure for fast access
 * Structure: Year → Month → Office → SubFolders (officeWalkoutSnip, checkImage, lc3WalkoutImage)
 */

const subFoldersSchema = new mongoose.Schema(
  {
    officeWalkoutSnip: {
      type: String,
      default: null,
      description: "Folder ID for Office Walkout Snip images",
    },
    checkImage: {
      type: String,
      default: null,
      description: "Folder ID for Check images (future use)",
    },
    lc3WalkoutImage: {
      type: String,
      default: null,
      description: "Folder ID for LC3 Walkout images (future use)",
    },
  },
  { _id: false }
);

const officeSchema = new mongoose.Schema(
  {
    folderId: {
      type: String,
      required: true,
      description: "Office folder ID in Google Drive",
    },
    subFolders: {
      type: subFoldersSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const monthSchema = new mongoose.Schema(
  {
    folderId: {
      type: String,
      required: true,
      description: "Month folder ID in Google Drive",
    },
    offices: {
      type: Map,
      of: officeSchema,
      default: () => new Map(),
    },
  },
  { _id: false }
);

const folderMappingSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: true,
      unique: true,
      description: "Year (e.g., '2026')",
    },
    folderId: {
      type: String,
      required: true,
      description: "Year folder ID in Google Drive",
    },
    months: {
      type: Map,
      of: monthSchema,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
folderMappingSchema.index({ year: 1 });

module.exports = mongoose.model("FolderMapping", folderMappingSchema);
