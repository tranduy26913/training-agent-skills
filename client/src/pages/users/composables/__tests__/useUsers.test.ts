/**
 * Unit tests for useUsers composable.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUsers } from '@pages/users/composables/useUsers';
import type { CreateUserDto } from '@apptypes/users.types';

// ---- Service mock ----
const usersServiceMocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUserActivity: vi.fn(),
}));

vi.mock('@services/users.service', () => ({
  usersApiService: usersServiceMocks,
}));

describe('useUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // F-COMP-01: getUsers calls the correct endpoint
  it('calls getUsers with correct params', async () => {
    const filters = { page: 1, limit: 20 };
    usersServiceMocks.getUsers.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    });

    const { getUsers } = useUsers();
    await getUsers(filters);

    expect(usersServiceMocks.getUsers).toHaveBeenCalledWith(filters);
  });

  // F-COMP-02: createUser calls POST
  it('calls create with correct data', async () => {
    const data: CreateUserDto = { name: 'Test', email: 'test@example.com', role: 'user', status: 'active' };
    usersServiceMocks.create.mockResolvedValue({ id: 1, ...data });

    const { createUser } = useUsers();
    await createUser(data);

    expect(usersServiceMocks.create).toHaveBeenCalledWith(data);
  });

  // F-COMP-03: updateUser calls PUT with id
  it('calls update with id and data', async () => {
    const data: CreateUserDto = { name: 'Updated', email: 'updated@example.com', role: 'user', status: 'active' };
    usersServiceMocks.update.mockResolvedValue({ id: 5, ...data });

    const { updateUser } = useUsers();
    await updateUser(5, data);

    expect(usersServiceMocks.update).toHaveBeenCalledWith(5, data);
  });

  // F-COMP-04: deleteUser calls DELETE
  it('calls delete with id', async () => {
    usersServiceMocks.delete.mockResolvedValue(undefined);

    const { deleteUser } = useUsers();
    await deleteUser(3);

    expect(usersServiceMocks.delete).toHaveBeenCalledWith(3);
  });

  // F-COMP-05: getUserActivity calls the activity endpoint
  it('calls getUserActivity with id', async () => {
    usersServiceMocks.getUserActivity.mockResolvedValue([]);

    const { getUserActivity } = useUsers();
    await getUserActivity(2);

    expect(usersServiceMocks.getUserActivity).toHaveBeenCalledWith(2, undefined);
  });
});