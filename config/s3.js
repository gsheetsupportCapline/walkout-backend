const { S3Client } = require("@aws-sdk/client-s3");

// Create a single S3 client instance
let s3Client = null;

/**
 * Initialize AWS S3 Client (singleton pattern)
 * @returns {S3Client} - Configured S3 client
 */
const initializeS3 = () => {
  if (s3Client) {
    return s3Client; // Return existing instance
  }

  // Validate credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "AWS credentials are missing. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file",
    );
  }

  if (!process.env.AWS_S3_BUCKET_NAME) {
    throw new Error(
      "AWS_S3_BUCKET_NAME is missing. Please set it in .env file",
    );
  }

  s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  console.log(
    `✅ S3 Client initialized for region: ${process.env.AWS_REGION || "us-east-1"}`,
  );
  console.log(`✅ S3 Bucket: ${process.env.AWS_S3_BUCKET_NAME}`);

  return s3Client;
};

module.exports = initializeS3;
