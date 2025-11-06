//src/utils/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors to handle tokens, errors, etc.
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// ✅ --- NEW UPLOAD FUNCTION ADDED BELOW ---

/**
 * Uploads an image file or blob to the backend's /api/upload/image endpoint.
 * @param file The file or blob to upload.
 * @returns The public S3 URL of the uploaded file.
 */
export const uploadImage = async (file: File | Blob): Promise<string> => {
  const formData = new FormData();
  // Set a default filename for blobs from the canvas
  const fileName = file instanceof File ? file.name : 'inpainting-mask.png';
  formData.append('file', file, fileName);

  try {
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.url;
  } catch (error) {
    console.error('Image upload failed:', error);
    // Pass along a more specific error message if the server provides one
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || 'Could not upload image.');
    }
    throw new Error('Could not upload image.');
  }
};

export default api;