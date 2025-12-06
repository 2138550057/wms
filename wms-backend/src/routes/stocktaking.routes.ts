import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  getLayout,
  generateLayout,
  updateLayoutBatch,
  createLayoutElement,
  updateLayoutElement,
  deleteLayoutElement,
  getLocationSummary,
  getAllLocationsSummary,
  updateInventoryLocation,
  batchUpdateInventoryLocation,
  getUnassignedInventory,
} from '../controllers/stocktaking.controller';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// 布局相关
router.get('/layout', getLayout);
router.post('/layout/generate', generateLayout);
router.post('/layout/batch', updateLayoutBatch);
router.post('/layout', createLayoutElement);
router.put('/layout/:id', updateLayoutElement);
router.delete('/layout/:id', deleteLayoutElement);

// 库位统计
router.get('/locations/summary', getAllLocationsSummary);
router.get('/location/:code/summary', getLocationSummary);

// 库存库位操作
router.put('/inventory/:id/location', updateInventoryLocation);
router.post('/inventory/batch-location', batchUpdateInventoryLocation);
router.get('/inventory/unassigned', getUnassignedInventory);

export default router;
