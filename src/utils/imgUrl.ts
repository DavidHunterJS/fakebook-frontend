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
  profile: 'profile', // e.g., results in "profile/filename.jpg"
  cover: 'covers',    // e.g., results in "covers/filename.jpg"
  post: 'posts',      // e.g., results in "posts/filename.jpg"
};

// LOCAL Next.js public paths for default images (served from your Next.js app's /public folder)
const DEFAULT_IMAGE_PATHS: Record<ImageType, string> = {
  profile: '/images/default-avatar.png', // Must exist at public/images/default-avatar.png
  cover: '/images/default-cover.png',   // Must exist at public/images/default-cover.png
  post: '/images/default-post-placeholder.png', // Must exist at public/images/default-post-placeholder.png
};

// Filenames that specifically signify that a local default image path should be used
const DEFAULT_PLACEHOLDER_FILENAMES = new Set([
  'default-avatar.png',
  'default-cover.png',
  'default.png', // Any other generic default filenames you might store in the DB
]);

// Your backend URL for specific cases like localhost replacement (less critical if S3 is primary)
const HEROKU_BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://fakebook-backend-a2a77a290552.herokuapp.com';

export const getFullImageUrl = (input: ImageInput, type: ImageType = 'profile'): string => {
  // 1. Handle null, undefined, or empty string input by returning the local default path
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    // console.log(`[getFullImageUrl] Input is empty or null/undefined. Returning default for type: ${type}`);
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 2. Handle MediaItem object input
  if (typeof input === 'object' && input !== null) {
    // If the object already has a full, valid URL, use it.
    if (input.url && (input.url.startsWith('http://') || input.url.startsWith('https://'))) {
      // console.log(`[getFullImageUrl] Input is MediaItem with full URL: ${input.url}`);
      return input.url; // This could already be an S3 URL (path-style or virtual-hosted) or any other URL
    }
    // If the object has an S3 key, construct the path-style S3 URL
    if (input.key) {
      const s3KeyFromMediaItem = input.key; // Assume key from MediaItem is the full S3 key including any folder
      const s3Url = `${S3_PATH_STYLE_BASE_URL}/${s3KeyFromMediaItem}`;
      // console.log(`[getFullImageUrl] Input is MediaItem with key "${input.key}". Constructed Path-Style S3 URL: ${s3Url}`);
      return s3Url;
    }
    // Fallback for MediaItem if no usable url or key
    // console.log(`[getFullImageUrl] Input is MediaItem but no usable URL/key. Returning default for type: ${type}`);
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 3. Handle string input
  if (typeof input === 'string') {
    const trimmedInput = input.trim();

    // If it's already a full HTTP/HTTPS URL
    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      // Safety net: If it's an old S3 virtual-hosted URL for *your* bucket, convert to path-style
      const virtualHostedPattern = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/`;
      if (trimmedInput.startsWith(virtualHostedPattern)) {
        const s3Key = trimmedInput.substring(virtualHostedPattern.length);
        const pathStyleUrl = `${S3_PATH_STYLE_BASE_URL}/${s3Key}`;
        // console.log(`[getFullImageUrl] Converted virtual-hosted S3 URL to path-style: ${pathStyleUrl}`);
        return pathStyleUrl;
      }
      // Replace localhost backend URLs if in production (if backend serves some images, not S3 ones)
      if (trimmedInput.startsWith('http://localhost:5000') && process.env.NODE_ENV === 'production') {
        const fixedUrl = trimmedInput.replace('http://localhost:5000', HEROKU_BACKEND_URL);
        // console.log(`[getFullImageUrl] Input is localhost URL, replaced for prod: ${fixedUrl}`);
        return fixedUrl;
      }
      // console.log(`[getFullImageUrl] Input is already a full URL: ${trimmedInput}`);
      return trimmedInput; // Return other full URLs as is
    }

    // If it's one of the known placeholder filenames indicating a local default is needed
    if (DEFAULT_PLACEHOLDER_FILENAMES.has(trimmedInput)) {
      // console.log(`[getFullImageUrl] Input string "${trimmedInput}" is a default placeholder. Returning default for type: ${type}`);
      return DEFAULT_IMAGE_PATHS[type];
    }

    // Otherwise, assume it's an S3 key and construct the S3 URL using PATH-STYLE
    let s3KeyToUse = trimmedInput;
    const typeFolder = S3_TYPE_TO_FOLDER_MAP[type]; // e.g., 'profile', 'covers', 'posts'

    // If the key doesn't already seem to include a folder structure (i.e., no slashes)
    // AND it doesn't already start with the specific folder for its type, then prepend the folder.
    // This helps if DB stores "image.jpg" but S3 has "profile/image.jpg".
    if (typeFolder && !s3KeyToUse.includes('/') && !s3KeyToUse.startsWith(typeFolder + '/')) {
      s3KeyToUse = `${typeFolder}/${trimmedInput}`;
    }
    // If s3KeyToUse was already "profile/image.jpg", it remains unchanged by the condition above.

    const s3Url = `${S3_PATH_STYLE_BASE_URL}/${s3KeyToUse}`;
    // console.log(`[getFullImageUrl S3 KEY PROCESSING] Input: "${trimmedInput}", Type: "${type}", Determined S3 Key: "${s3KeyToUse}", Final Path-Style URL: "${s3Url}"`);
    return s3Url;
  }

  // Fallback for any unexpected input types (though TypeScript should prevent this)
  // console.warn(`[getFullImageUrl] Unexpected input type. Returning default for type: ${type}`);
  return DEFAULT_IMAGE_PATHS[type];
};

// Convenience functions (these remain the same)
export const getProfileImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'profile');
export const getCoverImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'cover');
export const getPostImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'post');