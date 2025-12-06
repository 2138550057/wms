import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// 所有库位路由都需要认证
router.use(authMiddleware);

// 获取可用库位列表（用于下拉选择）
router.get('/active', locationController.getActiveLocations);

// 获取库位筛选选项
router.get('/filter-options', locationController.getLocationFilterOptions);

// 创建库位
router.post('/', locationController.createLocation);

// 批量创建库位
router.post('/batch', locationController.batchCreateLocations);

// 批量删除库位
router.post('/batch-delete', locationController.batchDeleteLocations);

// 查询库位列表
router.get('/', locationController.getLocations);

// 获取库位详情
router.get('/:id', locationController.getLocationById);

// 更新库位
router.put('/:id', locationController.updateLocation);

// 删除库位
router.delete('/:id', locationController.deleteLocation);

export default router;
