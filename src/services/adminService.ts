import axiosInstance from '../utils/api'; 
import { User } from '../types/user'; 
import { Role } from '../config/roles'; 
interface AllUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}

/**
 * Fetches all users from the admin API endpoint.
 * @param page - The page number for pagination.
 * @param limit - The number of users per page.
 * @param search - A search term to filter users.
 * @returns A promise that resolves to the list of users and pagination info.
 */
export const getAllUsers = async (page = 1, limit = 10, search = ''): Promise<AllUsersResponse> => {
  // Create a query string from the parameters
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  });

  // Make the API call
  const response = await axiosInstance.get(`/admin/users?${params.toString()}`);
  
  // Return the data from the response
  return response.data;
};

/**
 * Deletes a user by their ID via the admin API endpoint.
 * @param userId - The ID of the user to delete.
 */
export const deleteUserById = async (userId: string): Promise<void> => {
  await axiosInstance.delete(`/admin/users/${userId}`);
};

/**
 * Updates a user's role by their ID.
 * @param userId - The ID of the user to update.
 * @param role - The new role to assign.
 */
export const updateUserRole = async (userId: string, role: Role): Promise<User> => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/role`, { role });
  return response.data.user; // Assuming the backend returns the updated user
};

/**
 * Toggles a user's active status by their ID.
 * @param userId - The ID of the user to update.
 */
export const toggleUserStatus = async (userId: string): Promise<User> => {
  const response = await axiosInstance.patch(`/admin/users/${userId}/status`);
  return response.data.user; // Assuming the backend returns the updated user
};

/**
 * Fetches a single user's details by their ID.
 * @param userId - The ID of the user to fetch.
 */
export const getUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get(`/admin/users/${userId}`);
  return response.data;
}