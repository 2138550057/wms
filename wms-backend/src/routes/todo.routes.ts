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

// 获取入库单详情（移动端）
router.get('/inbound/by-no/:orderNo', todoController.getInboundDetailByNo);
router.get('/inbound/:id', todoController.getInboundDetail);

// 获取出库单详情（移动端）
router.get('/outbound/by-no/:orderNo', todoController.getOutboundDetailByNo);
router.get('/outbound/:id', todoController.getOutboundDetail);

// 移动端更新入库单明细（库位、实到数量）
router.put('/inbound/:id/items', todoController.updateInboundItems);

// 移动端确认入库
router.post('/inbound/:id/confirm', todoController.confirmInbound);

// 移动端确认出库
router.post('/outbound/:id/confirm', todoController.confirmOutbound);

export default router;
