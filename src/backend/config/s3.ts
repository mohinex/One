import { S3Client } from "@aws-sdk/client-s3";

let s3Instance: S3Client | null = null;

export function getS3Client(): S3Client | null {
  if (!s3Instance) {
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "auto";

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    s3Instance = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Instance;
}
