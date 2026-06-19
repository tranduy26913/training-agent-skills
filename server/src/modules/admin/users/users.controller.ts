import { Response } from 'express';
import { UsersService } from './users.service';
import { sendSuccess, handleError } from '@utils/response.util';
import type { AuthenticatedRequest } from '@types-express';

const usersService = new UsersService();

export class UsersController {
  // ユーザー一覧取征E/ Get paginated list of users
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        search: req.query.search as string | undefined,
        role: req.query.role as string | undefined,
        status: req.query.status as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const result = await usersService.getUsers(filters);
      sendSuccess(res, result);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ユーザー取征E/ Get single user by ID
  async getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const user = await usersService.getUser(id);
      sendSuccess(res, user);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ユーザー作�E / Create a new user
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const user = await usersService.createUser(req.body, adminId);
      sendSuccess(res, user, 201);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ユーザー更新 / Update an existing user
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminId = req.user!.userId;
      const user = await usersService.updateUser(id, req.body, adminId);
      sendSuccess(res, user);
    } catch (error) {
      handleError(res, error);
    }
  }

  // ユーザー削除 / Delete a user
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const adminId = req.user!.userId;
      await usersService.deleteUser(id, adminId);
      sendSuccess(res, { message: 'User deleted successfully' });
    } catch (error) {
      handleError(res, error);
    }
  }

  // メール重褁E��ェチE�� / Check if email is already in use
  async checkEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const email = req.query.email as string;
      const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined;
      const isDuplicate = await usersService.checkEmailDuplicate(email, excludeId);
      sendSuccess(res, { exists: isDuplicate });
    } catch (error) {
      handleError(res, error);
    }
  }

  // ユーザーアクチE��ビティ取征E/ Get audit logs for a user
  async getUserActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const logs = await usersService.getUserActivity(id, limit);
      sendSuccess(res, logs);
    } catch (error) {
      handleError(res, error);
    }
  }
}

