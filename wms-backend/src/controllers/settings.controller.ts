import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { systemSettingService } from '../services/systemSetting.service';
import { businessTypeService } from '../services/businessType.service';
import { createOperationLog } from '../services/operationLog.service';

export const settingsController = {
  /**
   * 获取所有系统设置（分组）
   */
  getAllSettings: async (req: AuthRequest, res: Response) => {
    try {
      // 只有管理员可以查看所有设置（包括私有）
      const includePrivate = req.userRole === 'admin';
      const settings = await systemSettingService.getAll(includePrivate);

      res.json({
        success: true,
        data: settings,
        message: '获取成功',
      });
    } catch (error: any) {
      console.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  },

  /**
   * 根据键获取设置
   */
  getSettingByKey: async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await systemSettingService.getByKey(key);

      if (!setting) {
        return res.status(404).json({
          success: false,
          message: '设置不存在',
        });
      }

      // 如果是私有设置，只允许管理员访问
      if (!setting.isPublic && req.userRole !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '无权访问此设置',
        });
      }

      res.json({
        success: true,
        data: setting,
        message: '获取成功',
      });
    } catch (error: any) {
      console.error('Get setting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  },

  /**
   * 根据分类获取设置
   */
  getSettingsByCategory: async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.params;
      const includePrivate = req.userRole === 'admin';
      const settings = await systemSettingService.getByCategory(category, includePrivate);

      res.json({
        success: true,
        data: settings,
        message: '获取成功',
      });
    } catch (error: any) {
      console.error('Get settings by category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  },

  /**
   * 更新或创建设置
   */
  upsertSetting: async (req: AuthRequest, res: Response) => {
    try {
      const { settingKey, settingValue, category, description, isPublic } = req.body;

      if (!settingKey || !category) {
        return res.status(400).json({
          success: false,
          message: 'settingKey和category是必需的',
        });
      }

      const setting = await systemSettingService.upsert(
        settingKey,
        settingValue,
        category,
        description,
        isPublic,
        req.userId,
        req.username
      );

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'system_setting',
        action: 'update',
        targetId: setting.id,
        targetNo: settingKey,
        description: `更新系统设置: ${settingKey}`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        data: setting,
        message: '保存成功',
      });
    } catch (error: any) {
      console.error('Upsert setting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '保存失败',
      });
    }
  },

  /**
   * 批量更新设置
   */
  batchUpdateSettings: async (req: AuthRequest, res: Response) => {
    try {
      const { settings } = req.body;

      console.log('收到批量更新设置请求:', {
        settingsCount: settings?.length,
        userId: req.userId,
        username: req.username,
        settings: settings,
      });

      if (!Array.isArray(settings) || settings.length === 0) {
        console.error('设置数据格式错误:', settings);
        return res.status(400).json({
          success: false,
          message: 'settings必须是非空数组',
        });
      }

      const results = await systemSettingService.batchUpdate(
        settings,
        req.userId,
        req.username
      );

      console.log('批量更新设置成功:', results.length);

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'system_setting',
        action: 'update',
        targetId: null,
        targetNo: null,
        description: `批量更新系统设置，共${results.length}项`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        data: results,
        message: `成功更新${results.length}个设置`,
      });
    } catch (error: any) {
      console.error('Batch update settings error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '批量更新失败',
      });
    }
  },

  /**
   * 删除设置
   */
  deleteSetting: async (req: AuthRequest, res: Response) => {
    try {
      const { key } = req.params;
      await systemSettingService.delete(key);

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error: any) {
      console.error('Delete setting error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除失败',
      });
    }
  },

  // ============= 业务类型管理 =============

  /**
   * 获取所有业务类型
   */
  getAllBusinessTypes: async (req: AuthRequest, res: Response) => {
    try {
      const { category, activeOnly } = req.query;
      const types = await businessTypeService.getAll(
        category as string,
        activeOnly === 'true'
      );

      res.json({
        success: true,
        data: types,
        message: '获取成功',
      });
    } catch (error: any) {
      console.error('Get business types error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  },

  /**
   * 根据分类获取业务类型
   */
  getBusinessTypesByCategory: async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.params;
      const { activeOnly } = req.query;
      const types = await businessTypeService.getByCategory(
        category,
        activeOnly !== 'false'
      );

      res.json({
        success: true,
        data: types,
        message: '获取成功',
      });
    } catch (error: any) {
      console.error('Get business types by category error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取失败',
      });
    }
  },

  /**
   * 创建业务类型
   */
  createBusinessType: async (req: AuthRequest, res: Response) => {
    try {
      const { code, name, category, description, color, sortOrder, isActive } = req.body;

      if (!code || !name || !category) {
        return res.status(400).json({
          success: false,
          message: 'code、name和category是必需的',
        });
      }

      // 检查 code 是否已存在
      const existingType = await businessTypeService.getByCode(code);
      if (existingType) {
        return res.status(400).json({
          success: false,
          message: `类型代码 "${code}" 已存在，请使用其他代码`,
        });
      }

      const type = await businessTypeService.create({
        code,
        name,
        category,
        description,
        color,
        sortOrder,
        isActive,
      });

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'business_type',
        action: 'create',
        targetId: type.id,
        targetNo: code,
        description: `创建业务类型: ${name} (${code})`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        data: type,
        message: '创建成功',
      });
    } catch (error: any) {
      console.error('Create business type error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '创建失败',
      });
    }
  },

  /**
   * 更新业务类型
   */
  updateBusinessType: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, color, sortOrder, isActive } = req.body;

      const type = await businessTypeService.update(parseInt(id), {
        name,
        description,
        color,
        sortOrder,
        isActive,
      });

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'business_type',
        action: 'update',
        targetId: type.id,
        targetNo: type.code,
        description: `更新业务类型: ${type.name} (${type.code})`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        data: type,
        message: '更新成功',
      });
    } catch (error: any) {
      console.error('Update business type error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '更新失败',
      });
    }
  },

  /**
   * 删除业务类型
   */
  deleteBusinessType: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const typeId = parseInt(id);

      // 先获取业务类型信息，用于记录日志
      const type = await businessTypeService.getById(typeId);
      if (!type) {
        return res.status(404).json({
          success: false,
          message: '业务类型不存在',
        });
      }

      await businessTypeService.delete(typeId);

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'business_type',
        action: 'delete',
        targetId: typeId,
        targetNo: type.code,
        description: `删除业务类型: ${type.name} (${type.code})`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error: any) {
      console.error('Delete business type error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '删除失败',
      });
    }
  },

  /**
   * 切换业务类型启用状态
   */
  toggleBusinessType: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const type = await businessTypeService.toggleActive(parseInt(id), isActive);

      // 记录操作日志
      await createOperationLog({
        operatorId: req.userId,
        operatorName: req.username || '未知用户',
        module: 'business_type',
        action: 'update',
        targetId: type.id,
        targetNo: type.code,
        description: `${isActive ? '启用' : '禁用'}业务类型: ${type.name} (${type.code})`,
      }).catch((err) => console.error('Log error:', err));

      res.json({
        success: true,
        data: type,
        message: isActive ? '启用成功' : '禁用成功',
      });
    } catch (error: any) {
      console.error('Toggle business type error:', error);
      res.status(500).json({
        success: false,
        message: error.message || '操作失败',
      });
    }
  },
};
