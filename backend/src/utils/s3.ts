import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { config } from "../config";

const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

function generateKey(folder: string, originalName: string): string {
  const ext = path.extname(originalName);
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${folder}/${uniqueSuffix}${ext}`;
}

function getPublicUrl(key: string): string {
  return `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  file: Express.Multer.File,
  folder = "images"
): Promise<string> {
  const key = generateKey(folder, file.originalname);

  const command = new PutObjectCommand({
    Bucket: config.aws.bucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  return getPublicUrl(key);
}

export async function uploadMultipleToS3(
  files: Express.Multer.File[],
  folder = "images"
): Promise<string[]> {
  const urls = await Promise.all(files.map((file) => uploadToS3(file, folder)));
  return urls;
}
