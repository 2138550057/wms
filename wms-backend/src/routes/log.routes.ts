import { Router } from 'express';
import * as logController from '../controllers/log.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有日志路由都需要认证
router.use(authMiddleware);

// 操作日志
router.get('/operations', logController.getOperationLogs);

// 入库日志
router.get('/inbound', logController.getInboundLogs);

// 出库日志
router.get('/outbound', logController.getOutboundLogs);

// 库存管理日志（综合）
router.get('/inventory', logController.getInventoryLogs);

export default router;
