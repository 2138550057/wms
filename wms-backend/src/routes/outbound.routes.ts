import { Router } from 'express';
import * as outboundController from '../controllers/outbound.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有出库路由都需要认证
router.use(authMiddleware);

// 检查库存
router.post('/check-stock', outboundController.checkStock);

// 创建出库单
router.post('/orders', outboundController.createOutboundOrder);

// 查询出库单列表
router.get('/orders', outboundController.getOutboundOrders);

// 获取出库单详情
router.get('/orders/:id', outboundController.getOutboundOrderById);

// 更新出库单
router.put('/orders/:id', outboundController.updateOutboundOrder);

// 确认出库
router.post('/orders/:id/confirm', outboundController.confirmOutboundOrder);

// 反审核出库单
router.post('/orders/:id/reverse-audit', outboundController.reverseAuditOutboundOrder);

// 删除出库单
router.delete('/orders/:id', outboundController.deleteOutboundOrder);

export default router;
