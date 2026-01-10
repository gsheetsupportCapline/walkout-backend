const sharp = require("sharp");

/**
 * Image Processing Utilities
 * Handles image optimization and format conversion
 */

/**
 * Convert image to WebP format with compression
 * @param {Buffer} buffer - Original image buffer
 * @param {Object} options - Conversion options
 * @returns {Promise<Buffer>} - Converted WebP buffer
 */
const convertToWebP = async (buffer, options = {}) => {
  try {
    const {
      quality = 95, // 95% quality - High quality for AI/OCR data extraction
      maxWidth = 3840, // Max width (4K resolution support)
      maxHeight = 3840, // Max height (4K resolution support)
    } = options;

    // Convert to WebP with compression and resizing if needed
    const webpBuffer = await sharp(buffer)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside", // Maintain aspect ratio
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({
        quality: quality,
        effort: 4, // Compression effort (0-6, higher = smaller file but slower)
        smartSubsample: true, // Better quality for text/details
      })
      .toBuffer();

    console.log(
      `📦 Image converted to WebP. Original: ${(buffer.length / 1024).toFixed(
        2
      )}KB → WebP: ${(webpBuffer.length / 1024).toFixed(2)}KB`
    );

    return webpBuffer;
  } catch (error) {
    console.error("❌ Error converting image to WebP:", error);
    throw new Error(`WebP conversion failed: ${error.message}`);
  }
};

/**
 * Get image metadata
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: buffer.length,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    console.error("❌ Error getting image metadata:", error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Process image for upload
 * Converts to WebP and optimizes
 * @param {Buffer} buffer - Original image buffer
 * @param {String} originalName - Original filename
 * @returns {Promise<Object>} - { buffer, fileName, mimeType }
 */
const processImageForUpload = async (buffer, originalName) => {
  try {
    // Get original metadata
    const metadata = await getImageMetadata(buffer);
    console.log(`📸 Processing image: ${originalName}`, {
      originalFormat: metadata.format,
      dimensions: `${metadata.width}x${metadata.height}`,
      originalSize: `${(metadata.size / 1024).toFixed(2)}KB`,
    });

    // Convert to WebP
    const webpBuffer = await convertToWebP(buffer);

    // Change file extension to .webp
    const webpFileName = originalName.replace(/\.[^.]+$/, ".webp");

    return {
      buffer: webpBuffer,
      fileName: webpFileName,
      mimeType: "image/webp",
      metadata: {
        originalFormat: metadata.format,
        originalSize: metadata.size,
        optimizedSize: webpBuffer.length,
        compressionRatio: (
          ((metadata.size - webpBuffer.length) / metadata.size) *
          100
        ).toFixed(1),
      },
    };
  } catch (error) {
    console.error("❌ Error processing image:", error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

module.exports = {
  convertToWebP,
  getImageMetadata,
  processImageForUpload,
};
