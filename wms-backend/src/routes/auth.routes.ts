import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware, adminOnly } from '../middlewares/auth';

const router = Router();

// 公开路由（无需认证）
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/captcha', authController.getCaptcha);

// 需要认证的路由
router.get('/current', authMiddleware, authController.getCurrentUser);
router.post('/change-password', authMiddleware, authController.changePassword);

// 需要管理员权限的路由
router.get('/users', authMiddleware, adminOnly, authController.getUsers);

export default router;
