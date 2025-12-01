import { Router } from 'express';
import * as inboundController from '../controllers/inbound.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有入库路由都需要认证
router.use(authMiddleware);

// 创建入库单
router.post('/orders', inboundController.createInboundOrder);

// 查询入库单列表
router.get('/orders', inboundController.getInboundOrders);

// 获取入库单详情
router.get('/orders/:id', inboundController.getInboundOrderById);

// 更新入库单
router.put('/orders/:id', inboundController.updateInboundOrder);

// 确认入库
router.post('/orders/:id/confirm', inboundController.confirmInboundOrder);

// 反审核入库单
router.post('/orders/:id/reverse-audit', inboundController.reverseAuditInboundOrder);

// 删除入库单
router.delete('/orders/:id', inboundController.deleteInboundOrder);

export default router;
