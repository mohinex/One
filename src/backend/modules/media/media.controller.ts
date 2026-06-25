import { Response, NextFunction } from "express";
import { getPrisma } from "../../config/db.ts";
import { getS3Client } from "../../config/s3.ts";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { AppError } from "../../utils/errors.ts";
import { saveUploadedFile } from "../../middlewares/upload.ts";
import fs from "fs";
import path from "path";

// Startup check to verify if the 'uploads/' directory exists in the project root; if not, create it
const projectRootUploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(projectRootUploadsDir)) {
  fs.mkdirSync(projectRootUploadsDir, { recursive: true });
}

export async function uploadMedia(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      throw new AppError("No file resource provided in multipart body.", 400, "MISSING_FILE");
    }

    const prisma = getPrisma();
    let width: number | null = null;
    let height: number | null = null;

    // Sharp dimension parsing
    if (file.mimetype.startsWith("image/")) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (err: any) {
        console.warn("Could not parse image dimensions with Sharp:", err.message);
      }
    }

    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    
    // Save/Upload the file buffer dynamically to S3 or fall back to local disk storage
    const uploadResult = await saveUploadedFile(file, userId, sanitizedFilename);
    
    // Robust verification: ensure CDN_URL/remote S3 URL resolution correctly falls back to a local relative path
    // if the remote S3 URL or S3 client is null or undefined.
    const s3Client = getS3Client();
    const s3Bucket = uploadResult.s3Bucket || process.env.S3_BUCKET || "eurosia-media";
    const remoteS3Url = (s3Client && s3Bucket) ? (process.env.CDN_URL || `https://${s3Bucket}.s3.amazonaws.com`) : null;

    let fileUrl = uploadResult.url;
    if (!remoteS3Url || uploadResult.storageType !== "s3") {
      const localFilename = path.basename(fileUrl);
      fileUrl = `/uploads/${userId}/${localFilename}`;
    }

    const s3Key = uploadResult.s3Key || `users/${userId}/${Date.now()}-${sanitizedFilename}`;


    // Save record to DB, update usage bytes in transaction
    const savedFile = await prisma.$transaction(async (tx) => {
      const media = await tx.mediaFile.create({
        data: {
          filename: sanitizedFilename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: fileUrl,
          s3Key: s3Key,
          s3Bucket: s3Bucket,
          folder: req.body.folder || "general",
          width,
          height,
          uploadedBy: userId,
          isPublic: req.body.isPublic !== "false",
        },
      });

      // Update users usage metrics in DB
      await tx.userUsage.update({
        where: { userId },
        data: {
          storageUsedBytes: { increment: BigInt(file.size) },
        },
      });

      return media;
    });

    res.status(201).json({
      success: true,
      data: {
        id: savedFile.id,
        url: savedFile.url,
        filename: savedFile.filename,
        mimeType: savedFile.mimeType,
        size: savedFile.size,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMedia(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const adminRole = req.user.role;
    const mediaId = req.params.id;
    const prisma = getPrisma();

    const media = await prisma.mediaFile.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError("Specified media resource not found.", 404, "FILE_NOT_FOUND");
    }

    // Auth gating: owner or administrator permissions
    if (media.uploadedBy !== userId && adminRole !== "ADMIN" && adminRole !== "SUPER_ADMIN") {
      throw new AppError("Permissions denied to remove this file.", 403, "FORBIDDEN");
    }

    // Try deleting from cloud
    try {
      const s3Client = getS3Client();
      if (!s3Client) {
        throw new Error("S3 is not configured");
      }
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: media.s3Bucket,
          Key: media.s3Key,
        })
      );
    } catch {
      // Local removal if it exists on disk
      try {
        const localPath = path.join(process.cwd(), "public", media.url);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      } catch {
        // ignore fallback errors
      }
    }

    // Database deletion
    await prisma.$transaction([
      prisma.mediaFile.delete({ where: { id: mediaId } }),
      prisma.userUsage.update({
        where: { userId: media.uploadedBy },
        data: {
          storageUsedBytes: { decrement: BigInt(media.size) },
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Media resource removed and billing storage footprint reclaimed.",
    });
  } catch (error) {
    next(error);
  }
}

export async function listMedia(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const folder = (req.query.folder as string) || "";
    const mimeType = (req.query.mimeType as string) || "";

    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where: any = {
      uploadedBy: userId,
    };

    if (folder) where.folder = folder;
    if (mimeType) {
      where.mimeType = {
        contains: mimeType,
      };
    }

    const [media, total] = await Promise.all([
      prisma.mediaFile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.mediaFile.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        media,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
