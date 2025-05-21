// Helper to construct full image URLs

// Define image types as a union type
type ImageType = 'profile' | 'cover' | 'post';

// Define media item interface to match your backend schema
interface MediaItem {
  url: string;
  key: string;
  type: string;
  originalFilename?: string;
}

// Define possible input types
type ImageInput = string | MediaItem | null | undefined;

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
 * Processes a URL string to ensure it's properly formatted
 * 
 * @param urlString - The URL string to process
 * @param type - The type of image (profile, cover, or post)
 * @returns The processed URL string
 */
const processUrlString = (urlString: string, type: ImageType): string => {
  const trimmedInput = urlString.trim();

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

/**
 * Generates a full URL for an image based on its type and filename or MediaItem
 * 
 * @param input - The filename, URL, or MediaItem object
 * @param type - The type of image (profile, cover, or post)
 * @returns The full URL of the image
 */
export const getFullImageUrl = (input: ImageInput, type: ImageType = 'profile'): string => {
  // Handle null or undefined input
  if (!input) {
    return DEFAULT_IMAGE_MAP[type];
  }

  // Handle MediaItem object
  if (typeof input === 'object') {
    // If the object has a url property, use that
    if ('url' in input && typeof input.url === 'string') {
      return processUrlString(input.url, type);
    }
    
    // If the object has a key property but no url, generate URL from key
    if ('key' in input && typeof input.key === 'string') {
      // Extract the filename from the key (e.g., "posts/filename.jpg" → "filename.jpg")
      const parts = input.key.split('/');
      const filename = parts[parts.length - 1];
      
      // Use the folder from the key if possible
      let folderType = type;
      if (input.key.startsWith('profile/')) folderType = 'profile';
      else if (input.key.startsWith('covers/')) folderType = 'cover';
      else if (input.key.startsWith('posts/')) folderType = 'post';
      
      return processUrlString(filename, folderType);
    }
    
    // If we couldn't extract a URL, return the default
    return DEFAULT_IMAGE_MAP[type];
  }

  // Handle string input
  return processUrlString(input, type);
};

/**
 * Convenience function for getting a profile image URL
 */
export const getProfileImageUrl = (input: ImageInput): string => {
  return getFullImageUrl(input, 'profile');
};

/**
 * Convenience function for getting a cover image URL
 */
export const getCoverImageUrl = (input: ImageInput): string => {
  return getFullImageUrl(input, 'cover');
};

/**
 * Convenience function for getting a post image URL
 */
export const getPostImageUrl = (input: ImageInput): string => {
  return getFullImageUrl(input, 'post');
};