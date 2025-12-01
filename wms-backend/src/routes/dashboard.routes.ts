import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 获取仪表盘统计数据
router.get('/stats', authMiddleware, dashboardController.getDashboardStats);

export default router;
