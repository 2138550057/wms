import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { settingsController } from '../controllers/settings.controller';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

// ============= 系统设置路由 =============

// 获取所有设置（分组）
router.get('/settings', settingsController.getAllSettings);

// 根据分类获取设置
router.get('/settings/category/:category', settingsController.getSettingsByCategory);

// 根据键获取设置
router.get('/settings/:key', settingsController.getSettingByKey);

// 更新或创建设置（需要管理员权限）
router.post('/settings', settingsController.upsertSetting);

// 批量更新设置（需要管理员权限）
router.post('/settings/batch', settingsController.batchUpdateSettings);

// 删除设置（需要管理员权限）
router.delete('/settings/:key', settingsController.deleteSetting);

// ============= 业务类型路由 =============

// 获取所有业务类型
router.get('/business-types', settingsController.getAllBusinessTypes);

// 根据分类获取业务类型
router.get('/business-types/category/:category', settingsController.getBusinessTypesByCategory);

// 创建业务类型（需要管理员权限）
router.post('/business-types', settingsController.createBusinessType);

// 更新业务类型（需要管理员权限）
router.put('/business-types/:id', settingsController.updateBusinessType);

// 切换业务类型启用状态（需要管理员权限）
router.patch('/business-types/:id/toggle', settingsController.toggleBusinessType);

// 删除业务类型（需要管理员权限）
router.delete('/business-types/:id', settingsController.deleteBusinessType);

export default router;
