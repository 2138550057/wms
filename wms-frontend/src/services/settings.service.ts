import api from './api';
import { SystemSetting, BusinessType, BusinessTypeFormData } from '../types';

export const settingsAPI = {
  // ============= 系统设置 =============

  /**
   * 获取所有系统设置（按分类分组）
   */
  async getAllSettings(): Promise<{
    success: boolean;
    data: Record<string, SystemSetting[]>;
    message: string;
  }> {
    return await api.get('/system/settings');
  },

  /**
   * 根据键获取设置
   */
  async getSettingByKey(
    key: string
  ): Promise<{ success: boolean; data: SystemSetting; message: string }> {
    return await api.get(`/system/settings/${key}`);
  },

  /**
   * 根据分类获取设置
   */
  async getSettingsByCategory(
    category: string
  ): Promise<{ success: boolean; data: SystemSetting[]; message: string }> {
    return await api.get(`/system/settings/category/${category}`);
  },

  /**
   * 更新或创建设置
   */
  async upsertSetting(data: {
    settingKey: string;
    settingValue: any;
    category: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<{ success: boolean; data: SystemSetting; message: string }> {
    return await api.post('/system/settings', data);
  },

  /**
   * 批量更新设置
   */
  async batchUpdateSettings(
    settings: Array<{
      settingKey: string;
      settingValue: any;
      category: string;
      description?: string;
      isPublic?: boolean;
    }>
  ): Promise<{ success: boolean; data: SystemSetting[]; message: string }> {
    return await api.post('/system/settings/batch', { settings });
  },

  /**
   * 删除设置
   */
  async deleteSetting(key: string): Promise<{ success: boolean; message: string }> {
    return await api.delete(`/system/settings/${key}`);
  },

  // ============= 业务类型 =============

  /**
   * 获取所有业务类型
   */
  async getAllBusinessTypes(params?: {
    category?: string;
    activeOnly?: boolean;
  }): Promise<{ success: boolean; data: BusinessType[]; message: string }> {
    return await api.get('/system/business-types', { params });
  },

  /**
   * 根据分类获取业务类型
   */
  async getBusinessTypesByCategory(
    category: string,
    activeOnly: boolean = true
  ): Promise<{ success: boolean; data: BusinessType[]; message: string }> {
    return await api.get(`/system/business-types/category/${category}`, {
      params: { activeOnly },
    });
  },

  /**
   * 创建业务类型
   */
  async createBusinessType(
    data: BusinessTypeFormData
  ): Promise<{ success: boolean; data: BusinessType; message: string }> {
    return await api.post('/system/business-types', data);
  },

  /**
   * 更新业务类型
   */
  async updateBusinessType(
    id: number,
    data: Partial<BusinessTypeFormData>
  ): Promise<{ success: boolean; data: BusinessType; message: string }> {
    return await api.put(`/system/business-types/${id}`, data);
  },

  /**
   * 切换业务类型启用状态
   */
  async toggleBusinessType(
    id: number,
    isActive: boolean
  ): Promise<{ success: boolean; data: BusinessType; message: string }> {
    return await api.patch(`/system/business-types/${id}/toggle`, { isActive });
  },

  /**
   * 删除业务类型
   */
  async deleteBusinessType(id: number): Promise<{ success: boolean; message: string }> {
    return await api.delete(`/system/business-types/${id}`);
  },
};

export default settingsAPI;
