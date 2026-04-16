import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response.util';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    if (!result) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }
    sendSuccess(res, result);
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    if (!user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    sendSuccess(res, user);
  }
}
