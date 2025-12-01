import api from './api';
import { Inventory, PaginatedResponse, ApiResponse } from '../types';

export const inventoryAPI = {
  // 获取库存列表
  list: (params?: {
    page?: number;
    size?: number;
    customerId?: number;
    customerName?: string;
    sku?: string;
    productName?: string;
    locationCode?: string;
  }) =>
    api.get<PaginatedResponse<Inventory>>('/inventory', { params }),

  // 获取库存详情
  getById: (id: number) =>
    api.get<ApiResponse<Inventory>>(`/inventory/${id}`),

  // 库存调整
  adjust: (data: { id: number; adjustQuantity: number; remark?: string }) =>
    api.post<ApiResponse<Inventory>>('/inventory/adjust', data),

  // 冻结库存
  lock: (data: { id: number; lockQuantity: number }) =>
    api.post<ApiResponse<Inventory>>('/inventory/lock', data),

  // 解冻库存
  unlock: (data: { id: number; unlockQuantity: number }) =>
    api.post<ApiResponse<Inventory>>('/inventory/unlock', data),

  // 获取客户库存汇总
  getSummaryByCustomer: (customerId: number) =>
    api.get(`/inventory/summary/customer/${customerId}`),

  // 删除库存记录
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/inventory/${id}`),

  // 批量删除库存记录
  batchDelete: (ids: number[]) =>
    api.post<ApiResponse<{ count: number }>>('/inventory/batch-delete', { ids }),
};
