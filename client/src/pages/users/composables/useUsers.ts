// Users API composable wrapper.
import { usersApiService } from '@services/users.service';
import type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog } from '@apptypes/users.types';
import type { PaginatedData } from '@apptypes/api.types';

// Re-export types for component usage.
export type { User, CreateUserDto, UpdateUserDto, UserFilters, AuditLog };
export type { PaginationInfo } from '@apptypes/api.types';

// Thin API wrappers for user endpoints.
export function useUsers() {
  // Get filtered user list.
  async function getUsers(filters?: UserFilters): Promise<PaginatedData<User>> {
    return usersApiService.getUsers(filters);
  }

  // Get a single user.
  async function getUser(id: number): Promise<User> {
    return usersApiService.getById(id);
  }

  // Create a user.
  async function createUser(data: CreateUserDto): Promise<User> {
    return usersApiService.create(data);
  }

  // Update a user.
  async function updateUser(id: number, data: UpdateUserDto): Promise<User> {
    return usersApiService.update(id, data);
  }

  // Delete a user.
  async function deleteUser(id: number): Promise<void> {
    return usersApiService.delete(id);
  }

  // Get user audit logs.
  async function getUserActivity(id: number, limit?: number): Promise<AuditLog[]> {
    return usersApiService.getUserActivity(id, limit);
  }

  return { getUsers, getUser, createUser, updateUser, deleteUser, getUserActivity };
}