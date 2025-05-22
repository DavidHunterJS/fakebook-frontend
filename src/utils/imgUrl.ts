// src/utils/imgUrl.ts

type ImageType = 'profile' | 'cover' | 'post';

interface MediaItem {
  url?: string;
  key?: string;
}

type ImageInput = string | MediaItem | null | undefined;

// IMPORTANT: Configure this with your actual S3 bucket URL structure
const S3_BUCKET_URL = `https://trippy.wtf.s3.us-east-1.amazonaws.com`;
// Example: const S3_BUCKET_URL = `https://trippy.wtf.s3.us-east-1.amazonaws.com`;

// S3 folder paths if you use them. If your keys already include these, adjust logic.
// const S3_TYPE_TO_FOLDER_MAP: Record<ImageType, string> = {
//   profile: 'profile',
//   cover: 'covers',
//   post: 'posts',
// };

// LOCAL Next.js public paths for default images
const DEFAULT_IMAGE_PATHS: Record<ImageType, string> = {
  profile: '/images/default-avatar.png', // Must exist at public/images/default-avatar.png
  cover: '/images/default-cover.png',   // Must exist at public/images/default-cover.png
  post: '/images/default-post-placeholder.png', // Must exist at public/images/default-post-placeholder.png
};

// Filenames that signify a local default image should be used
const DEFAULT_PLACEHOLDER_FILENAMES = new Set([
  'default-avatar.png',
  'default-cover.png',
  'default.png',
]);

// Your backend URL (only used if absolutely necessary, e.g. for localhost replacement or true backend static assets)
const HEROKU_BACKEND_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://fakebook-backend-a2a77a290552.herokuapp.com';

export const getFullImageUrl = (input: ImageInput, type: ImageType = 'profile'): string => {
  // 1. Handle null, undefined, or empty string input by returning the local default path
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    // console.log(`[getFullImageUrl] Input is empty. Returning default for type: ${type}`);
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 2. Handle MediaItem object input
  if (typeof input === 'object' && input !== null) {
    if (input.url && (input.url.startsWith('http://') || input.url.startsWith('https://'))) {
      // console.log(`[getFullImageUrl] Input is MediaItem with full URL: ${input.url}`);
      return input.url; // Already a full URL (likely S3 or from backend if it serves some)
    }
    if (input.key) {
      const s3Key = input.key; // Assume key from MediaItem is the full S3 key including folder
      const s3Url = `${S3_BUCKET_URL}/${s3Key}`;
      // console.log(`[getFullImageUrl] Input is MediaItem with key "${input.key}". Constructed S3 URL: ${s3Url}`);
      return s3Url;
    }
    // console.log(`[getFullImageUrl] Input is MediaItem but no URL/key. Returning default for type: ${type}`);
    return DEFAULT_IMAGE_PATHS[type];
  }

  // 3. Handle string input
  if (typeof input === 'string') {
    const trimmedInput = input.trim();

    // If it's already a full URL
    if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
      // Replace localhost backend URLs if in production and image is accidentally pointing there
      if (trimmedInput.startsWith('http://localhost:5000') && process.env.NODE_ENV === 'production') {
        const fixedUrl = trimmedInput.replace('http://localhost:5000', HEROKU_BACKEND_URL);
        // console.log(`[getFullImageUrl] Input is localhost URL, replaced for prod: ${fixedUrl}`);
        return fixedUrl;
      }
      // console.log(`[getFullImageUrl] Input is already a full URL: ${trimmedInput}`);
      return trimmedInput;
    }

    // If it's one of the known placeholder filenames indicating a local default is needed
    if (DEFAULT_PLACEHOLDER_FILENAMES.has(trimmedInput)) {
      // console.log(`[getFullImageUrl] Input string "${trimmedInput}" is a default placeholder. Returning default for type: ${type}`);
      return DEFAULT_IMAGE_PATHS[type];
    }

    // Otherwise, assume it's an S3 key.
    // The key stored in DB (e.g., user.profilePicture) should be the full S3 key path like "profile/filename.jpg"
    const s3Key = trimmedInput; // Assumes trimmedInput is the S3 key (e.g., "profile/image.jpg")
    const s3Url = `${S3_BUCKET_URL}/${s3Key}`;
    // console.log(`[getFullImageUrl] Input string "${trimmedInput}" assumed S3 key. Constructed S3 URL: ${s3Url}`);
    return s3Url;
  }

  // Fallback for unexpected input
  // console.warn(`[getFullImageUrl] Unexpected input type. Returning default for type: ${type}`);
  return DEFAULT_IMAGE_PATHS[type];
};

// Convenience functions
export const getProfileImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'profile');
export const getCoverImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'cover');
export const getPostImageUrl = (input: ImageInput): string => getFullImageUrl(input, 'post');