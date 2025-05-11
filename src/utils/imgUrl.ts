// Helper to construct full image URLs

// Define image types as a union type
type ImageType = 'profile' | 'cover' | 'post';

// Define a mapping of image types to their folder paths
const TYPE_TO_FOLDER_MAP: Record<ImageType, string> = {
  profile: 'profile',
  cover: 'XXX', // IMPORTANT: Using 'covers' (plural)
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

// Backend static URL from environment
const BACKEND_STATIC_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

/**
 * Generates a full URL for an image based on its type and filename
 * 
 * @param filenameOrUrl - The filename or URL of the image
 * @param type - The type of image (profile, cover, or post)
 * @returns The full URL of the image
 */
export const getFullImageUrl = (filenameOrUrl?: string, type: ImageType = 'profile'): string => {
  // If no filename is provided, return the default image for the specified type
  if (!filenameOrUrl) {
    return DEFAULT_IMAGE_MAP[type];
  }

  // Trim any whitespace from the input
  const trimmedInput = filenameOrUrl.trim();
  
  // If the input is already a URL, return it directly
  if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
    return trimmedInput;
  }
  
  // If the input is a default filename, return the corresponding default image
  if (DEFAULT_FILENAMES.has(trimmedInput)) {
    return DEFAULT_IMAGE_MAP[type === 'profile' ? 'profile' : 'cover'];
  }

  // Get the correct folder path for the image type
  const folderPath = TYPE_TO_FOLDER_MAP[type];
  
  // Log for debugging
  if (type === 'cover') {
    console.log(`Using "${folderPath}" (plural) for folder path of cover image`);
  }
  
  // Construct the full URL with a cache-busting timestamp
  const cacheBuster = `t=${Date.now()}`;
  const fullUrl = `${BACKEND_STATIC_URL}/uploads/${folderPath}/${trimmedInput}?${cacheBuster}`;
  
  // Log details for debugging
  console.log(`[getFullImageUrl] Type: "${type}", FolderPath: "${folderPath}", Final URL: "${fullUrl}"`);
  
  return fullUrl;
};