import { Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '@utils/response.util';
import { getAuthUser, getAuthUserId } from '@utils/auth.util';
import type { AuthenticatedRequest } from '@types-express';

const authService = new AuthService();

// Authentication controller.
export class AuthController {
  // Handle login request.
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    if (!result) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }
    sendSuccess(res, result);
  }

  // Get current authenticated user info.
  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = getAuthUser(req);
    if (!user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    sendSuccess(res, user);
  }

  // Update the authenticated user's own profile.
  async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = getAuthUserId(req);
    if (userId === null) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const updated = await authService.updateProfile(userId, req.body);
    sendSuccess(res, updated);
  }

  // Change the authenticated user's own password.
  async changeMyPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = getAuthUserId(req);
    if (userId === null) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    await authService.changePassword(userId, req.body);
    sendSuccess(res, { message: 'Password updated successfully' });
  }
}
