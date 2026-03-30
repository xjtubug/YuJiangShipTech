import { Client } from 'minio';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = Number(process.env.MINIO_PORT || '9000');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'admin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '12345678';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'yujiangshiptech';
const MINIO_PUBLIC_URL =
  process.env.MINIO_PUBLIC_URL ||
  `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT}`;

export const minioBucket = MINIO_BUCKET;

export const minioClient = new Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

let ensureBucketPromise: Promise<void> | null = null;

export function getMinioPublicUrl(objectName: string): string {
  const normalized = objectName.replace(/^\/+/, '');
  return `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${normalized}`;
}

export function getObjectNameFromUrl(url: string): string {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/^\/+/, '');
      const bucketPrefix = `${MINIO_BUCKET}/`;
      if (pathname.startsWith(bucketPrefix)) {
        return pathname.slice(bucketPrefix.length);
      }
      return pathname;
    } catch {
      return url;
    }
  }

  return url.replace(/^\/+/, '');
}

export async function ensureMinioBucket(): Promise<void> {
  if (!ensureBucketPromise) {
    ensureBucketPromise = (async () => {
      const exists = await minioClient.bucketExists(MINIO_BUCKET);

      if (!exists) {
        await minioClient.makeBucket(MINIO_BUCKET, 'us-east-1');
      }

      const publicPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(
        MINIO_BUCKET,
        JSON.stringify(publicPolicy),
      );
    })().catch((error) => {
      ensureBucketPromise = null;
      throw error;
    });
  }

  await ensureBucketPromise;
}

export async function uploadBufferToMinio(
  objectName: string,
  buffer: Buffer,
  metaData: Record<string, string> = {},
): Promise<string> {
  await ensureMinioBucket();
  await minioClient.putObject(MINIO_BUCKET, objectName, buffer, buffer.length, metaData);
  return getMinioPublicUrl(objectName);
}

export async function removeObjectFromMinio(urlOrObjectName: string): Promise<void> {
  const objectName = getObjectNameFromUrl(urlOrObjectName);
  if (!objectName) return;

  await ensureMinioBucket();
  await minioClient.removeObject(MINIO_BUCKET, objectName);
}
