// src/utils/imgUrl.ts

type ImageType = 'profile' | 'cover' | 'post';

interface MediaItem {
  url?: string; // Full URL (could be S3 path-style, virtual-hosted, or other)
  key?: string; // S3 object key (e.g., "profile/filename.jpg" or just "filename.jpg")
}

type ImageInput = string | MediaItem | null | undefined;

// --- Define S3 components separately ---
// IMPORTANT: Ensure these exactly match your S3 bucket name and region!
const S3_BUCKET_NAME = 'trippy.wtf';
const S3_REGION = 'us-east-1';

// Construct the path-style base URL for S3 objects
// Format: https://s3.{region}.amazonaws.com/{bucket-name}
const S3_PATH_STYLE_BASE_URL = `https://s3.${S3_REGION}.amazonaws.com/${S3_BUCKET_NAME}`;
// This will be: https://s3.us-east-1.amazonaws.com/trippy.wtf

// S3 folder paths. This map is used if the input 'key' is just a filename
// and does not include the folder prefix.
const S3_TYPE_TO_FOLDER_MAP: Record<ImageType, string> = {
  profile: 'profile',
  cover: 'covers',
  post: 'posts',
};

// LOCAL Next.js public paths for default images (served from your Next.js app's /public folder)
const DEFAULT_IMAGE_PATHS: Record<ImageType, string> = {
  profile: '/images/default-avatar.png',
  cover: '/images/default-cover.png',
  post: '/images/default-post-placeholder.png', // Make sure this file exists
};

// Filenames that specifically signify that a local default image path should be used
const DEFAULT_PLACEHOLDER_FILENAMES = new Set([
  'default-avatar.png',
  'default-cover.png',
  'default.png',
]);

// Your backend URL for specific cases like localhost replacement
const HEROKU_BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://fakebook-backend-a2a77a290552.herokuapp.com';

export const getFullImageUrl = (input: ImageInput, type: ImageType = 'profile'): string => {
  // 1. Handle null, undefined, or empty string input by returning the local default path
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 2. Handle MediaItem object input
  if (typeof input === 'object' && input !== null) {
    if (input.url && (input.url.startsWith('http://') || input.url.startsWith('https://'))) {
      // If it's an old S3 virtual-hosted URL for *your* bucket, convert to path-style
      const virtualHostedPattern = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;
      if (input.url.startsWith(virtualHostedPattern)) {
          const s3Key = input.url.substring(virtualHostedPattern.length);
          return `${S3_PATH_STYLE_BASE_URL}/${s3Key}`;
      }
      return input.url; // Return other full URLs as is
    }
    if (input.key) {
      const s3KeyFromMediaItem = input.key;
      const s3Url = `${S3_PATH_STYLE_BASE_URL}/${s3KeyFromMediaItem}`;
      return s3Url;
    }
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 3. Handle string input
  if (typeof input === 'string') {
    const trimmedInput = input.trim();

    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      const virtualHostedPattern = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;
      if (trimmedInput.startsWith(virtualHostedPattern)) {
          const s3Key = trimmedInput.substring(virtualHostedPattern.length);
          return `${S3_PATH_STYLE_BASE_URL}/${s3Key}`;
      }
      if (trimmedInput.startsWith('http://localhost:5000') && process.env.NODE_ENV === 'production') {
        return trimmedInput.replace('http://localhost:5000', HEROKU_BACKEND_URL);
      }
      return trimmedInput;
    }

    if (DEFAULT_PLACEHOLDER_FILENAMES.has(trimmedInput)) {
      return DEFAULT_IMAGE_PATHS[type];
    }

    let s3KeyToUse = trimmedInput;
    const typeFolder = S3_TYPE_TO_FOLDER_MAP[type];
    if (typeFolder && !s3KeyToUse.includes('/') && !s3KeyToUse.startsWith(typeFolder + '/')) {
      s3KeyToUse = `${typeFolder}/${trimmedInput}`;
    }
    const s3Url = `${S3_PATH_STYLE_BASE_URL}/${s3KeyToUse}`;
    return s3Url;
  }

  return DEFAULT_IMAGE_PATHS[type];
};

// Convenience functions
export const getProfileImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'profile');
export const getCoverImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'cover');
export const getPostImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'post');