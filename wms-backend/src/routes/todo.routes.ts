import { Router } from 'express';
import * as todoController from '../controllers/todo.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有待办路由都需要认证
router.use(authMiddleware);

// 获取待办订单列表
router.get('/pending', todoController.getPendingOrders);

// 获取待办数量
router.get('/count', todoController.getPendingCount);

// 移动端确认入库
router.post('/inbound/:id/confirm', todoController.confirmInbound);

// 移动端确认出库
router.post('/outbound/:id/confirm', todoController.confirmOutbound);

export default router;
