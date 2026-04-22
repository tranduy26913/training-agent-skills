import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError, handleError } from '../../utils/response.util';

const authService = new AuthService();

// 認証コントローラー / Authentication controller
export class AuthController {
  // ログイン処理 / Handle login request
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    if (!result) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }
    sendSuccess(res, result);
  }

  // 現在のユーザー情報取得 / Get current authenticated user info
  async me(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    if (!user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    sendSuccess(res, user);
  }

  /**
   * Update the authenticated user's own profile.
   * 認証済みユーザー自身のプロフィールを更新する。
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const updated = await authService.updateProfile(userId, req.body);
      sendSuccess(res, updated);
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Change the authenticated user's own password.
   * 認証済みユーザー自身のパスワードを変更する。
   */
  async changeMyPassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      await authService.changePassword(userId, req.body);
      sendSuccess(res, { message: 'Password updated successfully' });
    } catch (error) {
      handleError(res, error);
    }
  }
}
