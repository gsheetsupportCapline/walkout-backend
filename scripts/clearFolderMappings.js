/**
 * Script to clear folder mappings from MongoDB
 * Run this to reset cache and let system rebuild folder mappings
 */

require("dotenv").config();
const mongoose = require("mongoose");
const FolderMapping = require("../models/FolderMapping");

const clearMappings = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    console.log("🗑️ Clearing all folder mappings...");
    const result = await FolderMapping.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} mapping(s)\n`);

    console.log("✨ Done! Now run your server and upload a file.");
    console.log("   The system will automatically:");
    console.log("   1. Search for existing folders in Drive");
    console.log("   2. Save folder IDs to MongoDB");
    console.log("   3. Use cache for next uploads (super fast!)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

clearMappings();
