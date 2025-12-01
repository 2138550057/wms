import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, requireRole } from '../middlewares/auth';

const router = Router();

// 当前用户相关(需要登录)
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);

// 用户管理相关(需要管理员权限)
router.get('/', authenticate, requireRole('admin'), userController.getUsers);
router.get('/:id', authenticate, requireRole('admin'), userController.getUserById);
router.post('/', authenticate, requireRole('admin'), userController.createUser);
router.put('/:id', authenticate, requireRole('admin'), userController.updateUser);
router.delete('/:id', authenticate, requireRole('admin'), userController.deleteUser);

export default router;
