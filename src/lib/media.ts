/**
 * Media normalization utilities.
 *
 * Automatically transforms various raw links (including Google Drive share links)
 * into direct, high-speed CDN URLs suitable for <img> and <video>/<iframe> tags.
 */

/**
 * Normalizes an image URL.
 * If a Google Drive share link is passed, it automatically converts it into
 * Google's high-resolution thumbnail/CDN endpoint (sz=w1920) so it renders directly.
 *
 * Requirements for Google Drive links:
 * - The file in Drive must be shared as "Anyone with the link can view".
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w1920`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or /uc?id=FILE_ID
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (driveIdMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${driveIdMatch[1]}&sz=w1920`;
  }

  // Pattern 3: https://lh3.googleusercontent.com/d/FILE_ID
  const driveShortMatch = trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (driveShortMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${driveShortMatch[1]}&sz=w1920`;
  }

  return trimmed;
}

export interface VideoSource {
  url: string;
  isIframe: boolean;
}

/**
 * Normalizes a video URL.
 * If a Google Drive share link is passed, it converts it to the embeddable
 * /preview iframe URL because Drive does not allow raw byte-range streaming
 * on standard sharing URLs without rate limiting or cookies.
 */
export function normalizeVideoUrl(url?: string | null): VideoSource {
  if (!url) return { url: "", isIframe: false };
  const trimmed = url.trim();

  // Check Google Drive
  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  const driveIdMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  const fileId = driveFileMatch?.[1] || driveIdMatch?.[1];

  if (fileId) {
    return {
      url: `https://drive.google.com/file/d/${fileId}/preview`,
      isIframe: true,
    };
  }

  // YouTube links (watch, embed, short)
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (ytMatch?.[1]) {
    return {
      url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0`,
      isIframe: true,
    };
  }

  // Standard direct video URL (.mp4, .webm, etc.)
  return {
    url: trimmed,
    isIframe: false,
  };
}
