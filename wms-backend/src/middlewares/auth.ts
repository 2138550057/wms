import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
  username?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    // 获取用户名
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { username: true },
    });
    req.username = user?.username || '未知用户';

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '认证失败' });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: '权限不足' });
  }
  next();
}

// Alias for authMiddleware
export const authenticate = authMiddleware;

// Factory function to require specific role
export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.userRole !== role) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    next();
  };
}
