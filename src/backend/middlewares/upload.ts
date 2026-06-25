import multer from "multer";
import { AppError } from "../utils/errors.ts";
import { getS3Client } from "../config/s3.ts";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Set memory storage so that files can be easily manipulated (e.g., sharp resizing)
// and uploaded to either local disk or S3 dynamically in controllers
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Unsupported file type. Only JPEG, WEBP, and PDF files are permitted in this system.", 400, "UNSUPPORTED_FILE_TYPE") as any, false);
    }
  },
});

/**
 * Helper logic to upload/save a file buffer to S3 (if available) or fallback to local disk storage.
 * This satisfies the requirement to have a robust storage routing mechanism based on availability.
 */
export async function saveUploadedFile(
  file: Express.Multer.File,
  userId: string,
  customFilename?: string
): Promise<{ url: string; s3Key?: string; s3Bucket?: string; storageType: "s3" | "local" }> {
  const sanitizedFilename = customFilename || file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
  const s3Key = `users/${userId}/${Date.now()}-${sanitizedFilename}`;
  const s3Bucket = process.env.S3_BUCKET || "eurosia-media";

  // Check if S3 is configured and available
  const s3Client = getS3Client();
  
  // CDN_URL/S3 URL resolution: Fall back if remote S3 URL is null or undefined
  const remoteS3Url = (s3Client && s3Bucket) ? (process.env.CDN_URL || `https://${s3Bucket}.s3.amazonaws.com`) : null;

  if (s3Client && remoteS3Url) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: "public-read",
        })
      );

      return {
        url: `${remoteS3Url}/${s3Key}`,
        s3Key,
        s3Bucket,
        storageType: "s3",
      };
    } catch (err: any) {
      console.warn("S3 upload failed despite client creation, falling back to local storage:", err.message);
    }
  }

  // Fallback to local disk storage when remote S3 URL is null or undefined, or upload fails
  const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const localFilename = `${Date.now()}-${sanitizedFilename}`;
  const publicPath = path.join(uploadDir, localFilename);
  fs.writeFileSync(publicPath, file.buffer);

  return {
    url: `/uploads/${userId}/${localFilename}`,
    storageType: "local",
  };
}
