import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有库存路由都需要认证
router.use(authMiddleware);

// 查询库存列表
router.get('/', inventoryController.getInventoryList);

// 获取库存详情
router.get('/:id', inventoryController.getInventoryById);

// 库存调整
router.post('/adjust', inventoryController.adjustInventory);

// 冻结库存
router.post('/lock', inventoryController.lockInventory);

// 解冻库存
router.post('/unlock', inventoryController.unlockInventory);

// 获取客户库存汇总
router.get('/summary/customer/:customerId', inventoryController.getInventorySummaryByCustomer);

// 批量删除库存记录
router.post('/batch-delete', inventoryController.batchDeleteInventory);

// 删除库存记录
router.delete('/:id', inventoryController.deleteInventory);

export default router;
