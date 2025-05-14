// Helper to construct full image URLs

// Define image types as a union type
type ImageType = 'profile' | 'cover' | 'post';

// Define a mapping of image types to their folder paths
const TYPE_TO_FOLDER_MAP: Record<ImageType, string> = {
  profile: 'profile',
  cover: 'covers', // IMPORTANT: Using 'covers' (plural)
  post: 'posts'
};

// Define a mapping of image types to their default image paths
const DEFAULT_IMAGE_MAP: Record<ImageType, string> = {
  profile: '/images/default-avatar.png',
  cover: '/images/default-cover.png',
  post: '/images/default-post-placeholder.png'
};

// Define default names that should be mapped to default images
const DEFAULT_FILENAMES = new Set(['default-avatar.png', 'default-cover.png']);

// Backend static URL from environment - use hardcoded Heroku URL as fallback for reliability
const BACKEND_STATIC_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://fakebook-backend-a2a77a290552.herokuapp.com';

// Production backend URL for replacing localhost references
const PRODUCTION_BACKEND_URL = 'https://fakebook-backend-a2a77a290552.herokuapp.com';

/**
 * Generates a full URL for an image based on its type and filename
 * 
 * @param filenameOrUrl - The filename or URL of the image
 * @param type - The type of image (profile, cover, or post)
 * @returns The full URL of the image
 */
export const getFullImageUrl = (filenameOrUrl?: string, type: ImageType = 'profile'): string => {
  if (!filenameOrUrl) {
    return DEFAULT_IMAGE_MAP[type];
  }

  const trimmedInput = filenameOrUrl.trim();

  // Check for localhost and replace only in production
  if (trimmedInput.startsWith('http://localhost:5000/')) {
    if (process.env.NODE_ENV === 'production') {
      const fixedUrl = trimmedInput.replace('http://localhost:5000', PRODUCTION_BACKEND_URL);
      console.log(`[getFullImageUrl] Replacing localhost URL: "${trimmedInput}" → "${fixedUrl}"`);
      return fixedUrl;
    }
    return trimmedInput; // In development, keep localhost URL
  }

  if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
    return trimmedInput;
  }

  if (DEFAULT_FILENAMES.has(trimmedInput)) {
    return DEFAULT_IMAGE_MAP[type === 'profile' ? 'profile' : 'cover'];
  }

  const folderPath = TYPE_TO_FOLDER_MAP[type];
  const cacheBuster = `t=${Date.now()}`;
  const fullUrl = `${BACKEND_STATIC_URL}/uploads/${folderPath}/${trimmedInput}?${cacheBuster}`;

  console.log(`[getFullImageUrl] Type: "${type}", FolderPath: "${folderPath}", Final URL: "${fullUrl}"`);
  return fullUrl;
};