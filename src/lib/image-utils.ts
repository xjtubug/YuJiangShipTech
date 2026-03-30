/**
 * Image / file display helpers for the media management system.
 *
 * All MinIO images are served through /api/image-proxy to avoid
 * browser CORS issues and Next.js Image optimization fetch failures.
 */

const MINIO_PUBLIC_URL =
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ||
  process.env.MINIO_PUBLIC_URL ||
  'http://localhost:9000';
const MINIO_BUCKET =
  process.env.NEXT_PUBLIC_MINIO_BUCKET ||
  process.env.MINIO_BUCKET ||
  'yujiangshiptech';

/**
 * Extract the object path from a URL or raw path.
 * e.g. "http://localhost:9000/yujiangshiptech/uploads/img.jpg" → "uploads/img.jpg"
 *      "/uploads/img.jpg" → "uploads/img.jpg"
 *      "uploads/img.jpg"  → "uploads/img.jpg"
 *      "img.jpg"          → "uploads/img.jpg"
 */
function extractObjectPath(url: string): string {
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
  if (url.startsWith('/uploads/')) return url.slice(1);
  if (url.startsWith('uploads/')) return url;
  return `uploads/${url}`;
}

function joinMinioUrl(objectPath: string): string {
  return `${MINIO_PUBLIC_URL.replace(/\/$/, '')}/${MINIO_BUCKET}/${objectPath.replace(/^\/+/, '')}`;
}

/**
 * Convert any image reference to a proxy URL served through our API.
 * This ensures Next.js Image component can always fetch images reliably.
 */
export function getImageUrl(url: string): string {
  if (!url) return '';

  const objectPath = extractObjectPath(url);
  return `/api/image-proxy?path=${encodeURIComponent(objectPath)}`;
}

/**
 * Get the direct MinIO URL (for server-side use or non-Image-component contexts).
 */
export function getDirectMinioUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return joinMinioUrl(url.slice(1));
  if (url.startsWith('uploads/')) return joinMinioUrl(url);
  return joinMinioUrl(`uploads/${url}`);
}

export function getOptimizedUrl(url: string): string {
  if (!url) return '';
  const objectPath = extractObjectPath(url);
  const lastDot = objectPath.lastIndexOf('.');
  if (lastDot === -1) return getImageUrl(objectPath);
  const optimizedPath = `${objectPath.substring(0, lastDot)}_optimized.webp`;
  return `/api/image-proxy?path=${encodeURIComponent(optimizedPath)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isImageFile(mimeType: string): boolean {
  return /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i.test(mimeType);
}

export function isVideoFile(mimeType: string): boolean {
  return /^video\/(mp4|webm|ogg)$/i.test(mimeType);
}
